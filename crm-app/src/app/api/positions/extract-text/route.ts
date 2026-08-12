import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// ═══════════════════════════════════════════════════════
//  POST /api/positions/extract-text
//  מקבל קובץ (PDF / DOCX / DOC / XLSX / XLS / TXT)
//  ומחזיר טקסט גולמי לשימוש ב-bulk-parse
// ═══════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "לא סופק קובץ" }, { status: 400 })
    }

    // בדיקת גודל - מקסימום 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "הקובץ גדול מ-25MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const allowedExts = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "text", "csv"]

    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: `סוג קובץ לא נתמך: .${ext}` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ""

    if (ext === "pdf") {
      extractedText = await extractPdf(buffer)
    } else if (ext === "docx") {
      extractedText = await extractDocx(buffer)
    } else if (ext === "doc") {
      extractedText = await extractDoc(buffer)
    } else if (ext === "xlsx" || ext === "xls") {
      extractedText = await extractExcel(buffer)
    } else if (ext === "csv") {
      extractedText = buffer.toString("utf-8")
    } else {
      // txt / text
      extractedText = buffer.toString("utf-8")
    }

    if (!extractedText || extractedText.trim().length < 5) {
      return NextResponse.json(
        { error: "לא ניתן לחלץ טקסט מהקובץ" },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      text: extractedText.trim(),
      chars: extractedText.trim().length,
      fileName: file.name,
    })
  } catch (error) {
    console.error("extract-text error:", error)
    return NextResponse.json({ error: "שגיאה בחילוץ הטקסט" }, { status: 500 })
  }
}

// ── PDF ──────────────────────────────────────────────────
async function extractPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse")
  const data = await pdfParse(buffer)
  return data.text || ""
}

// ── DOCX ─────────────────────────────────────────────────
async function extractDocx(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ""
}

// ── DOC (legacy Word) ────────────────────────────────────
async function extractDoc(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth")
  try {
    const result = await mammoth.extractRawText({ buffer })
    if (result.value?.trim()) return result.value
  } catch {
    // mammoth לא תמיד עובד עם .doc ישן
  }
  // fallback - קריאת UTF-8 גולמי ב-best-effort
  return buffer.toString("utf-8").replace(/[^\x20-\x7E\u0080-\u05FF\n\r\t]/g, " ")
}

// ── XLSX / XLS ────────────────────────────────────────────
async function extractExcel(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx")
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const lines: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    // קרא כ-CSV
    const csv: string = XLSX.utils.sheet_to_csv(ws, { blankrows: false })
    if (csv.trim()) {
      lines.push(`[גיליון: ${sheetName}]`)
      lines.push(csv)
      lines.push("")
    }
  }

  return lines.join("\n")
}
