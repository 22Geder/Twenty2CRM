export const EMAIL_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const MANUAL_UPLOAD_MAX_BYTES = 25 * 1024 * 1024

const JOB_FILE_EXTENSIONS = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "text", "csv"] as const

const MIME_BY_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  doc: ["application/msword"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  xls: ["application/vnd.ms-excel"],
  txt: ["text/plain"],
  text: ["text/plain"],
  csv: ["text/csv", "text/plain"],
}

export type SupportedJobFileExt = (typeof JOB_FILE_EXTENSIONS)[number]

export function fileExtension(fileName?: string | null) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || ""
  return ext
}

export function isSupportedJobFile(fileName?: string | null, mimeType?: string | null) {
  const ext = fileExtension(fileName)
  if (!JOB_FILE_EXTENSIONS.includes(ext as SupportedJobFileExt)) return false
  if (!mimeType) return true
  const allowed = MIME_BY_EXT[ext] || []
  const normalized = mimeType.toLowerCase().split(";")[0].trim()
  return allowed.includes(normalized) || normalized === "application/octet-stream"
}

export function isAttachmentTooLarge(size?: number | null, maxBytes = EMAIL_ATTACHMENT_MAX_BYTES) {
  return typeof size === "number" && size > maxBytes
}

export function sanitizeExtractedText(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>|<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function extractTextFromJobFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileExtension(fileName)
  let extractedText = ""

  if (ext === "pdf") extractedText = await extractPdf(buffer)
  else if (ext === "docx") extractedText = await extractDocx(buffer)
  else if (ext === "doc") extractedText = await extractDoc(buffer)
  else if (ext === "xlsx" || ext === "xls") extractedText = await extractExcel(buffer)
  else if (ext === "csv" || ext === "txt" || ext === "text") extractedText = buffer.toString("utf-8")

  return sanitizeExtractedText(extractedText)
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse")
  const data = await pdfParse(buffer)
  return data.text || ""
}

async function extractDocx(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ""
}

async function extractDoc(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth")
  try {
    const result = await mammoth.extractRawText({ buffer })
    if (result.value?.trim()) return result.value
  } catch {
    // mammoth לא תמיד עובד עם .doc ישן
  }
  return buffer.toString("utf-8").replace(/[^\x20-\x7E\u0080-\u05FF\n\r\t]/g, " ")
}

async function extractExcel(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx")
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const lines: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    const csv: string = XLSX.utils.sheet_to_csv(ws, { blankrows: false })
    if (csv.trim()) {
      lines.push(`[גיליון: ${sheetName}]`)
      lines.push(csv)
      lines.push("")
    }
  }

  return lines.join("\n")
}
