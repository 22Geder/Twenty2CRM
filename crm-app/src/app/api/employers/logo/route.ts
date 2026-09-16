import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { promises as fs } from "fs"
import path from "path"
import { requireApiUser } from "@/lib/api-authorization"
import {
  employerLogoUrl,
  getEmployerLogoFormat,
  getEmployerLogosPath,
  isEmployerLogoFilename,
  isValidEmployerLogoBytes,
  MAX_EMPLOYER_LOGO_BYTES,
} from "@/lib/employer-logo"

const headers = { "Cache-Control": "private, no-store" }

function hasFileErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === code
}

export async function POST(request: NextRequest) {
  const createdPaths: string[] = []
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: "Invalid upload data", code: "INVALID_FORM_DATA" }, { status: 400, headers })
    }

    const file = formData.get("file")
    if (typeof file === "string" || !file || file.size === 0) {
      return NextResponse.json({ error: "A logo file is required", code: "INVALID_FILE" }, { status: 400, headers })
    }
    if (file.size > MAX_EMPLOYER_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo must be at most 2MB", code: "FILE_TOO_LARGE" }, { status: 413, headers })
    }

    const format = getEmployerLogoFormat(file)
    if (!format) {
      return NextResponse.json({ error: "Unsupported file type", code: "UNSUPPORTED_FILE_TYPE" }, { status: 415, headers })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length !== file.size || !isValidEmployerLogoBytes(bytes, format.kind)) {
      return NextResponse.json({ error: "File content does not match its type", code: "INVALID_FILE_CONTENT" }, { status: 415, headers })
    }

    const uploadDir = getEmployerLogosPath()
    await fs.mkdir(uploadDir, { recursive: true })
    const filename = `${randomUUID()}${format.extension}`
    const filepath = path.join(uploadDir, filename)
    const handle = await fs.open(filepath, "wx")
    createdPaths.push(filepath)
    try {
      await handle.writeFile(bytes)
    } finally {
      await handle.close()
    }

    return NextResponse.json({
      success: true,
      url: employerLogoUrl(filename),
      filename,
    }, { headers })
  } catch {
    const cleanup = await Promise.allSettled(createdPaths.map((filepath) => fs.unlink(filepath)))
    if (cleanup.some((result) => result.status === "rejected")) {
      console.error("[employer-logo] Upload cleanup failed")
    }
    console.error("[employer-logo] Upload failed")
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500, headers })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authorization = await requireApiUser("ADMIN")
    if ("response" in authorization) return authorization.response

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")
    if (!filename || !isEmployerLogoFilename(filename)) {
      return NextResponse.json({ error: "A valid filename is required", code: "INVALID_FILENAME" }, { status: 400, headers })
    }

    const filepath = path.join(getEmployerLogosPath(), filename)
    await fs.unlink(filepath)
    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    if (hasFileErrorCode(error, "ENOENT")) {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers })
    }
    console.error("[employer-logo] Delete failed")
    return NextResponse.json({ error: "Failed to delete logo" }, { status: 500, headers })
  }
}
