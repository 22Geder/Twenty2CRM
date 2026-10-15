import { GoogleGenerativeAI } from '@google/generative-ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MATCHING_PROVIDER_TIMEOUT_MS,
  matchingProviderBoolean,
  matchingProviderEnum,
  matchingProviderNumber,
  matchingProviderObject,
  matchingProviderString,
  matchingProviderStrings,
  parseMatchingProviderObject,
  redactMatchingProviderInput,
} from '../matching-provider-safety-guards'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network access') }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('pure matching provider safety guards', () => {
  it.each([
    '{"summary":"text {with braces}"}',
    '```json\n{"summary":"text {with braces}"}\n```',
    'Analysis follows:\n{"summary":"text {with braces}"}\nEnd of analysis.',
  ])('keeps object JSON and supported presentation wrappers: %s', (text) => {
    expect(parseMatchingProviderObject(text)).toEqual({ summary: 'text {with braces}' })
  })

  it.each([
    'null', 'false', '42', '"text"', '[]', '[{"score":100}]',
    '```json\n[{"score":100}]\n```', 'Response: [{"score":100}]',
    '{"private":{"score":100}', '{"score":100} trailing invalid data',
    '{"score":90}{"score":100}', 'private broken JSON',
  ])('rejects malformed/non-object roots with a static error: %s', (text) => {
    expect(() => parseMatchingProviderObject(text)).toThrow('Invalid matching provider JSON')
  })

  it('rejects wrong types without coercion and keeps safe fallbacks', () => {
    expect(matchingProviderObject(null)).toEqual({})
    expect(matchingProviderObject([1])).toEqual({})
    expect(matchingProviderString({ private: 'value' }, 'fallback')).toBe('fallback')
    expect(matchingProviderString('   ', 'fallback')).toBe('fallback')
    expect(matchingProviderBoolean('false')).toBe(false)
    expect(matchingProviderBoolean(false, true)).toBe(false)
    expect(matchingProviderEnum('invented', ['mid', 'senior'], 'mid')).toBe('mid')
  })

  it('deduplicates trimmed strings case-insensitively without mutating the source', () => {
    const source = [' SAP ', null, 'sap', {}, '', 'ניהול', ' ניהול ', 'WMS']
    expect(matchingProviderStrings(source)).toEqual(['SAP', 'ניהול', 'WMS'])
    expect(source).toEqual([' SAP ', null, 'sap', {}, '', 'ניהול', ' ניהול ', 'WMS'])
    expect(matchingProviderStrings('SAP')).toEqual([])
  })

  it.each([NaN, Infinity, -Infinity, '100', null, {}])('treats non-finite and nonnumeric values as missing (%s)', (value) => {
    expect(matchingProviderNumber(value, 5, 0, 10)).toBe(5)
  })

  it('preserves fractional numbers and clamps numeric bounds', () => {
    expect(matchingProviderNumber(4.5)).toBe(4.5)
    expect(matchingProviderNumber(-3)).toBe(0)
    expect(matchingProviderNumber(200, 0, 0, 100)).toBe(100)
    expect(matchingProviderNumber(0, 5, 1, 10)).toBe(1)
  })

  it.each(['0501234567', '050-123-4567', '+972501234567', '+972 50 123 4567', '02-1234567'])('removes common local contact formats (%s)', (phone) => {
    expect(redactMatchingProviderInput(`SAP ${phone} fixture+cv@example.invalid`)).toBe('SAP [PHONE] [EMAIL]')
  })

  it('preserves professional information and date ranges while redacting known identifiers', () => {
    const source = 'מועמד לדוגמה\nרחוב בדיקה 77\nSAP, C++, .NET\n2020-2024\n01/02/2024'
    expect(redactMatchingProviderInput(source, ['מועמד לדוגמה', 'רחוב בדיקה 77'])).toBe('[REDACTED]\n[REDACTED]\nSAP, C++, .NET\n2020-2024\n01/02/2024')
    expect(redactMatchingProviderInput('לא צוין ניסיון', ['לא צוין', ''])).toBe('לא צוין ניסיון')
  })
})

describe('installed Gemini SDK timeout contract with mocked fetch only', () => {
  it('aborts its actual fetch signal at the configured deadline without any network request', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      if (!init?.signal) {
        reject(new Error('SDK omitted its timeout signal'))
        return
      }
      init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)
    const model = new GoogleGenerativeAI('synthetic-test-key-not-a-credential').getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { timeout: MATCHING_PROVIDER_TIMEOUT_MS },
    )
    const pending = expect(model.generateContent('synthetic test prompt')).rejects.toThrow(/aborted/i)
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const signal = fetchMock.mock.calls[0][1]?.signal
    expect(signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(MATCHING_PROVIDER_TIMEOUT_MS - 1)
    expect(signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(signal?.aborted).toBe(true)
  })
})