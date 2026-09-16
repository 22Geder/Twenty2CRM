import { describe, expect, it } from "vitest"
import { buildPositionSnapshot, getJobUpdates } from "../job-update-notifications"

describe("job update notifications", () => {
  it("מחשב בנפרד משרות שנוספו והוסרו באותה חברה", () => {
    const previous = buildPositionSnapshot([
      { id: "position-1", employer: { id: "employer-1", name: "חברה א" } },
      { id: "position-2", employer: { id: "employer-1", name: "חברה א" } },
    ])
    const current = buildPositionSnapshot([
      { id: "position-2", employer: { id: "employer-1", name: "חברה א" } },
      { id: "position-3", employer: { id: "employer-1", name: "חברה א" } },
      { id: "position-4", employer: { id: "employer-1", name: "חברה א" } },
    ])

    expect(getJobUpdates(previous, current)).toEqual([
      {
        employerId: "employer-1",
        employerName: "חברה א",
        added: 2,
        removed: 1,
      },
    ])
  })

  it("מדווח על חברה שכל המשרות שלה הוסרו", () => {
    const previous = buildPositionSnapshot([
      { id: "position-1", employer: { id: "employer-1", name: "חברה א" } },
    ])

    expect(getJobUpdates(previous, {})).toEqual([
      {
        employerId: "employer-1",
        employerName: "חברה א",
        added: 0,
        removed: 1,
      },
    ])
  })

  it("לא יוצר עדכון כשהמשרות לא השתנו", () => {
    const snapshot = buildPositionSnapshot([
      { id: "position-1", employer: { id: "employer-1", name: "חברה א" } },
    ])

    expect(getJobUpdates(snapshot, snapshot)).toEqual([])
  })
})