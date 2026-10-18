import { getDistanceKm } from './israel-distance'
import {
  ARAB_LOCALITIES,
  DRUZE_LOCALITIES,
  EXTENDED_ALIASES,
  ISRAELI_CITIES,
  KIBBUTZIM,
  MOSHAVIM,
} from './israel-locations-complete'

export type MatchingLocationInput = {
  candidateCity?: string | null
  candidateResume?: string | null
  positionLocation?: string | null
  positionTitle?: string | null
  positionDescription?: string | null
  transportation?: string | null
  workHours?: string | null
  maxDistanceKm?: number
}

export type MatchingLocationResult = {
  score: number
  eligible: boolean | null
  matchType: 'exact' | 'nearby' | 'nationwide' | 'remote' | 'transport' | 'region' | 'far' | 'unknown'
  distanceKm: number | null
  isExactCity: boolean
  isNationwide: boolean
  candidateCity: string | null
  matchedCity: string | null
  reason: string
}

/**
 * מודול מקומי טהור: אין DB, רשת, לוגים או הסקת רכב/נכונות למעבר דירה.
 * eligible=null פירושו חסר מידע, לא פסילה. אזור בלבד אינו מוכיח רדיוס נסיעה.
 * ניקוד חדש (ללא שינוי בניקוד הישן): 15 מדויק/ארצי/מרחוק, 8–14 קרוב,
 * 12 הסעה מפורשת, 6 אזור משותף, 0 רחוק/לא ידוע.
 */
// החלטה עסקית: קו מרחק אווירי אחיד לכל המשרות, לא זמן נסיעה.
export const DEFAULT_RADIUS_KM = 12

function normalizeText(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(/[\u0591-\u05bd\u05bf-\u05c7\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/[״“”]/g, '"').replace(/[׳`’‘]/g, "'")
    .replace(/[-‐‑–—־]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function nameKey(text: string): string {
  return normalizeText(text).replace(/["']/g, '')
    .replace(/(^| )קרית(?= |$)/g, '$1קריית')
    .replace(/(^| )תקוה(?= |$)/g, '$1תקווה')
}

// איחוד שמות לאותה עיר בלבד; אין כאן איחוד ערים סמוכות או שכונות עמומות.
const CANONICAL_NAMES: Record<string, string> = {
  'תל אביב יפו': 'תל אביב',
  'יפו': 'תל אביב',
  'מודיעין מכבים רעות': 'מודיעין',
  'יהוד מונוסון': 'יהוד',
  'נצרת עילית': 'נוף הגליל',
  'נצרת עילית נוף הגליל': 'נוף הגליל',
  'פרדס חנה': 'פרדס חנה כרכור',
  'ראש פנה': 'ראש פינה',
  'צומת בילו': 'בילו',
  'מרכז בילו': 'בילו',
  'רמלוד': 'רמלה',
  'קרית שדה התעופה': 'נתב"ג',
  'אירפורט סיטי': 'נתב"ג',
}

function canonicalCity(name: string): string {
  return CANONICAL_NAMES[nameKey(name)] ?? name
}

type RegionDefinition = { name: string; aliases: string[]; cities: string[] }

// חברות בקבוצות קרבה אינה הבטחה ל-30 דקות. מיפוי אזורים מפורש, ללא includes.
const DAN_CITIES = ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'פתח תקווה', 'קריית אונו', 'אור יהודה', 'יהוד', 'גבעת שמואל', 'גני תקווה', 'סביון', 'אזור']
const SHARON_CITIES = ['הרצליה', 'רמת השרון', 'רעננה', 'כפר סבא', 'הוד השרון', 'נתניה', 'כפר יונה', 'אבן יהודה', 'קדימה צורן', 'תל מונד', 'כוכב יאיר', 'צור יגאל']
const SHFELA_CITIES = ['ראשון לציון', 'נס ציונה', 'רחובות', 'יבנה', 'גן יבנה', 'גדרה', 'באר יעקב', 'מזכרת בתיה', 'לוד', 'רמלה', 'קריית עקרון']
const NEGEV_CITIES = ['באר שבע', 'דימונה', 'ערד', 'ירוחם', 'מצפה רמון', 'אופקים', 'נתיבות', 'שדרות', 'מיתר', 'עומר', 'להבים', 'רהט', 'חורה', 'לקיה', 'כסיפה', 'תל שבע', 'שגב שלום']
const KRAYOT_CITIES = ['קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים']
const REGIONS: RegionDefinition[] = [
  { name: 'גוש דן', aliases: ['גוש דן', 'gush dan'], cities: DAN_CITIES },
  { name: 'שרון', aliases: ['שרון', 'השרון', 'sharon'], cities: SHARON_CITIES },
  { name: 'שפלה', aliases: ['שפלה', 'השפלה'], cities: SHFELA_CITIES },
  { name: 'מרכז', aliases: ['מרכז', 'המרכז', 'מרכז הארץ', 'central israel', 'center'], cities: [...DAN_CITIES, ...SHARON_CITIES, ...SHFELA_CITIES, 'ראש העין', 'שוהם', 'אלעד', 'מודיעין'] },
  { name: 'קריות', aliases: ['קריות', 'הקריות', 'krayot'], cities: KRAYOT_CITIES },
  { name: 'צפון', aliases: ['צפון', 'הצפון', 'צפון הארץ', 'northern israel', 'north'], cities: [...KRAYOT_CITIES, 'חיפה', 'נשר', 'טירת כרמל', 'רכסים', 'עתלית', 'עכו', 'נהריה', 'כרמיאל', 'מעלות תרשיחא', 'שלומי', 'עפולה', 'נצרת', 'נוף הגליל', 'מגדל העמק', 'יוקנעם', 'יוקנעם עילית', 'טבריה', 'צפת', 'קריית שמונה', 'חצור הגלילית', 'ראש פינה', 'בית שאן', 'קצרין', 'שפרעם', 'טמרה'] },
  { name: 'נגב', aliases: ['נגב', 'הנגב', 'negev'], cities: NEGEV_CITIES },
  { name: 'דרום', aliases: ['דרום', 'הדרום', 'דרום הארץ', 'southern israel', 'south'], cities: [...NEGEV_CITIES, 'אשדוד', 'אשקלון', 'קריית גת', 'קריית מלאכי', 'גן יבנה', 'אילת'] },
  { name: 'ירושלים והסביבה', aliases: ['ירושלים והסביבה', 'אזור ירושלים', 'מחוז ירושלים', 'jerusalem district'], cities: ['ירושלים', 'בית שמש', 'מעלה אדומים', 'מבשרת ציון', 'גבעת זאב', 'ביתר עילית', 'מודיעין עילית', 'אפרת', 'אבו גוש'] },
]

type NameEntry = { name: string; kind: 'city' | 'region'; words: string[]; ambiguous: boolean }
type Mention = { name: string; kind: 'city' | 'region'; start: number; end: number; ambiguous: boolean; prefix: string }
type Geography = { text: string; mentions: Mention[]; cities: string[]; regions: string[]; excludedCities: string[] }
const NAME_INDEX = new Map<string, NameEntry[]>()
const CITY_REGIONS = new Map<string, Set<string>>()
const AMBIGUOUS_NAMES = new Set([
  'אזור', 'מגדל', 'ראשון', 'ים', 'דן', 'עומר', 'ארז', 'עדי', 'אוהד', 'ספיר',
  'יונתן', 'שמיר', 'עמיר', 'דור', 'גבע', 'נטע', 'ענת', 'יהל', 'מגן', 'בניה',
  'אבן', 'מנות', 'רמות', 'אפיק', 'גשר', 'קשת', 'סולם', 'מעון', 'מצפה',
])

function registerName(alias: string, name: string, kind: NameEntry['kind']): void {
  const words = nameKey(alias).split(' ')
  const key = words[0]
  if (!key) return
  const entries = NAME_INDEX.get(key) ?? []
  if (!entries.some(entry => entry.words.join(' ') === words.join(' ') && entry.name === name)) {
    entries.push({ name, kind, words, ambiguous: kind === 'city' && (nameKey(alias).length <= 2 || AMBIGUOUS_NAMES.has(nameKey(alias))) })
  }
  NAME_INDEX.set(key, entries)
}

// ALL_ISRAEL_LOCALITIES כולל גם "אזור תעשייה", "מערב" ושמות שכונות: לא עיר מגורים.
const LOCALITIES = new Set([
  ...Object.values(ISRAELI_CITIES).flat(), ...Object.values(KIBBUTZIM).flat(),
  ...Object.values(MOSHAVIM).flat(), ...Object.values(ARAB_LOCALITIES).flat(), ...DRUZE_LOCALITIES,
  'ראש פינה', 'קצרין', 'אפרת', 'אבו גוש', 'חשמונאים', 'באר טוביה', 'בנימינה',
  // אתרי תעסוקה שמופיעים כמיקום משרה בפועל; יש להם קואורדינטות ב-israel-distance.
  'בילו', 'צומת בילו', 'מרכז בילו', 'פארק ראם', 'בני עי"ש', 'נתב"ג', 'אירפורט סיטי', 'קרית שדה התעופה', 'עמק חפר', 'גלילות', 'אלון הגליל', 'סינרמה',
])
for (const city of LOCALITIES) {
  if (city !== 'גולן') registerName(city, canonicalCity(city), 'city')
}
for (const [alias, city] of Object.entries(EXTENDED_ALIASES)) {
  if (alias === 'קריות') continue
  registerName(alias, canonicalCity(city), 'city')
  registerName(city, canonicalCity(city), 'city')
}
for (const [alias, city] of Object.entries(CANONICAL_NAMES)) registerName(alias, city, 'city')
for (const region of REGIONS) {
  for (const alias of region.aliases) {
    registerName(alias, region.name, 'region')
    if (/^[א-ת ]+$/.test(alias)) registerName(`אזור ${alias}`, region.name, 'region')
  }
  for (const city of region.cities) {
    const memberships = CITY_REGIONS.get(city) ?? new Set<string>()
    memberships.add(region.name)
    CITY_REGIONS.set(city, memberships)
  }
}
for (const entries of NAME_INDEX.values()) entries.sort((a, b) => b.words.length - a.words.length)

const PREFIXES = ['וב', 'ומ', 'ול', 'ו', 'ב', 'מ', 'ל']
const NOT_PREFIXED_CITIES = new Set(['מיקום', 'למיקום', 'במיקום', 'ומיקום', 'מיקומים'])
const NEGATIVE_BEFORE = /(?:^|\s)(?:לא|אין|ללא|אינו|אינה|אינם|אינן|איננו|למעט|מלבד|not|no|without|non|except|excluding)(?:\s+(?:גם|כלל|אפשרות|אפשרות ל|זמינות|זמינה|זמין|זמינות ל|קיימת|קיימות|ניתנות|מוצעות|מוצעת|לעבודה|לעבוד|עבודה|משרה|הסעה|הסעות|הסעות מ|is|a|any|available|work|working|from|fully|entirely)){0,5}\s*$/
const NEGATIVE_AFTER = /^\s*(?:אינה|אינו|אינן|אינם|לא|not)\s+(?:אפשרית|אפשרי|זמינה|זמין|זמינות|קיימת|קיימות|מוצעת|מוצעות|available|provided|offered)(?:\s|$)/

function isNegated(text: string, start: number, end: number): boolean {
  const before = text.slice(0, start).split(/[,.!?;|:]/).pop() ?? ''
  return NEGATIVE_BEFORE.test(before) || NEGATIVE_AFTER.test(text.slice(end))
}

/** התאמה לפי מילים שלמות; צורכים שם ארוך לפני עיר/אזור הכלולים בו. */
function geography(raw: string): Geography {
  const text = normalizeText(raw.replace(/\S+@\S+|https?:\/\/\S+|www\.\S+/gi, ' '))
  const tokens = [...text.matchAll(/[a-z0-9א-ת]+(?:["'][a-z0-9א-ת]+)*/g)]
  const mentions: Mention[] = []
  const excludedCities: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const first = nameKey(token[0])
    const variants = [{ key: first, prefix: '' }, ...PREFIXES
      .filter(prefix => !NOT_PREFIXED_CITIES.has(first) && first.startsWith(prefix) && first.length > prefix.length + 1)
      .map(prefix => ({ key: first.slice(prefix.length), prefix }))]
    let best: { entry: NameEntry; end: number; prefix: string } | null = null
    for (const variant of variants) {
      for (const entry of NAME_INDEX.get(variant.key) ?? []) {
        const last = tokens[i + entry.words.length - 1]
        if (!last || (best && best.entry.words.length >= entry.words.length)) continue
        if (!entry.words.every((word, offset) => offset === 0 || (
          nameKey(tokens[i + offset][0]) === word &&
          /^\s+$/.test(text.slice(tokens[i + offset - 1].index! + tokens[i + offset - 1][0].length, tokens[i + offset].index))
        ))) continue
        const end = last.index! + last[0].length
        // ק"מ בתוך "30 ק"מ" אינו קריית מוצקין, ושם פרטי אינו כתובת.
        const fragment = text.slice(0, token.index).split(/[,،;|/:()]/).pop()?.trim() ?? ''
        const tail = text.slice(end).split(/[,،;|/:()]/)[0].trim()
        if (entry.ambiguous && !(/["']/.test(token[0]) && !/\d\s*$/.test(fragment)) &&
          !(variant.prefix === '' && fragment === '' && /^(?:ישראל|israel)?$/.test(tail)) &&
          !/(?:^|\s)(?:קיבוץ|מושב|יישוב|ישוב|עיר)\s*$/.test(fragment)) continue
        best = { entry, end, prefix: variant.prefix }
      }
    }
    if (!best) continue
    const { entry, end, prefix } = best
    if (!isNegated(text, token.index!, end)) {
      mentions.push({ name: entry.name, kind: entry.kind, start: token.index!, end, ambiguous: entry.ambiguous, prefix })
    } else if (entry.kind === 'city') {
      excludedCities.push(entry.name)
    }
    i += entry.words.length - 1
  }
  return {
    text, mentions,
    cities: [...new Set(mentions.filter(item => item.kind === 'city').map(item => item.name))],
    regions: [...new Set(mentions.filter(item => item.kind === 'region').map(item => item.name))],
    excludedCities,
  }
}

const HISTORY_HEADING = /(?:^|[|;:•])\s*(?:ניסיון(?:\s+(?:תעסוקתי|מקצועי|בעבודה))?|היסטורי[ית]+ת? תעסוקה|תעסוקה|השכלה(?:\s+אקדמית)?|לימודים|שירות צבאי|experience|work experience|professional experience|employment(?: history)?|education|career history)(?=\s|[:|•]|$)/i
const HISTORY_CONTENT = /(?:אוניברסיט[הת]|מכלל[הת]|בית ספר|עבדתי|עבד ב|עבודה בחברת|חברת |מעסיק|לימודי |תואר |university|college|employer|company|worked at|school|\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|היום))/i
const RESIDENCE_LABEL = /(?:^|[,،|;•])\s*(?:כתובת מגורים|עיר מגורים|מקום מגורים|מגורים|מתגורר(?:ת)?|תושב(?:ת)?|residence|home address|lives in|resides in)\s*[:\-–]?\s*/i
const CONTACT_LOCATION_LABEL = /(?:^|[,،|;•])\s*(?:כתובת|עיר|יישוב|ישוב|address|city|location)\s*[:\-–]\s*/i
const CONTACT_END = /(?:[|;•]|(?:טלפון|נייד|דוא["״]?ל|אימייל|email|e-mail|phone|mobile)\s*:)/i

function residenceCities(value: string): string[] {
  const address = value.split(CONTACT_END)[0]
    .replace(/(?:רחוב|רח[.'׳]|street|avenue|road)\s+[^,،;|]+/gi, '')
  const parsed = geography(address)
  return parsed.regions.length ? [] : parsed.cities
}

/** עיר רק מעדות מגורים/קשר או מכותרת חד־משמעית; לעולם לא מעיר מעסיק/מוסד. */
export function extractCandidateCity(resume: string): string | null {
  if (!resume.trim()) return null
  const labelled = new Set<string>()
  const header = new Set<string>()
  let inHeader = true
  let ambiguousLabel = false
  const lines = resume.replace(/\r/g, '').split('\n')
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim()
    if (!line) continue
    const heading = line.match(HISTORY_HEADING)
    const contactPart = heading ? line.slice(0, heading.index) : line
    const hasHistory = HISTORY_CONTENT.test(contactPart)
    const label = contactPart.match(RESIDENCE_LABEL) ??
      (inHeader && !hasHistory ? contactPart.match(CONTACT_LOCATION_LABEL) : null)
    if (label && !hasHistory) {
      const value = contactPart.slice(label.index! + label[0].length).trim()
      const nextLine = lines[index + 1]?.trim() ?? ''
      const cities = residenceCities(value || (!HISTORY_HEADING.test(nextLine) && !HISTORY_CONTENT.test(nextLine) ? nextLine : ''))
      if (cities.length !== 1) ambiguousLabel = true
      for (const city of cities) labelled.add(city)
    }
    if (inHeader && index < 30 && !hasHistory && !label) {
      for (const fragment of contactPart.split(/[|;•]/)) {
        const parsed = geography(fragment)
        if (parsed.mentions.length !== 1 || parsed.mentions[0].kind !== 'city' || parsed.mentions[0].ambiguous) continue
        const mention = parsed.mentions[0]
        const residue = `${parsed.text.slice(0, mention.start)} ${parsed.text.slice(mention.end)}`
          .replace(/(?:ישראל|israel)/g, '').replace(/[\s,()📍]+/gu, '')
        if (!residue) header.add(mention.name)
      }
    }
    if (heading || hasHistory) inHeader = false
  }
  if (ambiguousLabel || labelled.size > 1) return null
  if (labelled.size === 1) {
    const city = [...labelled][0]
    return [...header].some(item => item !== city) ? null : city
  }
  return header.size === 1 ? [...header][0] : null
}

function clauses(text?: string | null): string[] {
  return (text ?? '').split(/[\n\r.!?;|]+/).map(normalizeText).filter(Boolean)
}

/** ערים שהוזכרו בחיוב בטקסט חופשי (למשל שאילתת חיפוש); אזורים אינם ערים. */
export function extractMentionedCities(text: string): string[] {
  return geography(text).cities
}

const NATIONWIDE = /(?:^|[^a-zא-ת])((?:ב|מ|ל)?כל הארץ|(?:ב|מ)?רחבי (?:הארץ|ישראל)|(?:ב)?פריסה ארצית|ארצי(?:ת)?|across israel|throughout israel|all (?:of |over )?israel|israel wide|nationwide|countrywide)(?=$|[^a-zא-ת])/g
const COMPANY_SUBJECT = /(?:^|\s)(?:ל?חברה|החברה|ל?רשת|הרשת|ל?ארגון|הארגון|סניפים|סניפי|company|chain|organization|branches)(?=\s|$)/g
const COMPANY_AFTER = /^\s+(?:company|chain|organization|business|network|brand)(?:\s|$)/
const ROLE_SUBJECT = /(?:^|\s)(?:ה?עבודה|ה?משרה|ה?תפקיד|משרות|תפקידים|פעילות התפקיד|אזור הפעילות|נסיעות|work|working|role|job|position|travel|coverage)(?=\s|$)/g
const TITLE_ROLE = /(?:^|\s)(?:מנהל(?:ת)?|סוכן(?:ת)?|נציג(?:ת)?|טכנאי(?:ת)?|נהג(?:ת)?|מחסנאי(?:ת)?|אחראי(?:ת)?|מפקח(?:ת)?|מתקין(?:ה)?|מגייס(?:ת)?|manager|technician|driver|sales|representative|recruiter)(?=\s|$)/g
const SHUTTLE_WORD = /(?:הסעות|הסעה|שאטל|shuttles?)/i

function lastMatchIndex(text: string, pattern: RegExp): number {
  let index = -1
  for (const match of text.matchAll(pattern)) index = match.index!
  return index
}

type ScopeText = { text: string; source: 'location' | 'title' | 'description' | 'hours' }

function nationwideScope(parts: ScopeText[]): boolean {
  let positive = false
  for (const part of parts.filter(item => item.source !== 'hours')) {
    for (const clause of clauses(part.text)) {
      for (const match of clause.matchAll(NATIONWIDE)) {
        const start = match.index! + match[0].length - match[1].length
        if (isNegated(clause, start, start + match[1].length)) return false
        const before = clause.slice(0, start)
        if (SHUTTLE_WORD.test(before) || COMPANY_AFTER.test(clause.slice(start + match[1].length))) continue
        const company = lastMatchIndex(before, COMPANY_SUBJECT)
        const role = Math.max(lastMatchIndex(before, ROLE_SUBJECT), part.source === 'title' ? lastMatchIndex(before, TITLE_ROLE) : -1)
        if (company >= role && company >= 0) continue
        if (part.source === 'location' || role >= 0 || (part.source === 'title' && company < 0 && /[-–—:|]/.test(part.text))) positive = true
      }
    }
  }
  return positive
}

const REMOTE = /(?:^|[^a-zא-ת])((?:(?:עבודה|העבודה|משרה|המשרה)\s+(?:(?:מלאה|לחלוטין|באופן מלא|100%)\s+)?)?(?:מהבית|מרחוק)|(?:(?:fully|entirely|100%)\s+)?remote|work(?:ing)? from home|work(?:ing)? remotely)(?=$|[^a-zא-ת])/g
const HYBRID = /(?:היברידי(?:ת)?|hybrid)/i
const PARTIAL_REMOTE = /(?:אפשרות|לעיתים|לעתים|חלקי(?:ת)?|חלק מהשבוע|יומיים|יום (?:בשבוע|אחד|מהבית|מרחוק)|פעם בשבוע|\d+\s*(?:ימים|days)|days? (?:a|per) week|part time remote|optional|(?:^|\s)[1-9]\d?%)/i
const OFFICE_ATTENDANCE = /(?:הגעה|נוכחות|עבודה|להגיע)\s+(?:חובה\s+)?(?:במשרד|למשרד)|on site|onsite|office days/i

function remoteScope(parts: ScopeText[]): boolean {
  let positive = false
  for (const { text, source } of parts) {
    for (const clause of clauses(text)) {
      const matches = [...clause.matchAll(REMOTE)]
      if (HYBRID.test(clause) || ((matches.length > 0 || source === 'hours') && PARTIAL_REMOTE.test(clause))) return false
      const office = clause.match(OFFICE_ATTENDANCE)
      if (office && !isNegated(clause, office.index!, office.index! + office[0].length)) return false
      for (const match of matches) {
        const start = match.index! + match[0].length - match[1].length
        if (isNegated(clause, start, start + match[1].length)) return false
        const phrase = match[1]
        if ((source === 'location' && clause.trim() === phrase) || /(?:fully|entirely|100%|עבודה|העבודה|משרה|המשרה|work)/.test(phrase) ||
          (source === 'title' && lastMatchIndex(clause.slice(0, start), TITLE_ROLE) >= 0 && !/(?:תמיכה|שירות|support|control)\s*$/.test(clause.slice(0, start))) ||
          /^(?:\s+)(?:בלבד|באופן מלא|לחלוטין)(?:\s|$)/.test(clause.slice(start + phrase.length))) positive = true
      }
    }
  }
  return positive
}

const WORKSITE_LABEL = /(?:^|[,;|]\s*|\s)(?:מיקום(?: המשרה| העבודה)?|מקום העבודה|העבודה(?: מתבצעת| מתקיימת)?|המשרה(?: ממוקמת)?|work location|job location|based)\s*(?:[:\-]\s*|ב|in\s+)/i

function worksite(input: MatchingLocationInput): { cities: string[]; regions: string[]; unresolved: boolean; localOnly: boolean } {
  const location = input.positionLocation?.trim() ?? ''
  const explicit = [input.positionTitle, input.positionDescription].flatMap(text => clauses(text).flatMap(clause => {
    const label = clause.match(WORKSITE_LABEL)
    return label ? [clause.slice(label.index! + label[0].length)] : []
  }))
  const texts = location ? [location] : explicit
  const parsed = texts.flatMap(text => text.split(/[;|\n]+/).flatMap(clause => {
    const shuttle = clause.search(SHUTTLE_WORD)
    return (shuttle < 0 ? clause : clause.slice(0, shuttle)).split(/[,،/]+/).map(geography)
  }))
  return {
    cities: [...new Set(parsed.flatMap(part => part.cities))],
    regions: [...new Set(parsed.flatMap(part => part.regions))],
    unresolved: parsed.some(part => !!part.text && !part.mentions.length && !/^(?:ישראל|israel|לא ארצי(?:ת)?|היברידי(?:ת)?|hybrid|on site|onsite|ללא|אין)$/.test(part.text)),
    localOnly: [location, ...explicit].some(text => /(?:בלבד|רק ב|only in|only$)/i.test(text) && geography(text).cities.length > 0),
  }
}

const SHUTTLE_ORIGIN = /(?:^|\s)(?:הסעות|הסעה|שאטל|shuttles?)\s*(?:(?:קבועות|מאורגנות|מסודרות|לעובדים|חינם)\s+)*(?:מ(?:העיר\s+)?|from\s+|[:]\s*)/gi
const UNCERTAIN_SHUTTLE = /(?:^|[^a-zא-ת])(?:מ?אזור|מ?סביבת|מ?סביבה|אפשרות|ייתכן|יתכן|בתיאום|בכפוף|תלוי|מותנה|חלק|בלבד|רק|ב?בוקר|ב?ערב|ב?לילה|ל?משמרת|ל?משמרות|maybe|possible|conditional|depending|area|vicinity|only|shifts?|morning|night|evening)(?=$|[^a-zא-ת])|\?/i

function hasTransportation(input: MatchingLocationInput, candidateCity: string, siteCities: string[]): boolean {
  let positive = false
  for (const text of [input.transportation, input.positionDescription, input.positionLocation]) {
    for (const raw of (text ?? '').split(/[\n\r.!;|]+/)) {
      const clause = normalizeText(raw)
      const service = clause.match(SHUTTLE_WORD)
      if (service && isNegated(clause, service.index!, service.index! + service[0].length)) {
        const route = geography(clause.slice(service.index! + service[0].length))
        if (route.cities.includes(candidateCity) || route.excludedCities.includes(candidateCity) || !route.cities.length) return false
      }
      for (const match of clause.matchAll(SHUTTLE_ORIGIN)) {
        // רק מקור מפורש. "לחיפה" הוא יעד, ו"מאזור חיפה" אינו איסוף מחיפה.
        const routeText = clause.slice(match.index! + match[0].length)
        const route = geography(routeText)
        const destination = route.mentions.find(mention => mention.prefix === 'ל' || mention.prefix === 'ול')
        const destinationMarker = routeText.match(/\s+(?:אל|לכיוון|to|towards)\s+|\s+ל(?:מפעל|עבודה|משרד|אתר|תחנה)/)
        const end = Math.min(destination?.start ?? routeText.length, destinationMarker?.index ?? routeText.length)
        const originText = routeText.slice(0, end)
        const origins = geography(originText)
        if (origins.excludedCities.includes(candidateCity)) return false
        if (!origins.cities.includes(candidateCity) || origins.regions.length) continue
        if (isNegated(clause, match.index!, match.index! + match[0].length)) return false
        if (UNCERTAIN_SHUTTLE.test(clause)) continue
        const destinations = geography(routeText.slice(end))
        if (destinations.cities.length && !destinations.cities.some(city => siteCities.includes(city))) continue
        positive = true
      }
    }
  }
  return positive
}

function result(
  candidateCity: string | null,
  matchType: MatchingLocationResult['matchType'],
  score: number,
  eligible: boolean | null,
  reason: string,
  matchedCity: string | null = null,
  distanceKm: number | null = null,
): MatchingLocationResult {
  return { score, eligible, matchType, distanceKm, isExactCity: matchType === 'exact', isNationwide: matchType === 'nationwide', candidateCity, matchedCity, reason }
}

export type PositionGeography = { cities: string[]; measurableCities: string[]; regions: string[]; nationwide: boolean; remote: boolean; unresolved: boolean }

/** מה המנוע מבין ממיקום המשרה לבדה, לפני כל מועמד; משמש לבדיקת מוכנות בעת שמירה. */
export function describePositionGeography(input: Pick<MatchingLocationInput, 'positionLocation' | 'positionTitle' | 'positionDescription' | 'workHours'>): PositionGeography {
  const scope: ScopeText[] = [
    { text: input.positionLocation ?? '', source: 'location' },
    { text: input.positionTitle ?? '', source: 'title' },
    { text: input.positionDescription ?? '', source: 'description' },
    { text: input.workHours ?? '', source: 'hours' },
  ]
  const sites = worksite(input)
  return {
    cities: sites.cities, measurableCities: sites.cities.filter(city => getDistanceKm(city, city) !== null), regions: sites.regions,
    nationwide: !sites.localOnly && nationwideScope(scope), remote: !sites.localOnly && remoteScope(scope), unresolved: sites.unresolved,
  }
}

export function evaluateMatchingLocation(input: MatchingLocationInput): MatchingLocationResult {
  const candidate = geography(input.candidateCity ?? '')
  const candidateCity = candidate.cities.length === 1 && !candidate.regions.length
    ? candidate.cities[0]
    : extractCandidateCity(input.candidateResume ?? '')
  const scope: ScopeText[] = [
    { text: input.positionLocation ?? '', source: 'location' },
    { text: input.positionTitle ?? '', source: 'title' },
    { text: input.positionDescription ?? '', source: 'description' },
    { text: input.workHours ?? '', source: 'hours' },
  ]
  const sites = worksite(input)
  if (!sites.localOnly && nationwideScope(scope)) {
    return result(candidateCity, 'nationwide', 15, true, 'היקף המשרה ארצי במפורש; עיר המגורים אינה תנאי להתאמה הגיאוגרפית.')
  }
  if (!sites.localOnly && remoteScope(scope)) {
    return result(candidateCity, 'remote', 15, true, 'עבודה מלאה מרחוק במפורש, ללא דרישת הגעה מזוהה למשרד.')
  }
  if (!candidateCity) return result(null, 'unknown', 0, null, 'לא זוהתה עיר מגורים חד־משמעית; אין פסילה גיאוגרפית.')
  if (sites.cities.includes(candidateCity)) {
    return result(candidateCity, 'exact', 15, true, 'עיר המגורים זהה לאחד ממיקומי המשרה.', candidateCity, 0)
  }

  const radius = typeof input.maxDistanceKm === 'number' && Number.isFinite(input.maxDistanceKm) && input.maxDistanceKm >= 0
    ? input.maxDistanceKm : DEFAULT_RADIUS_KM
  const distances = sites.cities.map(city => ({ city, km: getDistanceKm(candidateCity, city) }))
  const measured = distances.filter((item): item is { city: string; km: number } => item.km !== null)
    .sort((a, b) => a.km - b.km || a.city.localeCompare(b.city))
  const nearest = measured[0]
  if (nearest && nearest.km <= radius) {
    const score = Math.round(14 - 6 * (radius > 0 ? nearest.km / radius : 0))
    return result(candidateCity, 'nearby', score, true, `מרחק אווירי משוער ${nearest.km} ק"מ, בתוך רדיוס ${radius} ק"מ; לא זמן נסיעה.`, nearest.city, nearest.km)
  }
  if (sites.cities.length && hasTransportation(input, candidateCity, sites.cities)) {
    return result(candidateCity, 'transport', 12, true, 'צוינה הסעה מפורשת מעיר המגורים; זמני הנסיעה לא חושבו.', nearest?.city ?? sites.cities[0], nearest?.km ?? null)
  }
  const memberships = CITY_REGIONS.get(candidateCity)
  const sharedRegion = sites.regions.find(region => memberships?.has(region))
  if (sharedRegion) {
    return result(candidateCity, 'region', 6, null, `עיר המגורים באזור ${sharedRegion}, אך חסר אתר מדויק לבדיקת רדיוס ${radius} ק"מ.`)
  }
  // גם אתר אחד ללא קואורדינטות או חלופה לא מזוהה מונעים פסילה ודאית של רשימה.
  if (nearest && measured.length === sites.cities.length && !sites.regions.length && !sites.unresolved) {
    return result(candidateCity, 'far', 0, false, `מרחק אווירי משוער ${nearest.km} ק"מ, מעבר לרדיוס ${radius} ק"מ; אין החרגת מיקום מפורשת.`, nearest.city, nearest.km)
  }
  return result(candidateCity, 'unknown', 0, null, 'מיקום המשרה, האזור או הקואורדינטות אינם מספיקים להכרעה; אין פסילה גיאוגרפית.', sites.cities.length === 1 ? sites.cities[0] : null)
}