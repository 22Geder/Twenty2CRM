import { calculateLocationScore } from "./israel-distance"

function uniqueSkills(values: unknown[]): string[] {
  return [...new Set(values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, " "))
    .filter((value) => value.length > 1))]
}

function normalizeTagName(name?: string | null): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ")
}

export function parseSkillList(skills: string | null | undefined): string[] {
  if (!skills) return []
  const trimmed = skills.trim()
  if (!trimmed) return []
  if (/^[\[{]/.test(trimmed)) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      return Array.isArray(parsed) ? uniqueSkills(parsed) : []
    } catch {
      // JSON פגום אינו רשימת כישורים: לא מנקדים שברי אובייקטים או מערכים.
      return []
    }
  }
  return uniqueSkills(trimmed.split(/[,،;/|]+/))
}

export function titleOverlapScore(left?: string | null, right?: string | null): number {
  if (!left || !right) return 0
  // מילים שלמות וייחודיות, כולל QA / HR / C# ושמות כמו Node.js / C++, לא אות בודדת.
  const words = (text: string) => new Set(
    (text.toLowerCase().match(new RegExp("[\\p{L}\\p{N}\\p{M}]+(?:\\.[\\p{L}\\p{N}\\p{M}]+)*[+#]*", "gu")) || [])
      .filter((word) => word.length > 1)
  )
  const a = words(left)
  const b = words(right)
  const hits = [...a].filter((word) => b.has(word)).length
  return Math.min(15, hits * 5)
}

export function skillOverlapScore(candidateSkills: string[], haystack: string): number {
  if (!candidateSkills.length || !haystack) return 0
  const text = haystack.toLowerCase().replace(/\s+/g, " ")
  const hits = uniqueSkills(candidateSkills).filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // \b אינו גבול מילה עברית; לא מתאימים Java ל-JavaScript או נהג למנהג.
    return new RegExp(`(^|[^\\p{L}\\p{N}\\p{M}_+#])${escaped}($|[^\\p{L}\\p{N}\\p{M}_+#])`, "u").test(text)
  }).length
  return Math.min(10, hits * 2)
}

export function scoreCandidateAgainstPosition(input: {
  candidateCity?: string | null
  candidateTitle?: string | null
  candidateSkills?: string | null
  candidateTagIds: Iterable<string>
  candidateTags?: { id?: string; name?: string | null }[]
  position: {
    title: string
    location?: string | null
    description?: string | null
    requirements?: string | null
    tags: { id: string; name: string }[]
  }
}): { score: number; distanceKm: number | null; matchingTags: string[] } {
  const candidateTagIds = new Set(input.candidateTagIds)
  for (const tag of input.candidateTags || []) {
    if (tag.id) candidateTagIds.add(tag.id)
  }
  const candidateTagNames = new Set(
    (input.candidateTags || [])
      .map((tag) => normalizeTagName(tag.name))
      .filter((name) => name.length > 0)
  )
  // רווחים בלבד הם מיקום חסר; אחרת includes('') עלול להעניק התאמה מלאה שגויה.
  const loc = calculateLocationScore(input.candidateCity?.trim() || "", input.position.location?.trim() || "")
  const positionTags = [...new Map(input.position.tags.map((tag) => [tag.id, tag])).values()]
  // התאמת תגית לפי מזהה או שם מנורמל — בלי לספור פעמיים את אותה תגית משרה.
  const tagHits = positionTags.filter((t) =>
    candidateTagIds.has(t.id) || candidateTagNames.has(normalizeTagName(t.name))
  )
  const tagScore = Math.min(25, tagHits.length * 5)
  const titleScore = titleOverlapScore(input.candidateTitle, input.position.title)
  const skillScore = skillOverlapScore(
    parseSkillList(input.candidateSkills),
    `${input.position.title} ${input.position.description || ""} ${input.position.requirements || ""} ${positionTags.map((t) => t.name).join(" ")}`
  )
  // דירוג היוריסטי בלבד; המשקלים הקיימים נשמרים ואינם הסתברות סטטיסטית.
  const score = Math.min(100, loc.score + tagScore + titleScore + skillScore)
  return {
    score,
    distanceKm: loc.distanceKm,
    matchingTags: tagHits.slice(0, 5).map((t) => t.name),
  }
}
