import { describe, it, expect } from "vitest"
import {
  parseSkillList,
  titleOverlapScore,
  skillOverlapScore,
  scoreCandidateAgainstPosition,
} from "../avigdor-fast-match"

describe("parseSkillList", () => {
  it("מפרק כישורים מופרדים בפסיקים", () => {
    expect(parseSkillList("נהיגה, מלגזה, C")).toEqual(["נהיגה", "מלגזה"])
  })

  it("מפרק מערך JSON", () => {
    expect(parseSkillList('["React", "Node", "x"]')).toEqual(["react", "node"])
  })
})

describe("titleOverlapScore", () => {
  it("נותן ניקוד לחפיפה בין נהג משאית לנהג", () => {
    expect(titleOverlapScore("נהג משאית", "נהג")).toBe(5)
  })

  it.each(["QA", "HR", "C#", "IT"])("תומך בתפקיד/כישור תקין בן שני תווים: %s", (title) => {
    expect(titleOverlapScore(`(${title})`, title.toLowerCase())).toBe(5)
    expect(titleOverlapScore(`${title} ${title}`, title)).toBe(5)
  })

  it.each(["C", "x", "א", "7", "+", "#"])("לא מנקד תו בודד שרירותי: %s", (title) => {
    expect(titleOverlapScore(title, title)).toBe(0)
  })
})

describe("skillOverlapScore", () => {
  it("מחזיר 0 כשאין כישורים", () => {
    expect(skillOverlapScore([], "נהג משאית דרוש")).toBe(0)
    expect(skillOverlapScore(parseSkillList(""), "נהג משאית דרוש")).toBe(0)
  })
})

describe("scoreCandidateAgainstPosition", () => {
  const sharedTag = { id: "tag-driver", name: "נהג" }

  it.each([
    ["   ", "תל אביב"], ["\t\r\n", "חיפה"], ["\u00a0", "ירושלים"],
    ["תל אביב", "   "], ["חיפה", "\t\n"], ["   ", "   "],
    [undefined, "תל אביב"], [null, "תל אביב"], ["", "תל אביב"],
  ])("מיקום חסר או רווחים בלבד אינם התאמה מדויקת: %s / %s", (candidateCity, location) => {
    expect(scoreCandidateAgainstPosition({
      candidateCity, candidateTagIds: [], position: { title: "נהג", location, tags: [] },
    })).toEqual({ score: 0, distanceKm: null, matchingTags: [] })
  })

  it("שומר התאמה אמיתית לעיר עם רווחים מסביב ותמיכה במיקום מרובה ערים", () => {
    expect(scoreCandidateAgainstPosition({
      candidateCity: " \tחיפה\n", candidateTagIds: [],
      position: { title: "נהג", location: " תל אביב, חיפה / אילת ", tags: [] },
    })).toEqual({ score: 50, distanceKm: 0, matchingTags: [] })
  })

  it("נותן ציון גבוה לאותה עיר ותגית משותפת, וממלא matchingTags", () => {
    const high = scoreCandidateAgainstPosition({
      candidateCity: "תל אביב",
      candidateTitle: "נהג משאית",
      candidateSkills: "נהיגה, רישיון C",
      candidateTagIds: [sharedTag.id],
      position: {
        title: "נהג",
        location: "תל אביב",
        description: "דרוש נהג עם רישיון",
        requirements: "נהיגה",
        tags: [sharedTag],
      },
    })
    expect(high.score).toBeGreaterThan(50)
    expect(high.matchingTags).toEqual(["נהג"])
    expect(high.distanceKm).toBe(0)
  })

  it("נותן ציון נמוך יותר לעיר רחוקה בלי חפיפה", () => {
    const low = scoreCandidateAgainstPosition({
      candidateCity: "אילת",
      candidateTitle: "קופאי",
      candidateSkills: "",
      candidateTagIds: [],
      position: {
        title: "נהג משאית",
        location: "נהריה",
        description: "דרוש נהג",
        requirements: "רישיון C",
        tags: [sharedTag],
      },
    })
    const high = scoreCandidateAgainstPosition({
      candidateCity: "תל אביב",
      candidateTitle: "נהג משאית",
      candidateSkills: "נהיגה",
      candidateTagIds: [sharedTag.id],
      position: {
        title: "נהג",
        location: "תל אביב",
        description: "דרוש נהג",
        requirements: "נהיגה",
        tags: [sharedTag],
      },
    })
    expect(low.score).toBeLessThan(high.score)
    expect(low.matchingTags).toEqual([])
  })

  it("מנקד תגית לפי שם מנורמל גם כשהמזהים שונים, בלי כפל ניקוד", () => {
    const byName = scoreCandidateAgainstPosition({
      candidateTagIds: ["a"],
      candidateTags: [{ id: "a", name: "מלגזן" }],
      position: { title: "משרה", tags: [{ id: "b", name: "מלגזן" }] },
    })
    expect(byName.score).toBe(5)
    expect(byName.matchingTags).toEqual(["מלגזן"])

    const idAndNameSameTag = scoreCandidateAgainstPosition({
      candidateTagIds: ["same"],
      candidateTags: [{ id: "same", name: "מלגזן" }],
      position: { title: "משרה", tags: [{ id: "same", name: "מלגזן" }] },
    })
    expect(idAndNameSameTag.score).toBe(5)
    expect(idAndNameSameTag.matchingTags).toEqual(["מלגזן"])
  })
})
