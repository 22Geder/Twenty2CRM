CREATE TABLE "GmailMailbox" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastScannedAt" TIMESTAMP(3),
    "connectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GmailMailbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GmailScanLog" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "emailsChecked" INTEGER NOT NULL DEFAULT 0,
    "proposalsCreated" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmailScanLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateUpdate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "proposedStatus" TEXT,
    "sourceMessageId" TEXT,
    "sourceSender" TEXT,
    "candidateId" TEXT,
    "positionId" TEXT,
    "mailboxId" TEXT,
    "uploaderId" TEXT,
    "recruiterId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CandidateUpdate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GmailMailbox_email_key" ON "GmailMailbox"("email");
CREATE INDEX "GmailScanLog_mailboxId_createdAt_idx" ON "GmailScanLog"("mailboxId", "createdAt");
CREATE UNIQUE INDEX "CandidateUpdate_mailboxId_sourceMessageId_type_key" ON "CandidateUpdate"("mailboxId", "sourceMessageId", "type");
CREATE INDEX "CandidateUpdate_status_createdAt_idx" ON "CandidateUpdate"("status", "createdAt");
CREATE INDEX "CandidateUpdate_candidateId_idx" ON "CandidateUpdate"("candidateId");

ALTER TABLE "GmailMailbox" ADD CONSTRAINT "GmailMailbox_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GmailScanLog" ADD CONSTRAINT "GmailScanLog_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "GmailMailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "GmailMailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateUpdate" ADD CONSTRAINT "CandidateUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;