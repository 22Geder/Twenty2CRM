import { syncCandidateStatusToTeamCalendars } from "@/lib/candidate-status-calendar"

type InProcessCandidateCalendarInput = {
  candidateId: string
  candidateName: string
  inProcessAt: Date
  positionTitle?: string | null
  employerName?: string | null
  notifyPartner?: boolean
}

export async function syncInProcessCandidateToTeamCalendars(
  input: InProcessCandidateCalendarInput
): Promise<void> {
  await syncCandidateStatusToTeamCalendars({
    candidateId: input.candidateId,
    candidateName: input.candidateName,
    status: "IN_PROCESS",
    statusDate: input.inProcessAt,
    positionTitle: input.positionTitle,
    employerName: input.employerName,
    notifyPartner: input.notifyPartner,
  })
}