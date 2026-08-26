/**
 * מנוע חיפוש משרות בעברית — כמו אתר דרושים.
 *
 * עקרונות:
 * 1. מפרידים תפקיד מעיר. "מחסנאי אשדוד" = מקצוע + מיקום, לא ערבוב טקסט.
 * 2. מרחיבים רק כותרות מקצוע חזקות (מחסן→מחסנאי/מלקט), לא מילות רעש.
 * 3. התאמה ברמת מילה (לא includes על "בר" / "גן" / "ים").
 * 4. AND בין תפקיד למיקום. כמה מושגי תפקיד שונים → כולם חייבים להופיע.
 */

import { extractCities } from "./israeli-cities"

const FINAL_LETTERS: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
}

export function normalizeHe(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[׳״'"`‘’]/g, "")
    .replace(/[ךםןףץ]/g, (ch) => FINAL_LETTERS[ch] ?? ch)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function tokenize(input?: string | null): string[] {
  const norm = normalizeHe(input)
  if (!norm) return []
  return norm.split(" ").filter((w) => w.length >= 2)
}

// כינויי ערים נפוצים → שם מלא מנורמל
const STOPWORDS = new Set(
  [
    "דרוש", "דרושה", "דרושים", "דרושות",
    "מחפש", "מחפשת", "מחפשים",
    "משרה", "משרות", "עבודה", "עבודות",
    "באזור", "אזור", "ליד", "סביב", "והסביבה", "הסביבה",
    "בכל", "עם", "או", "של", "את", "על", "אל", "עד",
    "בין", "לפי", "עבור", "גם", "לא", "יש", "אין",
    "job", "jobs", "near", "in", "at", "the", "and", "for",
  ].map(normalizeHe),
)

const CITY_SHORT_ALIASES: Record<string, string> = {
  תא: "תל אביב",
  "תל אביב": "תל אביב",
  "תל אביב יפו": "תל אביב",
  בש: "באר שבע",
  "באר שבע": "באר שבע",
  פת: "פתח תקווה",
  "פתח תקווה": "פתח תקווה",
  רג: "רמת גן",
  "רמת גן": "רמת גן",
  ראשלצ: "ראשון לציון",
  "ראשון לציון": "ראשון לציון",
  כפס: "כפר סבא",
  "כפר סבא": "כפר סבא",
  "בת ים": "בת ים",
  "בני ברק": "בני ברק",
  "קרית אתא": "קרית אתא",
  "קרית גת": "קרית גת",
  "מגדל העמק": "מגדל העמק",
}

type JobFamily = {
  id: string
  strong: string[]
  weak?: string[]
}

const JOB_FAMILIES: JobFamily[] = [
  {
    id: "warehouse",
    strong: [
      "מחסן", "מחסנאי", "מחסנאית", "מחסנאים",
      "מלגזן", "מלגזנית", "מלגזה",
      "מלקט", "מלקטת", "ליקוט",
      "מוכרן", "סדרן מחסן",
      "לוגיסטיקה", "לוגיסטי", "לוגיסטיקר",
      "אריזה", "אורז", "אורזת",
      "warehouse", "forklift", "picker",
    ],
    weak: ["מלאי", "שינוע", "היגש", "חובק", "אחסון", "אחסנה"],
  },
  {
    id: "sales",
    strong: [
      "מכירות", "מכירה",
      "איש מכירות", "אשת מכירות",
      "נציג מכירות", "נציגת מכירות",
      "יועץ מכירות", "יועצת מכירות",
      "סוכן מכירות", "טלמרקטינג", "טלמיטינג",
      "מוכר", "מוכרת", "sales",
    ],
    weak: ["עמלות", "יעדים"],
  },
  {
    id: "customer_service",
    strong: [
      "שירות לקוחות", "נציג שירות", "נציגת שירות",
      "מוקד", "מוקדן", "מוקדנית",
      "תמיכת לקוחות", "customer service", "help desk",
    ],
    weak: ["שיחות", "טלפוניה", "שימור"],
  },
  {
    id: "banking",
    strong: [
      "בנק", "בנקאי", "בנקאית", "בנקאים",
      "טלר", "טלרית",
      "משכנתא", "משכנתאות",
      "פקיד בנק", "יועץ פיננסי", "יועצת פיננסית",
    ],
    weak: ["פיננסי", "השקעות"],
  },
  {
    id: "cashier",
    strong: ["קופה", "קופאי", "קופאית", "קופאים", "קופאיות"],
    weak: ["קמעונאות", "סופרמרקט", "retail"],
  },
  {
    id: "driver",
    strong: [
      "נהג", "נהגת", "נהגים",
      "נהג חלוקה", "נהג משאית", "נהג אוטובוס",
      "שליח", "שליחה", "שליחים",
      "מוביל", "הובלה", "חלוקה", "הפצה",
      "driver", "courier", "קורייר",
    ],
    weak: ["רישיון", "משאית", "תחבורה"],
  },
  {
    id: "bakery",
    strong: ["אופה", "אפיה", "מאפיה", "קונדיטור", "קונדיטורית"],
    weak: ["בצק", "מאפים", "לחם"],
  },
  {
    id: "manager",
    strong: [
      "מנהל", "מנהלת", "מנהלים",
      "ניהול", "ראש צוות",
      "סגן מנהל", "סגנית מנהל",
      "manager",
    ],
    weak: ["הנהלה", "פיקוח"],
  },
  {
    id: "auto",
    strong: [
      "צמיגאי", "צמיגים",
      "מכונאי", "מוסך", "מוסכניק",
      "חשמלאי רכב", "טכנאי רכב",
    ],
    weak: ["רכב"],
  },
  {
    id: "security",
    strong: ["מאבטח", "מאבטחת", "אבטחה", "שומר", "שומרת", "קבט", "security"],
  },
  {
    id: "cleaning",
    strong: ["ניקיון", "מנקה", "עובד ניקיון", "חדרן", "חדרנית", "שרת", "אב בית"],
    weak: ["אחזקה"],
  },
  {
    id: "admin",
    strong: [
      "מזכיר", "מזכירה", "פקיד", "פקידה",
      "אדמיניסטרציה", "אדמיניסטרטיבי", "אדמין",
      "רכז", "רכזת", "קבלה",
      "עוזר מנהל", "עוזרת מנהל", "assistant",
    ],
  },
  {
    id: "accounting",
    strong: [
      "הנהלת חשבונות", "הנהחש",
      "מנהל חשבונות", "חשב", "חשבת",
      "רואה חשבון", "חשבונאות",
      "bookkeeper", "accountant",
    ],
    weak: ["כספים", "גזבר"],
  },
  {
    id: "software",
    strong: [
      "מפתח", "מתכנת", "מתכנתת", "תוכנה",
      "developer", "fullstack", "backend", "frontend",
      "devops", "qa", "בודק תוכנה",
    ],
    weak: ["פיתוח", "תכנות"],
  },
  {
    id: "engineer",
    strong: ["מהנדס", "מהנדסת", "הנדסאי", "הנדסאית", "הנדסה"],
  },
  {
    id: "kitchen",
    strong: ["טבח", "טבחית", "שף", "עובד מטבח", "מטבח", "בישול", "sous chef"],
  },
  {
    id: "waiter",
    strong: ["מלצר", "מלצרית", "ברמן", "ברמנית", "מלצרות"],
    weak: ["מסעדה", "קייטרינג", "טיפים"],
  },
  {
    id: "production",
    strong: ["מפעיל", "מפעילת", "מפעיל מכונה", "עובד יצור", "יצור", "פס יצור"],
    weak: ["תעשיה", "מפעל", "operator"],
  },
  {
    id: "medical",
    strong: [
      "אחות", "אח", "סיעוד", "עובד סיעוד",
      "רופא", "רופאה", "פיזיותרפיסט",
      "מטפל", "מטפלת", "סייעת",
      "nurse", "doctor",
    ],
    weak: ["בריאות", "מרפאה"],
  },
  {
    id: "education",
    strong: ["מורה", "גננת", "מחנך", "מחנכת", "מדריך", "מדריכה", "הוראה", "מרצה"],
    weak: ["חינוך", "teacher"],
  },
  {
    id: "marketing",
    strong: ["שיווק", "פרסום", "גרפיקאי", "גרפיקאית", "עיצוב גרפי", "marketing", "seo"],
    weak: ["מדיה", "דיגיטל", "content"],
  },
  {
    id: "hr",
    strong: ["משאבי אנוש", "גיוס", "מגייס", "מגייסת", "ריקרוטר", "recruiter", "hr"],
    weak: ["כוח אדם"],
  },
  {
    id: "legal",
    strong: ["עורך דין", "עורכת דין", "פרקליט", "פרקליטה", "עוזר משפטי", "lawyer", "legal"],
  },
  {
    id: "construction",
    strong: ["בנאי", "בניה", "שיפוצניק", "שיפוצים", "חשמלאי", "אינסטלטור", "נגר"],
    weak: ["גבס", "קרמיקה"],
  },
  {
    id: "it",
    strong: ["תמיכה טכנית", "helpdesk", "sysadmin", "טכנאי מחשבים", "סייבר", "cyber"],
    weak: ["רשתות", "support"],
  },
]

type NormFamily = {
  id: string
  strong: string[]
  weak: string[]
  strongSet: Set<string>
  weakSet: Set<string>
}

const NORM_FAMILIES: NormFamily[] = JOB_FAMILIES.map((f) => {
  const strong = f.strong.map(normalizeHe).filter(Boolean)
  const weak = (f.weak ?? []).map(normalizeHe).filter(Boolean)
  return {
    id: f.id,
    strong,
    weak,
    strongSet: new Set(strong),
    weakSet: new Set(weak),
  }
})

const HEBREW_PREFIXES = ["ב", "ל", "כ", "מ", "ו", "ש", "ה"]

function stripKnownPrefix(token: string): string[] {
  const out = [token]
  for (const p of HEBREW_PREFIXES) {
    if (token.startsWith(p) && token.length > p.length + 2) {
      out.push(token.slice(p.length))
    }
  }
  return out
}

/** התאמת מילה עברית: זהות, קידומת סבירה, או צורת מין/רבים */
function tokensRelated(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const short = a.length <= b.length ? a : b
  const long = a.length <= b.length ? b : a
  if (short.length < 3) return false
  if (long.startsWith(short) && long.length - short.length <= 3) return true
  if (short.length >= 4 && long.length >= 4) {
    const stemA = a.slice(0, 4)
    const stemB = b.slice(0, 4)
    if (stemA === stemB && Math.abs(a.length - b.length) <= 3) return true
  }
  return false
}

function textHasTerm(tokens: string[], term: string): boolean {
  const parts = term.split(" ").filter(Boolean)
  if (parts.length > 1) {
    const joined = tokens.join(" ")
    if (joined.includes(parts.join(" "))) return true
    return parts.every((p) => tokens.some((t) => tokensRelated(t, p)))
  }
  return tokens.some((t) => tokensRelated(t, term))
}

function detectCitiesFromQuery(query: string): string[] {
  const cities = new Set<string>(extractCities(query))
  const tokens = tokenize(query)

  for (const token of tokens) {
    for (const candidate of stripKnownPrefix(token)) {
      const mapped = CITY_SHORT_ALIASES[candidate]
      if (mapped) {
        for (const c of extractCities(mapped)) cities.add(c)
        cities.add(mapped)
      }
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const pair = `${tokens[i]} ${tokens[i + 1]}`
    const mapped = CITY_SHORT_ALIASES[pair]
    if (mapped) {
      for (const c of extractCities(mapped)) cities.add(c)
      cities.add(mapped)
    }
    for (const c of extractCities(pair)) cities.add(c)
  }

  return [...cities]
}

function familiesForTokens(tokens: string[]): NormFamily[] {
  const hits: NormFamily[] = []
  for (const family of NORM_FAMILIES) {
    const matched = tokens.some((token) =>
      [...family.strong, ...family.weak].some((term) => {
        const parts = term.split(" ")
        if (parts.length > 1) return false
        return tokensRelated(token, term) || family.strongSet.has(token) || family.weakSet.has(token)
      }),
    )
    if (matched) hits.push(family)
  }
  return hits
}

function phraseFamilies(tokens: string[]): NormFamily[] {
  const joined = tokens.join(" ")
  return NORM_FAMILIES.filter((family) =>
    family.strong.some((term) => term.includes(" ") && joined.includes(term)),
  )
}

export type ParsedJobQuery = {
  raw: string
  cities: string[]
  roleTokens: string[]
  families: NormFamily[]
}

export function parseJobQuery(query: string): ParsedJobQuery {
  const raw = query.trim()
  const cities = detectCitiesFromQuery(raw)

  let rest = normalizeHe(raw)
  const cityPhrases = [
    ...cities.map(normalizeHe),
    ...Object.keys(CITY_SHORT_ALIASES),
  ].sort((a, b) => b.length - a.length)

  for (const phrase of cityPhrases) {
    if (phrase.length >= 2 && rest.includes(phrase)) {
      rest = rest.split(phrase).join(" ")
    }
  }

  const roleTokens = tokenize(rest).filter((t) => {
    if (STOPWORDS.has(t)) return false
    if (cities.some((c) => normalizeHe(c).split(" ").includes(t))) return false
    return true
  })

  const fromPhrases = phraseFamilies(roleTokens)
  const fromTokens = familiesForTokens(roleTokens)
  const familyMap = new Map<string, NormFamily>()
  for (const f of [...fromPhrases, ...fromTokens]) familyMap.set(f.id, f)

  return {
    raw,
    cities,
    roleTokens,
    families: [...familyMap.values()],
  }
}

export type PositionSearchFields = {
  title?: string | null
  description?: string | null
  location?: string | null
  employerName?: string | null
  employer?: { name: string } | null
  keywords?: string | null
  tagText?: string | null
  tags?: string[]
  employmentType?: string | null
  category?: string | null
  requirements?: string | string[] | null
}

function employerOf(pos: PositionSearchFields): string {
  return pos.employerName || pos.employer?.name || ""
}

function tagTextOf(pos: PositionSearchFields): string {
  if (pos.tagText) return pos.tagText
  if (pos.tags?.length) return pos.tags.join(" ")
  return ""
}

function requirementsText(pos: PositionSearchFields): string {
  if (!pos.requirements) return ""
  return Array.isArray(pos.requirements) ? pos.requirements.join(" ") : pos.requirements
}

function positionCities(pos: PositionSearchFields): string[] {
  return [...new Set([
    ...extractCities(pos.location),
    ...extractCities(pos.title),
    ...extractCities(pos.category),
  ])]
}

function locationMatches(pos: PositionSearchFields, cities: string[]): boolean {
  if (cities.length === 0) return true
  const posCities = positionCities(pos)
  const locTokens = tokenize([pos.location, pos.title, pos.category].filter(Boolean).join(" "))

  return cities.some((city) => {
    const cityNorm = normalizeHe(city)
    if (posCities.some((c) => normalizeHe(c) === cityNorm)) return true
    if (posCities.some((c) => cityNorm.includes(normalizeHe(c)) || normalizeHe(c).includes(cityNorm))) {
      return cityNorm.length >= 3
    }
    const cityParts = cityNorm.split(" ").filter(Boolean)
    if (cityParts.length > 1 && cityParts.every((p) => locTokens.includes(p))) return true
    return locTokens.some((t) => tokensRelated(t, cityNorm) && cityNorm.length >= 3)
  })
}

function roleMatches(pos: PositionSearchFields, parsed: ParsedJobQuery): boolean {
  if (parsed.roleTokens.length === 0) return true

  const titleTokens = tokenize(pos.title)
  const tagTokens = tokenize(tagTextOf(pos))
  const kwTokens = tokenize(pos.keywords)
  const catTokens = tokenize(pos.category)
  const empTokens = tokenize(employerOf(pos))
  const reqTokens = tokenize(requirementsText(pos))
  const descTokens = tokenize(pos.description)
  const primary = [...titleTokens, ...tagTokens, ...kwTokens, ...catTokens]

  const tokenHitsPrimary = (token: string) =>
    textHasTerm(primary, token) || textHasTerm(empTokens, token)

  if (parsed.families.length >= 2) {
    return parsed.families.every((family) =>
      family.strong.some((term) => textHasTerm(primary, term)),
    )
  }

  if (parsed.families.length === 1) {
    const family = parsed.families[0]
    if (family.strong.some((term) => textHasTerm(primary, term))) return true
    if (family.strong.some((term) => textHasTerm([...reqTokens, ...descTokens], term))) {
      return true
    }
    return parsed.roleTokens.every(tokenHitsPrimary)
  }

  const allPrimaryHit = parsed.roleTokens.every(tokenHitsPrimary)
  if (allPrimaryHit) return true

  return parsed.roleTokens.every(
    (token) => tokenHitsPrimary(token) || textHasTerm([...reqTokens, ...descTokens, ...empTokens], token),
  )
}

export function matchesPosition(query: string, pos: PositionSearchFields): boolean {
  const q = query.trim()
  if (!q) return true
  const parsed = parseJobQuery(q)
  if (parsed.cities.length === 0 && parsed.roleTokens.length === 0) return true
  if (!locationMatches(pos, parsed.cities)) return false
  if (!roleMatches(pos, parsed)) return false
  return true
}

export function matchesJob(
  query: string,
  job: {
    title?: string | null
    location?: string | null
    description?: string | null
    category?: string | null
    requirements?: string[] | null
    client?: string | null
  },
): boolean {
  return matchesPosition(query, {
    title: job.title,
    location: job.location,
    description: job.description,
    category: job.category,
    requirements: job.requirements,
    employerName: job.client,
  })
}

function expandToken(token: string): string[] {
  const terms = new Set<string>([token])
  for (const family of NORM_FAMILIES) {
    const hit = family.strong.some((s) => {
      const first = s.split(" ")[0]
      return tokensRelated(token, first) || s === token
    })
    if (hit) {
      for (const s of family.strong) terms.add(s)
    }
  }
  return [...terms]
}

export function expandSearchTerms(query: string): string[] {
  const parsed = parseJobQuery(query)
  const all = new Set<string>()
  for (const token of parsed.roleTokens) {
    for (const t of expandToken(token)) all.add(t)
  }
  for (const city of parsed.cities) all.add(normalizeHe(city))
  return [...all]
}

export function buildSearchMatcher(query: string): ((normText: string) => boolean) | null {
  const q = normalizeHe(query)
  if (!q) return null

  const parsed = parseJobQuery(query)
  const groups: string[][] = []

  if (parsed.roleTokens.length) {
    for (const token of parsed.roleTokens) groups.push(expandToken(token))
  } else {
    const words = q.split(" ").filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    for (const word of words) groups.push(expandToken(word))
  }

  if (parsed.cities.length) {
    groups.push(parsed.cities.map(normalizeHe))
  }

  if (groups.length === 0) return null

  const required = groups.length <= 2 ? groups.length : Math.ceil(groups.length * 0.75)

  return (normText: string) => {
    const tokens = tokenize(normText)
    let hits = 0
    for (const terms of groups) {
      if (terms.some((t) => textHasTerm(tokens, t) || normText.includes(t))) hits++
    }
    return hits >= required
  }
}

export function scoreSearch(query: string, pos: PositionSearchFields): number {
  const parsed = parseJobQuery(query)
  if (!parsed.raw) return 0
  if (!matchesPosition(query, pos)) return 0

  const titleTokens = tokenize(pos.title)
  const locTokens = tokenize(pos.location)
  const empTokens = tokenize(employerOf(pos))
  const tagTokens = tokenize(tagTextOf(pos))
  const kwTokens = tokenize(pos.keywords)
  const descTokens = tokenize(pos.description)
  const titleJoined = titleTokens.join(" ")
  const qNorm = normalizeHe(query)

  let score = 0
  if (qNorm && titleJoined === qNorm) score += 400
  else if (
    qNorm &&
    titleJoined.includes(qNorm) &&
    parsed.roleTokens.length + parsed.cities.length >= 2
  ) {
    score += 250
  }

  for (const token of parsed.roleTokens) {
    const terms = expandToken(token)
    if (terms.some((t) => textHasTerm(titleTokens, t))) score += 220
    else if (terms.some((t) => textHasTerm(tagTokens, t))) score += 140
    else if (terms.some((t) => textHasTerm(kwTokens, t))) score += 90
    else if (terms.some((t) => textHasTerm(empTokens, t))) score += 70
    else if (terms.some((t) => textHasTerm(descTokens, t))) score += 25
  }

  for (const city of parsed.cities) {
    const cityNorm = normalizeHe(city)
    if (positionCities(pos).some((c) => normalizeHe(c) === cityNorm)) score += 180
    else if (textHasTerm(locTokens, cityNorm) || locTokens.join(" ").includes(cityNorm)) score += 140
    else if (textHasTerm(titleTokens, cityNorm)) score += 80
  }

  if (parsed.families.length >= 2) score += 80
  return score
}

export function buildSemanticMatcher(
  query: string,
  minMatches = 2,
): ((normText: string) => boolean) | null {
  const parsed = parseJobQuery(query)
  const concepts: string[][] = []

  if (parsed.families.length) {
    for (const family of parsed.families) concepts.push(family.strong)
  } else {
    for (const token of parsed.roleTokens.length ? parsed.roleTokens : tokenize(query)) {
      concepts.push(expandToken(token))
    }
  }

  if (concepts.length === 0) return null
  const need = Math.min(minMatches, concepts.length)

  return (normText: string) => {
    const tokens = tokenize(normText)
    let hits = 0
    for (const terms of concepts) {
      if (terms.some((t) => textHasTerm(tokens, t))) {
        hits++
        if (hits >= need) return true
      }
    }
    return false
  }
}