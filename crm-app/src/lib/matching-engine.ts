import { DEFAULT_RADIUS_KM, describePositionGeography, evaluateMatchingLocation, extractMentionedCities, type MatchingLocationResult, type PositionGeography } from './matching-location'
import {
  createMatchingTextIndex, findIndexedTermEvidence, getMatchingConcept,
  matchingEvidenceContext, normalizeMatchingText,
  type MatchingEvidence, type MatchingTextIndex,
} from './matching-text'

export const MATCHING_ENGINE_VERSION = 'evidence-v1'
export const MATCHING_WEIGHTS = { role: 35, skills: 25, requirements: 25, location: 15 } as const
export type MatchTag = { id?: string; name: string; color?: string | null }
export type MatchingCandidate = {
  id?: string
  name?: string | null
  city?: string | null
  currentTitle?: string | null
  resume?: string | null
  skills?: string | readonly string[] | null
  tags?: readonly MatchTag[]
  yearsOfExperience?: number | null
}
export type MatchingPosition = {
  id?: string
  title: string
  location?: string | null
  description?: string | null
  requirements?: string | readonly string[] | null
  keywords?: string | readonly string[] | null
  tags?: readonly MatchTag[]
  transportation?: string | null
  workHours?: string | null
  active?: boolean
  closedAt?: Date | string | null
}
export type EvidenceSource = 'resume' | 'currentTitle' | 'skills' | 'tags'
export type SourcedEvidence = MatchingEvidence & { source: EvidenceSource }
export type RequirementCheck = {
  text: string
  source: 'requirements' | 'description' | 'workHours' | 'transportation'
  start: number
  end: number
  importance: 'mandatory' | 'preferred' | 'unspecified'
  status: 'met' | 'contradicted' | 'unknown' | 'not_scored'
  reason: string
  evidence: SourcedEvidence[]
}
export type EvidenceMatch = {
  version: typeof MATCHING_ENGINE_VERSION
  score: number
  status: 'matched' | 'review' | 'insufficient_evidence' | 'ineligible'
  eligible: boolean | null
  shouldProceed: boolean
  professionalEvidence: boolean
  roleMatch: 'direct' | 'related' | 'metadata' | 'none'
  location: MatchingLocationResult
  breakdown: { role: number; skills: number; requirements: number; location: number }
  requirements: RequirementCheck[]
  evidence: SourcedEvidence[]
  matchingTerms: string[]
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  confidence: 'high' | 'medium' | 'low'
  semanticReview?: {
    status: 'complete' | 'partial' | 'unavailable'
    links: Array<{ kind: 'role' | 'skill'; candidate: SourcedEvidence; position: { source: 'title' | 'description' | 'requirements'; quote: string; start: number; end: number } }>
    message: string
  }
  coverage: {
    candidateCharacters: number
    positionCharacters: number
    candidateTextTruncated: false
    positionTextTruncated: false
    resumeQuality: 'missing' | 'limited' | 'readable' | 'unreadable'
    source: 'local-evidence'
    unsupportedRequirements: number
  }
}

type Source = { field: EvidenceSource; original: string; index: MatchingTextIndex }
export type PreparedMatchingCandidate = { input: MatchingCandidate; sources: Source[]; quality: EvidenceMatch['coverage']['resumeQuality']; resolvedCity: string | null; evidenceCache: Map<string, SourcedEvidence[]> }
type Requirement = Omit<RequirementCheck, 'status' | 'reason' | 'evidence'> & { index: MatchingTextIndex }
export type PreparedMatchingPosition = {
  input: MatchingPosition
  text: string
  index: MatchingTextIndex
  titleIndex: MatchingTextIndex
  requirements: Requirement[]
  skillTerms: string[]
  entryLevel: boolean
  locationCache: Map<string, MatchingLocationResult>
}

function textList(input: string | readonly string[] | null | undefined): string {
  if (Array.isArray(input)) return input.filter(value => typeof value === 'string').join('\n')
  if (typeof input !== 'string') return ''
  if (input.trim().startsWith('[')) {
    try {
      const value: unknown = JSON.parse(input)
      if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join('\n')
    } catch { /* טקסט לא תקין נשמר לבדיקה; אין דילוג על תוכן. */ }
  }
  return input
}

function professionalText(text: string, name?: string | null): string {
  let masked = text
  // זהות אינה כישור. המסכה שומרת אופסטים לציטוט מתוך המקור.
  if (name?.trim() && name.trim().length >= 2) masked = masked.split(name.trim()).join(' '.repeat(name.trim().length))
  return masked.split('\n').map(line => /(?:תאריך לידה|מצב משפחתי|תעודת זהות|מספר זהות|גיל|מין|מגדר|דת|לאום|date of birth|marital status|gender|religion|age)\s*[:：]/i.test(line) ? ' '.repeat(line.length) : line).join('\n')
}

function resumeQuality(resume: string): EvidenceMatch['coverage']['resumeQuality'] {
  if (!resume.trim()) return 'missing'
  const chars = [...resume].filter(char => !/\s/u.test(char))
  const letters = chars.filter(char => /\p{L}/u.test(char)).length
  const broken = chars.filter(char => /[\uFFFD\uE000-\uF8FF]/u.test(char)).length
  if (chars.length > 30 && (broken / chars.length > 0.1 || letters / chars.length < 0.25)) return 'unreadable'
  return letters < 80 ? 'limited' : 'readable'
}

export function prepareMatchingCandidate(input: MatchingCandidate): PreparedMatchingCandidate {
  const sources: Source[] = [
    { field: 'currentTitle', original: input.currentTitle ?? '' },
    { field: 'resume', original: input.resume ?? '' },
    { field: 'skills', original: textList(input.skills) },
    { field: 'tags', original: (input.tags ?? []).map(tag => tag.name).join('\n') },
  ].map(source => ({ ...source, field: source.field as EvidenceSource, index: createMatchingTextIndex(professionalText(source.original, input.name)) }))
  return { input, sources, quality: resumeQuality(input.resume ?? ''),
    resolvedCity: evaluateMatchingLocation({ candidateCity: input.city, candidateResume: input.resume }).candidateCity,
    evidenceCache: new Map(),
  }
}

const MANDATORY = /(?:^|[^א-תa-z])(?:חובה|נדרש|נדרשת|נדרשים|הכרחי|הכרחית|לפחות|must|required|mandatory|minimum)(?=$|[^א-תa-z])/i
const PREFERRED = /יתרון|עדיפות|רצוי|nice to have|preferred|advantage|optional|לא חובה|אינה חובה|not required/i
const NOT_REQUIRED = /ללא (?:צורך|חובת|דרישת)|אין (?:צורך|דרישה)|לא נדרש|not required|no .*required|ללא ניסיון|ללא נסיון|אין צורך בניסיון|no experience/i
const UNSCORED = /(?:^|[^\p{L}\p{N}])(?:גיל|מין|מגדר|דת|לאום|מצב משפחתי|נראות|מראה חיצוני|מוטיבציה|אישיות|אופי|תודעת שירות|יחסי אנוש|חריצות|age|gender|religion|personality|culture fit)(?=$|[^\p{L}\p{N}])/iu
const ENTRY_LEVEL = /ללא ניסיון|ללא נסיון|אין צורך בניסיון|אין צורך בנסיון|הכשרה על חשבון|הכשרה תינתן|no experience required|training provided/i

function requirementsFrom(text: string, source: Requirement['source']): Requirement[] {
  const result: Requirement[] = []
  let section: Requirement['importance'] = 'unspecified'
  // כל הסעיפים נשמרים, גם כשאין במילון כישור שמאפשר להכריע בהם.
  for (const match of text.matchAll(/[^\n\r;•]+/g)) {
    const raw = match[0]
    const heading = raw.trim().replace(/[:：]$/, '')
    if (/^(?:דרישות חובה|דרישות סף|חובה|must have|required qualifications)$/i.test(heading)) { section = 'mandatory'; continue }
    if (/^(?:יתרונות|יתרון|nice to have|preferred qualifications)$/i.test(heading)) { section = 'preferred'; continue }
    if (/^(?:דרישות(?: התפקיד| המשרה)?|requirements|qualifications)$/i.test(heading)) { section = 'unspecified'; continue }
    const inherited = MANDATORY.test(raw) && !PREFERRED.test(raw) && !NOT_REQUIRED.test(raw) ? 'mandatory'
      : PREFERRED.test(raw) && !MANDATORY.test(raw) ? 'preferred' : section
    for (const part of raw.matchAll(/[^,]+/g)) {
      const value = part[0].trim().replace(/^[-*–✓✅]+\s*/, '')
      if (!value) continue
      const mandatory = MANDATORY.test(value) && !PREFERRED.test(value) && !NOT_REQUIRED.test(value)
      const importance = mandatory ? 'mandatory' : PREFERRED.test(value) ? 'preferred' : inherited
      if (source === 'description' && importance === 'unspecified') continue
      const start = match.index! + part.index! + part[0].indexOf(value)
      result.push({ text: value, source, start, end: start + value.length, importance, index: createMatchingTextIndex(value) })
    }
  }
  return result
}

export function prepareMatchingPosition(input: MatchingPosition): PreparedMatchingPosition {
  const requirements = textList(input.requirements)
  const text = [input.title, input.description, requirements, input.workHours, input.transportation, textList(input.keywords), ...(input.tags ?? []).map(tag => tag.name)].filter(Boolean).join('\n')
  const seen = new Set<string>()
  const checks = [...requirementsFrom(requirements, 'requirements'), ...requirementsFrom(input.description ?? '', 'description'),
    ...requirementsFrom(input.workHours ?? '', 'workHours'), ...requirementsFrom(input.transportation ?? '', 'transportation')].filter(check => {
    const key = normalizeMatchingText(check.text)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return { input, text, index: createMatchingTextIndex(text), titleIndex: createMatchingTextIndex(input.title), requirements: checks,
    skillTerms: curatedSkillTerms(input), entryLevel: ENTRY_LEVEL.test(`${input.description ?? ''}\n${requirements}`), locationCache: new Map() }
}

const MAX_CURATED_SKILL_TERMS = 8
const GENERIC_KEYWORD = new Set(normalizeMatchingText([
  'משרה מלאה', 'משרה חלקית', 'משרה', 'מלאה', 'חלקית', 'ניסיון', 'נסיון', 'יחסי אנוש', 'תודעת שירות', 'אחריות', 'עבודה בצוות', 'עבודת צוות',
  'תנאים סוציאליים', 'תנאים', 'ניהול', 'ביטוח בריאות', 'שכר שעתי', 'שכר', 'סדר וארגון', 'גמישות', 'ראש גדול', 'קידום', 'עצמאות', 'ועד עובדים',
  'מתנות לחגים', 'יוזמה', 'עמידה בלחץ', 'רכב', 'מנהל', 'נופשים', 'שירותיות', 'מרחב', 'תואר', 'עסקים', 'יכולת', 'נדרשת', 'נדרש', 'תחום',
  'עדיפות', 'חברה', 'תקן', 'תעודת', 'גבוה', 'גבוהה', 'רשת חנויות', 'משמרות', 'משמרת', 'בוקר', 'ערב', 'לילה', 'בונוסים', 'עמלות', 'הכשרה', 'קליטה',
  'דחוף', 'דיסקרטי', 'חובה', 'יתרון', 'מיידי', 'מיידית', 'דרוש', 'דרושה', 'דרושים', 'ארוחות', 'הסעות', 'הסעה', 'קרוב לבית', 'אווירה', 'סביבה', 'צעירה',
  'דינמית', 'מוטיבציה', 'אמינות', 'חריצות', 'דייקנות', 'מסירות', 'שליטה', 'ידע', 'רמה', 'קבוצה', 'החברה', 'לתחום', 'ויכולת', 'עבודה פיזית',
  'עבודה עצמאית', 'עבודה בישיבה', 'שימת לב לפרטים', 'ניידות', 'זמינות', 'נכונות', 'העסקה ישירה', 'קביעות', 'אפשרות קידום', 'סטודנטים',
  'full time', 'part time', 'experience', 'team player', 'bonus', 'urgent', 'office',
].join('\n')).split(' ').filter(Boolean))
const GENERIC_PHRASES = new Set([
  'משרה מלאה', 'משרה חלקית', 'יחסי אנוש', 'תודעת שירות', 'עבודה בצוות', 'עבודת צוות', 'תנאים סוציאליים', 'ביטוח בריאות',
  'שכר שעתי', 'סדר וארגון', 'ראש גדול', 'ועד עובדים', 'מתנות לחגים', 'עמידה בלחץ', 'רשת חנויות', 'קרוב לבית', 'עבודה פיזית',
  'עבודה עצמאית', 'עבודה בישיבה', 'שימת לב לפרטים', 'העסקה ישירה', 'אפשרות קידום', 'full time', 'part time', 'team player',
].map(normalizeMatchingText))
// מילה אחת מאלה בביטוי רב-מילים מסמנת תנאי העסקה או הטבה, לא כישור.
const CONDITION_WORD = new Set(normalizeMatchingText([
  'שכר', 'תנאים', 'בונוס', 'בונוסים', 'עמלות', 'משרה', 'אווירה', 'סביבה', 'ועד', 'מתנות', 'נופשים', 'ארוחות', 'הסעות', 'הסעה', 'קידום', 'אפשרויות', 'חגים',
  'בריאות', 'סוציאליים', 'קרוב', 'לבית', 'דחוף', 'מיידי', 'מיידית', 'דיסקרטי', 'חובה', 'יתרון', 'דרוש', 'דרושה', 'דרושים', 'עדיפות', 'משמרות', 'משמרת',
  'בוקר', 'ערב', 'לילה', 'מלאה', 'חלקית', 'גמישות', 'גמישה', 'קבועות', 'זמינות', 'נכונות', 'ניסיון', 'נסיון', 'שנים', 'שנות', 'קבוצת', 'חברת', 'רשת', 'גבוה', 'גבוהה',
  'salary', 'bonus', 'urgent', 'shift', 'shifts',
].join('\n')).split(' ').filter(Boolean))

/**
 * מילות מפתח ותגיות שהמגייס תייג במשרה ואינן במילון, כשהן כישור מקצועי ולא תנאי העסקה,
 * שם מעסיק, עיר, מזהה ייבוא או תכונה אישית. הן נבדקות מול המועמד כמו כל כישור אחר: מילים שלמות, עם שלילה.
 */
export function curatedSkillTerms(input: Pick<MatchingPosition, 'keywords' | 'tags'>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const raw = [...textList(input.keywords).split('\n'), ...(input.tags ?? []).map(tag => tag.name)]
  for (const candidate of raw) {
    const term = candidate.trim()
    const normalized = normalizeMatchingText(term)
    const words = normalized.split(' ').filter(Boolean)
    if (!words.length || words.length > 3 || seen.has(normalized)) continue
    if (getMatchingConcept(term) || extractMentionedCities(term).length) continue
    if (/[\d₪%@]|^[A-Z0-9_ .-]+$/.test(term) || GENERIC_PHRASES.has(normalized)) continue
    if (words.length === 1 ? (words[0].length < 3 || GENERIC_KEYWORD.has(words[0])) : words.some(word => CONDITION_WORD.has(word))) continue
    seen.add(normalized)
    result.push(term)
    if (result.length >= MAX_CURATED_SKILL_TERMS) break
  }
  return result
}

function candidateEvidence(candidate: PreparedMatchingCandidate, term: string, includeTags = false): SourcedEvidence[] {
  const cacheKey = `${includeTags}:${term}`
  const cached = candidate.evidenceCache.get(cacheKey)
  if (cached) return cached
  const concept = getMatchingConcept(term)
  // סוגי תואר הם ראיה לתואר כללי, לא שקילות לתואר מסוים או לרישיון.
  const terms = concept?.id === 'degree' ? ['degree', 'bachelor', 'master', 'engineer_degree'] : [term]
  const result = candidate.sources.flatMap(source => {
    if ((!includeTags && source.field === 'tags') || (source.field === 'resume' && candidate.quality === 'unreadable')) return []
    return terms.flatMap(item => findIndexedTermEvidence(source.index, item).map(found => ({ ...found, quote: source.original.slice(found.start, found.end), source: source.field })))
  })
  candidate.evidenceCache.set(cacheKey, result)
  return result
}

function resolveEvidence(evidence: SourcedEvidence[]): { status: RequirementCheck['status']; evidence: SourcedEvidence[] } {
  const positive = evidence.filter(item => item.assertion === 'positive')
  const negative = evidence.filter(item => item.assertion === 'negated')
  if (positive.length && negative.length) return { status: 'unknown', evidence: [...positive, ...negative] }
  if (positive.length) return { status: 'met', evidence: positive }
  if (negative.length) return { status: 'contradicted', evidence: negative }
  return { status: 'unknown', evidence }
}

function minimumYears(text: string): number | null {
  const range = text.match(/(\d+(?:\.\d+)?)\s*[-––]\s*\d+(?:\.\d+)?\s*(?:שנות?|שנים|years?)/i)
  if (range && /ניסיון|נסיון|experience/i.test(text)) return Number(range[1])
  const match = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:שנות?\s+(?:ניסיון|נסיון)|שנ(?:ה|ים)|years?\s+(?:of\s+)?experience)/i)
  if (match && /ניסיון|נסיון|experience/i.test(text)) return Number(match[1])
  if (/שנתיים\s*(?:ניסיון|נסיון)|(?:ניסיון|נסיון)\s*(?:של\s*)?שנתיים/.test(text)) return 2
  const words: Record<string, number> = { אחת: 1, שנה: 1, שלוש: 3, ארבע: 4, חמש: 5, שש: 6, שבע: 7, שמונה: 8, תשע: 9, עשר: 10 }
  const spelled = text.match(/(אחת|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר)\s+שנ(?:ים|ות)\s*(?:ניסיון|נסיון)/)
  return spelled ? words[spelled[1]] : null
}

// רק תקופות עם תפקיד/כישור רלוונטי באותה שורה. אין כפל ספירה בתקופות חופפות.
function relevantYears(candidate: PreparedMatchingCandidate, concepts: string[], asOf: Date): { years: number | null; evidence: SourcedEvidence[] } {
  const intervals: [number, number][] = []
  let explicit: number | null = null
  const evidence: SourcedEvidence[] = []
  const currentMonth = asOf.getUTCFullYear() * 12 + asOf.getUTCMonth()
  for (const concept of concepts) {
    for (const found of candidateEvidence(candidate, concept).filter(item => item.assertion === 'positive' && item.source === 'resume')) {
      const source = candidate.sources.find(item => item.field === found.source)!
      const context = matchingEvidenceContext(source.original, found)
      if (/השכלה|לימודי|אוניברסיטה|מכללה|education|university|college/i.test(context)) continue
      const years = minimumYears(context)
      if (years !== null) { explicit = Math.max(explicit ?? 0, years); evidence.push(found) }
      const dates = context.match(/(?:(\d{1,2})[/.])?((?:19|20)\d{2})\s*[-–—]\s*(?:(?:(\d{1,2})[/.])?((?:19|20)\d{2})|(היום|כיום|עד היום|present|current))/i)
      if (!dates) continue
      const fromMonth = dates[1] ? Number(dates[1]) : 12
      const toMonth = dates[3] ? Number(dates[3]) : 1
      if (fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) continue
      const from = Number(dates[2]) * 12 + fromMonth - 1
      const to = dates[5] ? currentMonth : Number(dates[4]) * 12 + toMonth - 1
      if (to > from && to <= currentMonth && from > 1900 * 12) { intervals.push([from, to]); evidence.push(found) }
    }
  }
  intervals.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of intervals) {
    const previous = merged[merged.length - 1]
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1])
    else merged.push([...range])
  }
  const months = merged.reduce((sum, [from, to]) => sum + to - from, 0)
  return { years: explicit === null && !merged.length ? null : Math.max(explicit ?? 0, months / 12), evidence }
}

function evaluateRequirement(candidate: PreparedMatchingCandidate, job: PreparedMatchingPosition, check: Requirement, asOf: Date): RequirementCheck {
  const { index, ...base } = check
  const concepts = [...index.byConcept.keys()]
  if (UNSCORED.test(check.text)) return { ...base, status: concepts.length ? 'unknown' : 'not_scored', reason: concepts.length ? 'הסעיף מערב תנאי מקצועי ומאפיין אישי. המאפיין האישי לא נוקד; התנאי המקצועי דורש בירור נפרד.' : 'מאפיין אישי או התרשמות שאינם מדד להתאמה מקצועית; לא נוקד.', evidence: [] }
  if (NOT_REQUIRED.test(check.text)) return { ...base, status: MANDATORY.test(check.text.replace(NOT_REQUIRED, '')) && concepts.length ? 'unknown' : 'not_scored', reason: 'הסעיף כולל תנאי שאינו נדרש; דרישות נוספות באותו סעיף לא אושרו אוטומטית.', evidence: [] }
  const conceptChecks = concepts.map(term => resolveEvidence(candidateEvidence(candidate, term)))
  const alternatives = /(?:^|\s)(?:או|or)(?:\s|$)|\s\/\s/i.test(check.text) && concepts.length > 1
  const checks = alternatives ? [{
    status: (conceptChecks.some(item => item.status === 'met') ? 'met' : conceptChecks.every(item => item.status === 'contradicted') ? 'contradicted' : 'unknown') as RequirementCheck['status'],
    evidence: conceptChecks.flatMap(item => item.evidence),
  }] : conceptChecks
  const years = minimumYears(check.text)
  if (years !== null) {
    const related = concepts.filter(term => getMatchingConcept(term)?.kind !== 'credential')
    const fallbackRoles = [...job.titleIndex.byConcept.keys()].filter(term => getMatchingConcept(term)?.kind === 'role')
    const experience = relevantYears(candidate, related.length ? related : fallbackRoles, asOf)
    // היסטוריה לא מלאה אינה הוכחה לכך שאין עוד ניסיון; מינימום חסר נשלח לאימות.
    checks.push({ status: experience.years !== null && experience.years >= years ? 'met' : 'unknown', evidence: experience.evidence })
  }
  let status: RequirementCheck['status'] = !checks.length ? 'unknown'
    : checks.some(item => item.status === 'contradicted') ? 'contradicted' : checks.every(item => item.status === 'met') ? 'met' : 'unknown'
  const evidence = checks.flatMap(item => item.evidence)
  // רמת שפה/תוקף/תחום תואר/סוג הסמכה דורשים יותר מאזכור שם המושג.
  if (status === 'met' && /בתוקף|רמה גבוהה|ברמה גבוהה|שוטפת|שפת אם|fluent|advanced|native|תואר ב|תואר פיננסי|סוג [123]/i.test(check.text)) status = 'unknown'
  // התאמה לכישור אחד לא מאשרת בשקט תנאי נוסף שאיננו יודעים לפרש.
  let remaining = check.text
  for (const item of [...index.evidence].sort((a, b) => b.start - a.start)) remaining = remaining.slice(0, item.start) + ' '.repeat(item.end - item.start) + remaining.slice(item.end)
  const ignored = new Set(normalizeMatchingText('ניסיון נסיון ידע שליטה היכרות חובה יתרון משמעותי נדרש נדרשת נדרשים נדרשות לפחות קודם קודמת מוכח מוכחת שנים שנה שנות שנתיים שלוש ארבע חמש שש שבע שמונה תשע עשר או וגם עם ב כ ל בידע בניסיון בנסיון דרישות התפקיד יכולת עבודה בתחום דרושה דרוש ב חובה עדיפות רצוי required preferred experience knowledge proficiency familiarity minimum at least years year of in with and or a an the must have previous proven').split(' '))
  const unparsed = normalizeMatchingText(remaining).split(' ').filter(token => token && !ignored.has(token) && !(years !== null && /^\d+(?:\.\d+)?$/.test(token)))
  if (status === 'met' && unparsed.length) status = 'unknown'
  return { ...base, status, evidence, reason: status === 'met' ? 'נמצאה עדות מפורשת במידע המקצועי; לא אימות חיצוני של ההסמכה.' : status === 'contradicted' ? 'נמצאה שלילה מפורשת של הדרישה.' : 'המידע אינו מספיק להכרעה או שיש ראיות סותרות; נדרש בירור.' }
}

function uniqueEvidence(items: SourcedEvidence[]): SourcedEvidence[] {
  const found = new Set<string>()
  return items.filter(item => {
    const key = `${item.source}:${item.concept}:${item.start}:${item.end}`
    if (found.has(key)) return false
    found.add(key)
    return true
  })
}

export function evaluatePreparedMatch(candidate: PreparedMatchingCandidate, job: PreparedMatchingPosition, options: { maxDistanceKm?: number; asOf?: Date } = {}): EvidenceMatch {
  const titleRoles = [...job.titleIndex.byConcept.keys()].filter(term => getMatchingConcept(term)?.kind === 'role')
  const roleConcepts = [...new Set(candidate.sources.filter(source => source.field !== 'tags').flatMap(source => [...source.index.byConcept.keys()]))]
    .filter(term => getMatchingConcept(term)?.kind === 'role')
  const positiveRoles = roleConcepts.flatMap(term => {
    const check = resolveEvidence(candidateEvidence(candidate, term))
    return check.status === 'met' ? check.evidence : []
  })
  const direct = positiveRoles.filter(item => titleRoles.includes(item.concept))
  const families = new Set(titleRoles.map(term => getMatchingConcept(term)?.family).filter(Boolean))
  const related = positiveRoles.filter(item => families.has(getMatchingConcept(item.concept)?.family))
  const metadata = titleRoles.flatMap(term => candidateEvidence(candidate, term, true).filter(item => item.source === 'tags' && item.assertion === 'positive'))
  let roleMatch: EvidenceMatch['roleMatch'] = direct.length ? 'direct' : related.length ? 'related' : metadata.length ? 'metadata' : 'none'
  let roleEvidence = direct.length ? direct : related.length ? related : metadata
  // גם מקצוע שאינו במילון יכול להתאים בכותרת מלאה, אך לא במילה כללית כמו "מנהל".
  const meaningfulTitle = normalizeMatchingText(job.input.title).replace(/(?:^| )(?:דרוש|דרושה|דרושימ|עובד|עובדת|מנהל|מנהלת|מקצועי|בכיר|בכירה|junior|senior)(?= |$)/g, '').trim()
  if (!titleRoles.length && meaningfulTitle.split(' ').length >= 2) {
    const exact = candidateEvidence(candidate, job.input.title).filter(item => item.assertion === 'positive')
    if (exact.length) { roleMatch = 'direct'; roleEvidence = exact }
  }
  const role = roleMatch === 'direct' ? 35 : roleMatch === 'related' ? 17 : roleMatch === 'metadata' ? 8 : 0
  const skillConcepts = [...job.index.byConcept.keys()].filter(term => ['skill', 'language'].includes(getMatchingConcept(term)?.kind ?? '') &&
    job.index.byConcept.get(term)!.some(item => item.assertion === 'positive' && !NOT_REQUIRED.test(matchingEvidenceContext(job.text, item))))
  const skillChecks = [...skillConcepts, ...job.skillTerms].map(term => ({ term, ...resolveEvidence(candidateEvidence(candidate, term)) }))
  const matchedSkills = skillChecks.filter(item => item.status === 'met')
  const skills = skillChecks.length ? Math.round(25 * matchedSkills.length / skillChecks.length) : 0
  const requirements = job.requirements.map(check => evaluateRequirement(candidate, job, check, options.asOf ?? new Date()))
  const scored = requirements.filter(check => check.status !== 'not_scored')
  const weight = (check: RequirementCheck) => check.importance === 'mandatory' ? 3 : check.importance === 'preferred' ? 1 : 2
  const totalWeight = scored.reduce((sum, check) => sum + weight(check), 0)
  const requirementsScore = totalWeight ? Math.round(25 * scored.filter(check => check.status === 'met').reduce((sum, check) => sum + weight(check), 0) / totalWeight) : 0
  const locationKey = `${candidate.resolvedCity ?? ''}:${options.maxDistanceKm ?? 'default'}`
  const location = job.locationCache.get(locationKey) ?? evaluateMatchingLocation({
    candidateCity: candidate.resolvedCity,
    positionLocation: job.input.location, positionTitle: job.input.title,
    positionDescription: [job.input.description, textList(job.input.requirements)].filter(Boolean).join('\n'),
    transportation: job.input.transportation, workHours: job.input.workHours, maxDistanceKm: options.maxDistanceKm,
  })
  job.locationCache.set(locationKey, location)
  const hardContradiction = requirements.some(check => check.importance === 'mandatory' && check.status === 'contradicted')
  const unknownRequired = requirements.some(check => check.importance !== 'preferred' && (check.status === 'unknown' || check.status === 'contradicted'))
  const specializedSkills = matchedSkills.filter(check => !['excel', 'office', 'english', 'hebrew', 'crm'].includes(check.term))
  const professionalEvidence = roleMatch === 'direct' || roleMatch === 'related' || (specializedSkills.length >= 2) || (job.entryLevel && candidate.sources.some(source => source.field !== 'tags' && source.index.evidence.some(item => item.assertion === 'aspiration' && titleRoles.includes(item.concept))))
  const unavailable = job.input.active === false || !!job.input.closedAt
  const eligible = unavailable || location.eligible === false || hardContradiction ? false : location.eligible === null || unknownRequired ? null : true
  const breakdown = { role, skills, requirements: requirementsScore, location: location.score }
  const score = Math.min(100, role + skills + requirementsScore + location.score)
  const status: EvidenceMatch['status'] = eligible === false ? 'ineligible' : !professionalEvidence ? 'insufficient_evidence'
    : unknownRequired || location.eligible === null || roleMatch !== 'direct' ? 'review' : 'matched'
  const evidence = uniqueEvidence([...roleEvidence, ...matchedSkills.flatMap(check => check.evidence), ...requirements.flatMap(check => check.evidence)])
  const matchingTerms = [...new Set(evidence.filter(item => item.assertion === 'positive' && item.source !== 'tags').map(item => item.term))]
  const strengths: string[] = []
  if (roleMatch === 'direct') strengths.push(`תועד תפקיד תואם: ${[...new Set(roleEvidence.map(item => item.term))].join(', ')}`)
  if (roleMatch === 'related') strengths.push('תועד רקע בתחום קרוב; אין בכך הוכחה לניסיון בתפקיד המדויק.')
  if (matchedSkills.length) strengths.push(`כישורים מתועדים: ${matchedSkills.map(item => getMatchingConcept(item.term)?.label ?? item.term).join(', ')}`)
  if (location.eligible === true) strengths.push(location.reason)
  const weaknesses = requirements.filter(check => check.status === 'unknown' || check.status === 'contradicted').map(check => `${check.status === 'contradicted' ? 'סתירה לדרישה' : 'לא אומת'}: ${check.text}`)
  if (!professionalEvidence) weaknesses.push('לא נמצאה עדות מספקת להתאמה מקצועית; התאמת עיר בלבד אינה המלצה.')
  if (location.eligible !== true) weaknesses.push(location.reason)
  if (candidate.quality === 'unreadable') weaknesses.push('טקסט קורות החיים חשוד כלא קריא; נדרש חילוץ מחדש או OCR. המידע המובנה עדיין נבדק.')
  if (candidate.quality === 'missing') weaknesses.push('אין טקסט קורות חיים; נבדק המידע המקצועי המובנה בלבד.')
  if (unavailable) weaknesses.push('המשרה אינה פתוחה לגיוס.')
  const recommendation = status === 'matched' ? 'נמצאה התאמה מבוססת מידע; מומלץ לעבור על הראיות לפני פנייה.'
    : status === 'review' ? 'קיימת התאמה אפשרית; יש לברר את הסעיפים שלא אומתו לפני הפניה.'
      : status === 'ineligible' ? 'לא מומלץ להפנות לפי המידע הנוכחי; יש לבדוק את מגבלת המיקום או דרישת הסף.'
        : 'חסר בסיס מקצועי להמלצה; יש להשלים מידע, לא להסיק חוסר יכולת.'
  return {
    version: MATCHING_ENGINE_VERSION, score, status, eligible, shouldProceed: status === 'matched', professionalEvidence,
    roleMatch, location, breakdown, requirements, evidence, matchingTerms, strengths, weaknesses, recommendation,
    confidence: status === 'matched' && candidate.quality === 'readable' && scored.length > 0 ? 'high' : professionalEvidence ? 'medium' : 'low',
    coverage: {
      candidateCharacters: candidate.sources.filter(source => source.field !== 'tags').reduce((sum, source) => sum + source.original.length, 0),
      positionCharacters: job.text.length, candidateTextTruncated: false, positionTextTruncated: false,
      resumeQuality: candidate.quality, source: 'local-evidence', unsupportedRequirements: requirements.filter(check => check.status === 'unknown').length,
    },
  }
}

export function evaluateCandidatePosition(candidate: MatchingCandidate, position: MatchingPosition, options?: { maxDistanceKm?: number; asOf?: Date }): EvidenceMatch {
  return evaluatePreparedMatch(prepareMatchingCandidate(candidate), prepareMatchingPosition(position), options)
}

export function isSuggestedMatch(match: EvidenceMatch): boolean {
  return match.status === 'matched' || match.status === 'review'
}

export type MatchingReadiness = {
  ready: boolean
  roleRecognized: boolean
  roleLabels: string[]
  geography: PositionGeography & { ok: boolean; radiusKm: number }
  requirementsTotal: number
  requirementsMarked: number
  skillTerms: string[]
  issues: string[]
}

/** בדיקת מוכנות של משרה להתאמה, ללא מועמדים וללא DB; מוצגת למגייס בעת יצירה/עריכה. */
export function assessMatchingReadiness(input: MatchingPosition): MatchingReadiness {
  const job = prepareMatchingPosition(input)
  const roles = [...job.titleIndex.byConcept.keys()].filter(term => getMatchingConcept(term)?.kind === 'role')
  const geography = describePositionGeography({ positionLocation: input.location, positionTitle: input.title, positionDescription: [input.description, textList(input.requirements)].filter(Boolean).join('\n'), workHours: input.workHours })
  const geographyOk = geography.nationwide || geography.remote || geography.measurableCities.length > 0
  const requirementsMarked = job.requirements.filter(check => check.importance !== 'unspecified').length
  const issues: string[] = []
  if (!roles.length) issues.push('הכותרת לא מכילה מקצוע שהמנוע מזהה; מועמדים לא יקבלו "תפקיד תואם" אלא התאמה חלקית בלבד. הוסיפו את שם המקצוע לכותרת.')
  if (!geographyOk) {
    issues.push(geography.cities.length
      ? `ליישוב "${geography.cities[0]}" אין קואורדינטות במערכת; רדיוס ${DEFAULT_RADIUS_KM} ק"מ לא ייבדק והמיקום ייחשב "לא ידוע".`
      : 'לא זוהתה עיר במיקום המשרה. כתבו שם עיר (או "כל הארץ" / "עבודה מרחוק") כדי שמרחק המועמדים ייבדק.')
  }
  if (!job.requirements.length) issues.push('אין דרישות מפורטות. כתבו שורה לכל דרישה עם "חובה" או "יתרון" כדי שהמנוע יוכל לאמת אותן מול קורות החיים.')
  else if (!requirementsMarked) issues.push('הדרישות ללא סימון חובה/יתרון; כולן ייחשבו כדרישות שלא אומתו עד בירור ויקשו על סטטוס "התאמה".')
  return {
    ready: issues.length === 0, roleRecognized: roles.length > 0, roleLabels: roles.map(term => getMatchingConcept(term)?.label ?? term),
    geography: { ...geography, ok: geographyOk, radiusKm: DEFAULT_RADIUS_KM },
    requirementsTotal: job.requirements.length, requirementsMarked, skillTerms: job.skillTerms, issues,
  }
}

export function compareEvidenceMatches(a: EvidenceMatch, b: EvidenceMatch): number {
  const rank = { matched: 0, review: 1, insufficient_evidence: 2, ineligible: 3 }
  return rank[a.status] - rank[b.status] || b.score - a.score || b.breakdown.role - a.breakdown.role || b.location.score - a.location.score
}