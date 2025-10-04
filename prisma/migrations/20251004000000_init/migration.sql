-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_graphql";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "supabase_vault";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IssueComplexity" AS ENUM ('TRIVIAL', 'SIMPLE', 'MODERATE', 'COMPLEX', 'VERY_COMPLEX');

-- CreateEnum
CREATE TYPE "ZendeskIntegrationStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'ERROR');

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userMessage" TEXT NOT NULL,
    "llmMessage" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linearOrgId" TEXT,
    "linearOrgName" TEXT,
    "zendeskSubdomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "linearProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "linearCycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sprint_date" TIMESTAMP(3),
    "status" "IssueStatus" NOT NULL DEFAULT 'TODO',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "complexity" "IssueComplexity" NOT NULL DEFAULT 'MODERATE',
    "projectId" TEXT NOT NULL,
    "sprintId" TEXT,
    "assigneeId" TEXT,
    "repoId" UUID,
    "linearIssueId" TEXT,
    "assigneeLinearUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linear_connection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orgLinearId" TEXT NOT NULL,
    "orgName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "installerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linear_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinearUser" (
    "id" TEXT NOT NULL,
    "orgLinearId" TEXT NOT NULL,
    "linearUserId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "localUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinearUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinearWebhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "endpointPath" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinearWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZendeskIntegration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "zendeskSubdomain" TEXT NOT NULL,
    "status" "ZendeskIntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "installerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZendeskIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZendeskWebhook" (
    "id" TEXT NOT NULL,
    "zendeskIntegrationId" TEXT NOT NULL,
    "endpointPath" TEXT NOT NULL,
    "signingSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZendeskWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZendeskEventRaw" (
    "id" TEXT NOT NULL,
    "zendeskIntegrationId" TEXT NOT NULL,
    "vendorEventId" TEXT,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ZendeskEventRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZendeskTicket" (
    "id" TEXT NOT NULL,
    "zendeskIntegrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "status" TEXT,
    "priority" TEXT,
    "requesterId" TEXT,
    "assigneeId" TEXT,
    "tags" TEXT[],
    "url" TEXT,
    "createdAtVendor" TIMESTAMP(3),
    "updatedAtVendor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZendeskTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZendeskTicketMessage" (
    "id" TEXT NOT NULL,
    "zendeskIntegrationId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "body" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAtVendor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZendeskTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repos" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "local_path" TEXT,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vector_text" (
    "id" SERIAL NOT NULL,
    "repo_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "chunk_content" TEXT NOT NULL,
    "function_name" TEXT,
    "class_name" TEXT,
    "language" TEXT NOT NULL,
    "chunk_type" TEXT NOT NULL,
    "line_start" INTEGER NOT NULL,
    "line_end" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vector_text_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_linearOrgId_key" ON "Organization"("linearOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_linearProjectId_key" ON "Project"("linearProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_linearCycleId_key" ON "Sprint"("linearCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_linearIssueId_key" ON "Issue"("linearIssueId");

-- CreateIndex
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");

-- CreateIndex
CREATE INDEX "Issue_sprintId_idx" ON "Issue"("sprintId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_repoId_idx" ON "Issue"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "linear_connection_orgLinearId_key" ON "linear_connection"("orgLinearId");

-- CreateIndex
CREATE UNIQUE INDEX "linear_connection_organizationId_key" ON "linear_connection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "LinearUser_localUserId_key" ON "LinearUser"("localUserId");

-- CreateIndex
CREATE INDEX "LinearUser_localUserId_idx" ON "LinearUser"("localUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LinearUser_orgLinearId_linearUserId_key" ON "LinearUser"("orgLinearId", "linearUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LinearWebhook_organizationId_endpointPath_key" ON "LinearWebhook"("organizationId", "endpointPath");

-- CreateIndex
CREATE INDEX "ZendeskIntegration_organizationId_idx" ON "ZendeskIntegration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskIntegration_organizationId_zendeskSubdomain_key" ON "ZendeskIntegration"("organizationId", "zendeskSubdomain");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskWebhook_zendeskIntegrationId_key" ON "ZendeskWebhook"("zendeskIntegrationId");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskWebhook_zendeskIntegrationId_endpointPath_key" ON "ZendeskWebhook"("zendeskIntegrationId", "endpointPath");

-- CreateIndex
CREATE INDEX "ZendeskEventRaw_zendeskIntegrationId_receivedAt_idx" ON "ZendeskEventRaw"("zendeskIntegrationId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskEventRaw_zendeskIntegrationId_vendorEventId_key" ON "ZendeskEventRaw"("zendeskIntegrationId", "vendorEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskEventRaw_zendeskIntegrationId_payloadHash_key" ON "ZendeskEventRaw"("zendeskIntegrationId", "payloadHash");

-- CreateIndex
CREATE INDEX "ZendeskTicket_zendeskIntegrationId_status_idx" ON "ZendeskTicket"("zendeskIntegrationId", "status");

-- CreateIndex
CREATE INDEX "ZendeskTicket_zendeskIntegrationId_createdAtVendor_idx" ON "ZendeskTicket"("zendeskIntegrationId", "createdAtVendor");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskTicket_zendeskIntegrationId_externalId_key" ON "ZendeskTicket"("zendeskIntegrationId", "externalId");

-- CreateIndex
CREATE INDEX "ZendeskTicketMessage_ticketId_createdAtVendor_idx" ON "ZendeskTicketMessage"("ticketId", "createdAtVendor");

-- CreateIndex
CREATE UNIQUE INDEX "ZendeskTicketMessage_zendeskIntegrationId_externalMessageId_key" ON "ZendeskTicketMessage"("zendeskIntegrationId", "externalMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "repos_url_key" ON "repos"("url");

-- CreateIndex
CREATE INDEX "repos_userId_idx" ON "repos"("userId");

-- CreateIndex
CREATE INDEX "vector_text_repo_id_idx" ON "vector_text"("repo_id");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linear_connection" ADD CONSTRAINT "linear_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinearUser" ADD CONSTRAINT "LinearUser_localUserId_fkey" FOREIGN KEY ("localUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinearWebhook" ADD CONSTRAINT "LinearWebhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskIntegration" ADD CONSTRAINT "ZendeskIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskWebhook" ADD CONSTRAINT "ZendeskWebhook_zendeskIntegrationId_fkey" FOREIGN KEY ("zendeskIntegrationId") REFERENCES "ZendeskIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskEventRaw" ADD CONSTRAINT "ZendeskEventRaw_zendeskIntegrationId_fkey" FOREIGN KEY ("zendeskIntegrationId") REFERENCES "ZendeskIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskTicket" ADD CONSTRAINT "ZendeskTicket_zendeskIntegrationId_fkey" FOREIGN KEY ("zendeskIntegrationId") REFERENCES "ZendeskIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskTicketMessage" ADD CONSTRAINT "ZendeskTicketMessage_zendeskIntegrationId_fkey" FOREIGN KEY ("zendeskIntegrationId") REFERENCES "ZendeskIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZendeskTicketMessage" ADD CONSTRAINT "ZendeskTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ZendeskTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repos" ADD CONSTRAINT "repos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vector_text" ADD CONSTRAINT "vector_text_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

