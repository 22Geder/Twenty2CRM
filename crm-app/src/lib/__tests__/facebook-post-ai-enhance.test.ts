import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enhanceFacebookPostWithGemini } from '../gemini-ai'

const provider = vi.hoisted(() => {
  const generateContent = vi.fn()
  return { generateContent, getGenerativeModel: vi.fn(() => ({ generateContent })) }
})

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = provider.getGenerativeModel
  },
}))

function response(value: unknown) {
  return { response: { text: () => JSON.stringify(value) } }
}

beforeEach(() => {
  provider.generateContent.mockReset()
  provider.getGenerativeModel.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('enhanceFacebookPostWithGemini', () => {
  it('מחזיר את התוכן המשודרג כאשר Gemini מחזיר JSON תקין ללא חריגת grounding', async () => {
    const original = 'מחפשים עובד מחסן באשדוד, משרה מיידית'
    provider.generateContent.mockResolvedValueOnce(response({ enhancedContent: '🔥 מחפשים עובד מחסן באשדוד! משרה מיידית, הצטרפו עכשיו' }))

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result.addedStructure).toBe(true)
    expect(result.enhancedContent).toContain('מחסן')
  })

  it('חוזר לטקסט המקורי אם Gemini הוסיף טלפון שלא היה במקור (grounding)', async () => {
    const original = 'מחפשים עובד מחסן באשדוד'
    provider.generateContent.mockResolvedValueOnce(response({ enhancedContent: 'מחפשים עובד מחסן באשדוד, התקשרו 0501234567' }))

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result.addedStructure).toBe(false)
    expect(result.enhancedContent).toBe(original)
  })

  it('חוזר לטקסט המקורי אם Gemini הוסיף סכום שכר שלא היה במקור (grounding)', async () => {
    const original = 'מחפשים עובד מחסן באשדוד'
    provider.generateContent.mockResolvedValueOnce(response({ enhancedContent: 'מחפשים עובד מחסן באשדוד, שכר 45 ₪ לשעה' }))

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result.addedStructure).toBe(false)
    expect(result.enhancedContent).toBe(original)
  })

  it('לא נדחה אם הטלפון/השכר כבר הופיעו במקור (grounding תקין)', async () => {
    const original = 'משרה באשדוד, שכר 45 ₪ לשעה, התקשרו 0501234567'
    provider.generateContent.mockResolvedValueOnce(response({ enhancedContent: '🔥 משרה חמה באשדוד! שכר 45 ₪ לשעה, התקשרו עכשיו 0501234567' }))

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result.addedStructure).toBe(true)
  })

  it('fallback שקט לטקסט המקורי כאשר Gemini זורק שגיאה', async () => {
    const original = 'תוכן מקורי לדוגמה'
    provider.generateContent.mockRejectedValueOnce(new Error('network error'))

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result).toEqual({ enhancedContent: original, addedStructure: false })
  })

  it('fallback כאשר התשובה אינה JSON תקין', async () => {
    const original = 'תוכן מקורי לדוגמה'
    provider.generateContent.mockResolvedValueOnce({ response: { text: () => 'not json at all' } })

    const result = await enhanceFacebookPostWithGemini(original)

    expect(result).toEqual({ enhancedContent: original, addedStructure: false })
  })

  it('מחרוזת ריקה מוחזרת כפי שהיא ללא קריאה ל-Gemini', async () => {
    const result = await enhanceFacebookPostWithGemini('   ')

    expect(result.addedStructure).toBe(false)
    expect(provider.generateContent).not.toHaveBeenCalled()
  })
})
