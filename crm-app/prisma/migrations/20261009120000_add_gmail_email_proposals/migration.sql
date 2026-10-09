CREATE TABLE "GmailCandidateImport" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "sourceMessageId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sourceSender" TEXT,
    "sourceSubject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "parsedCandidate" TEXT NOT NULL DEFAULT '{}',
    "extractedChars" INTEGER,
    "errorMessage" TEXT,
    "candidateId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmailCandidateImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GmailInterviewProposal" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "sourceMessageId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "positionId" TEXT,
    "proposedAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "snippet" TEXT,
    "sourceSender" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "interviewId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmailInterviewProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GmailCandidateImport_mailboxId_sourceMessageId_attachmentId_key" ON "GmailCandidateImport"("mailboxId", "sourceMessageId", "attachmentId");
CREATE INDEX "GmailCandidateImport_status_createdAt_idx" ON "GmailCandidateImport"("status", "createdAt");
CREATE UNIQUE INDEX "GmailInterviewProposal_mailboxId_sourceMessageId_candidateI_key" ON "GmailInterviewProposal"("mailboxId", "sourceMessageId", "candidateId");
CREATE INDEX "GmailInterviewProposal_status_createdAt_idx" ON "GmailInterviewProposal"("status", "createdAt");
