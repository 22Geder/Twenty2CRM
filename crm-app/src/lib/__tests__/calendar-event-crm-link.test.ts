import { describe, expect, it } from "vitest"
import { mapInterviewsByGoogleEventId } from "@/lib/calendar-event-crm-link"

function interview(
  id: string,
  googleCalendarEventId: string | null,
  candidateId = `candidate-${id}`,
) {
  return {
    id,
    title: `ראיון ${id}`,
    googleCalendarEventId,
    candidateId,
    candidate: { id: candidateId, name: `מועמד ${id}` },
  }
}

describe("mapInterviewsByGoogleEventId", () => {
  it("returns an empty map for an empty list", () => {
    expect(mapInterviewsByGoogleEventId([])).toEqual(new Map())
  })

  it("maps a Google event to its CRM interview and candidate", () => {
    const links = mapInterviewsByGoogleEventId([interview("interview-1", "event-1")])

    expect(links.get("event-1")).toEqual({
      interviewId: "interview-1",
      candidateId: "candidate-interview-1",
      candidateName: "מועמד interview-1",
      interviewTitle: "ראיון interview-1",
    })
  })

  it("keeps the first interview when event ids are duplicated", () => {
    const links = mapInterviewsByGoogleEventId([
      interview("first", "event-1"),
      interview("second", "event-1"),
    ])

    expect(links.get("event-1")?.interviewId).toBe("first")
    expect(links).toHaveLength(1)
  })
})