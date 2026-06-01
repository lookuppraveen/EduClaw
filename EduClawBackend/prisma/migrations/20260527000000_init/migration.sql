-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'faculty', 'advisor', 'admin', 'auditor');

-- CreateEnum
CREATE TYPE "EnrollmentRole" AS ENUM ('student', 'faculty', 'advisor');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('textbook', 'lecture', 'worksheet');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('approved', 'modified', 'blocked');

-- CreateEnum
CREATE TYPE "AgentName" AS ENUM ('inference', 'dialogue', 'execution', 'validation', 'reflection');

-- CreateEnum
CREATE TYPE "ReflectionKind" AS ENUM ('metacognitive', 'goal_check');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PolicyViolationAction" AS ENUM ('modify', 'block', 'flag');

-- CreateEnum
CREATE TYPE "FlaggedTurnStatus" AS ENUM ('pending', 'resolved');

-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('approve', 'override', 'escalate');

-- CreateEnum
CREATE TYPE "IntegrationStatusValue" AS ENUM ('connected', 'degraded', 'disconnected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "name" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "userId" TEXT NOT NULL,
    "roleName" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("userId","roleName")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "role" "EnrollmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateTable
CREATE TABLE "LearnerState" (
    "learnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerState_pkey" PRIMARY KEY ("learnerId")
);

-- CreateTable
CREATE TABLE "LearnerGoal" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerMastery" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionEntry" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "kind" "ReflectionKind" NOT NULL DEFAULT 'metacognitive',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReflectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "learnerId" TEXT NOT NULL,
    "courseContext" BOOLEAN NOT NULL DEFAULT true,
    "priorConversations" BOOLEAN NOT NULL DEFAULT true,
    "advisorVisibility" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyTools" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("learnerId")
);

-- CreateTable
CREATE TABLE "ConsentHistory" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT,
    "courseContext" BOOLEAN NOT NULL,
    "priorConversations" BOOLEAN NOT NULL,
    "advisorVisibility" BOOLEAN NOT NULL,
    "thirdPartyTools" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTurn" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "studentInput" TEXT NOT NULL,
    "selectedChip" TEXT,
    "inferenceIntent" TEXT NOT NULL,
    "inferenceConfusion" TEXT NOT NULL,
    "inferenceGap" TEXT NOT NULL,
    "inferenceUrgency" TEXT NOT NULL,
    "inferenceConfidence" DOUBLE PRECISION NOT NULL,
    "inferenceRationale" TEXT NOT NULL,
    "inferenceNextAgent" "AgentName" NOT NULL,
    "dialogueQuestion" TEXT NOT NULL,
    "dialogueChips" TEXT[],
    "executionScaffold" TEXT NOT NULL,
    "executionExamples" TEXT[],
    "executionCitations" JSONB NOT NULL,
    "executionAction" TEXT NOT NULL,
    "validationStatus" "ValidationStatus" NOT NULL,
    "validationReason" TEXT NOT NULL,
    "validationMessage" TEXT NOT NULL,
    "validationClause" TEXT NOT NULL,
    "reflectionPrompt" TEXT NOT NULL,
    "reflectionKind" "ReflectionKind" NOT NULL,
    "reflectionOptional" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTrace" (
    "id" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "agent" "AgentName" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "outputSummary" TEXT NOT NULL,
    "internalDetails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationPolicy" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "title" TEXT NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ValidationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyClause" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "onViolation" "PolicyViolationAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlaggedTurn" (
    "id" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" "FlaggedTurnStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "FlaggedTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewDecision" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecisionType" NOT NULL,
    "note" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationStatus" (
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "IntegrationStatusValue" NOT NULL,
    "details" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationStatus_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "principal" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HttpMetric" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "statusClass" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "sumSeconds" DOUBLE PRECISION NOT NULL,
    "bucketCounts" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HttpMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_roleName_idx" ON "UserRoleAssignment"("roleName");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Course_code_idx" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_term_key" ON "Course"("code", "term");

-- CreateIndex
CREATE INDEX "Outcome_courseId_idx" ON "Outcome"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_courseId_code_key" ON "Outcome"("courseId", "code");

-- CreateIndex
CREATE INDEX "Material_courseId_idx" ON "Material"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_courseId_title_url_key" ON "Material"("courseId", "title", "url");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "LearnerGoal_learnerId_idx" ON "LearnerGoal"("learnerId");

-- CreateIndex
CREATE INDEX "LearnerMastery_learnerId_idx" ON "LearnerMastery"("learnerId");

-- CreateIndex
CREATE INDEX "LearnerMastery_outcomeId_idx" ON "LearnerMastery"("outcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerMastery_learnerId_outcomeId_key" ON "LearnerMastery"("learnerId", "outcomeId");

-- CreateIndex
CREATE INDEX "ReflectionEntry_learnerId_idx" ON "ReflectionEntry"("learnerId");

-- CreateIndex
CREATE INDEX "ConsentHistory_learnerId_idx" ON "ConsentHistory"("learnerId");

-- CreateIndex
CREATE INDEX "ConsentHistory_actorUserId_idx" ON "ConsentHistory"("actorUserId");

-- CreateIndex
CREATE INDEX "ConsentHistory_learnerId_createdAt_idx" ON "ConsentHistory"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_learnerId_idx" ON "Conversation"("learnerId");

-- CreateIndex
CREATE INDEX "Conversation_courseId_idx" ON "Conversation"("courseId");

-- CreateIndex
CREATE INDEX "Conversation_learnerId_courseId_createdAt_idx" ON "Conversation"("learnerId", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationTurn_conversationId_idx" ON "ConversationTurn"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationTurn_learnerId_idx" ON "ConversationTurn"("learnerId");

-- CreateIndex
CREATE INDEX "ConversationTurn_courseId_idx" ON "ConversationTurn"("courseId");

-- CreateIndex
CREATE INDEX "ConversationTurn_learnerId_courseId_createdAt_idx" ON "ConversationTurn"("learnerId", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTrace_turnId_idx" ON "AgentTrace"("turnId");

-- CreateIndex
CREATE INDEX "AgentTrace_agent_idx" ON "AgentTrace"("agent");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTrace_turnId_agent_key" ON "AgentTrace"("turnId", "agent");

-- CreateIndex
CREATE INDEX "ValidationPolicy_courseId_idx" ON "ValidationPolicy"("courseId");

-- CreateIndex
CREATE INDEX "ValidationPolicy_assignmentId_idx" ON "ValidationPolicy"("assignmentId");

-- CreateIndex
CREATE INDEX "ValidationPolicy_status_idx" ON "ValidationPolicy"("status");

-- CreateIndex
CREATE INDEX "ValidationPolicy_courseId_assignmentId_status_idx" ON "ValidationPolicy"("courseId", "assignmentId", "status");

-- CreateIndex
CREATE INDEX "PolicyClause_policyId_idx" ON "PolicyClause"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyClause_policyId_rule_key" ON "PolicyClause"("policyId", "rule");

-- CreateIndex
CREATE UNIQUE INDEX "FlaggedTurn_turnId_key" ON "FlaggedTurn"("turnId");

-- CreateIndex
CREATE INDEX "FlaggedTurn_policyId_idx" ON "FlaggedTurn"("policyId");

-- CreateIndex
CREATE INDEX "FlaggedTurn_courseId_idx" ON "FlaggedTurn"("courseId");

-- CreateIndex
CREATE INDEX "FlaggedTurn_learnerId_idx" ON "FlaggedTurn"("learnerId");

-- CreateIndex
CREATE INDEX "FlaggedTurn_status_idx" ON "FlaggedTurn"("status");

-- CreateIndex
CREATE INDEX "ReviewDecision_flagId_idx" ON "ReviewDecision"("flagId");

-- CreateIndex
CREATE INDEX "ReviewDecision_reviewerId_idx" ON "ReviewDecision"("reviewerId");

-- CreateIndex
CREATE INDEX "ReviewDecision_policyId_idx" ON "ReviewDecision"("policyId");

-- CreateIndex
CREATE INDEX "ReviewDecision_clauseId_idx" ON "ReviewDecision"("clauseId");

-- CreateIndex
CREATE INDEX "ReviewDecision_courseId_idx" ON "ReviewDecision"("courseId");

-- CreateIndex
CREATE INDEX "ReviewDecision_decision_idx" ON "ReviewDecision"("decision");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog"("targetType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_principal_method_path_idempotencyKey_key" ON "IdempotencyRecord"("principal", "method", "path", "idempotencyKey");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "HttpMetric_method_route_statusClass_key" ON "HttpMetric"("method", "route", "statusClass");

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "Role"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerState" ADD CONSTRAINT "LearnerState_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerGoal" ADD CONSTRAINT "LearnerGoal_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerState"("learnerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerMastery" ADD CONSTRAINT "LearnerMastery_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerState"("learnerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionEntry" ADD CONSTRAINT "ReflectionEntry_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerState"("learnerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentHistory" ADD CONSTRAINT "ConsentHistory_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Consent"("learnerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentHistory" ADD CONSTRAINT "ConsentHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTurn" ADD CONSTRAINT "ConversationTurn_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTrace" ADD CONSTRAINT "AgentTrace_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "ConversationTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationPolicy" ADD CONSTRAINT "ValidationPolicy_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationPolicy" ADD CONSTRAINT "ValidationPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationPolicy" ADD CONSTRAINT "ValidationPolicy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyClause" ADD CONSTRAINT "PolicyClause_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ValidationPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedTurn" ADD CONSTRAINT "FlaggedTurn_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "ConversationTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedTurn" ADD CONSTRAINT "FlaggedTurn_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "PolicyClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FlaggedTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ValidationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "PolicyClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

