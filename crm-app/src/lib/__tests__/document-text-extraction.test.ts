import { describe, expect, it } from "vitest"
import {
  EMAIL_ATTACHMENT_MAX_BYTES,
  isAttachmentTooLarge,
  isSupportedJobFile,
} from "../document-text-extraction"

describe("isSupportedJobFile", () => {
  it("מקבל PDF/DOCX/XLSX לפי סיומת ו-MIME", () => {
    expect(isSupportedJobFile("jobs.pdf", "application/pdf")).toBe(true)
    expect(isSupportedJobFile("jobs.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true)
    expect(isSupportedJobFile("jobs.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true)
  })

  it("דוחה קבצים לא נתמכים", () => {
    expect(isSupportedJobFile("photo.png", "image/png")).toBe(false)
    expect(isSupportedJobFile("archive.zip", "application/zip")).toBe(false)
  })
})

describe("isAttachmentTooLarge", () => {
  it("מגביל קובץ מייל ל-10MB", () => {
    expect(EMAIL_ATTACHMENT_MAX_BYTES).toBe(10 * 1024 * 1024)
    expect(isAttachmentTooLarge(10 * 1024 * 1024 + 1)).toBe(true)
    expect(isAttachmentTooLarge(10 * 1024 * 1024)).toBe(false)
  })
})
