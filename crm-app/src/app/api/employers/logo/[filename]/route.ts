import { NextRequest, NextResponse } from "next/server"
import { readFile, realpath, stat } from "fs/promises"
import path from "path"
import { requireApiUser } from "@/lib/api-authorization"
import { getEmployerLogosPath, isEmployerLogoFilename } from "@/lib/employer-logo"
import { inlineFileDisposition, isPathWithin, resolveUploadPath } from "@/lib/safe-file-path"

const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

type RouteContext = { params: Promise<{ filename: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const { filename } = await context.params
    if (!isEmployerLogoFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400, headers: privateHeaders })
    }

    const base = getEmployerLogosPath()
    const fullPath = resolveUploadPath(base, [filename])
    if (!fullPath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403, headers: privateHeaders })
    }

    let canonicalPath: string
    try {
      const [canonicalBase, canonicalFile] = await Promise.all([realpath(base), realpath(fullPath)])
      if (!isPathWithin(canonicalBase, canonicalFile)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403, headers: privateHeaders })
      }
      canonicalPath = canonicalFile
      if (!(await stat(canonicalPath)).isFile()) {
        return NextResponse.json({ error: "File not found" }, { status: 404, headers: privateHeaders })
      }
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers: privateHeaders })
    }

    const fileBuffer = await readFile(canonicalPath)
    const ext = path.extname(filename).toLowerCase()
    return new NextResponse(fileBuffer, {
      headers: {
        ...privateHeaders,
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Content-Disposition": inlineFileDisposition(filename),
      },
    })
  } catch {
    console.error("[employer-logo] Failed to serve logo")
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500, headers: privateHeaders })
  }
}
