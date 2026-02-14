-- CreateTable
CREATE TABLE "AiIngressRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" TEXT NOT NULL,
    "targetBoardId" TEXT NOT NULL,
    "targetColumnId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiIngressRule_targetBoardId_fkey" FOREIGN KEY ("targetBoardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AiIngressRule_targetColumnId_fkey" FOREIGN KEY ("targetColumnId") REFERENCES "Column" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GarticaInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'range',
    "group" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimelineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "caseId" TEXT,
    "emailId" TEXT,
    "noteId" TEXT,
    "sourceText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "AftermarketAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "installDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "aiPrediction" TEXT,
    "revenuePotential" INTEGER NOT NULL,
    "lastServiceDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DashboardConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "draft" TEXT NOT NULL,
    "published" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Team" ("color", "createdAt", "description", "id", "name", "updatedAt") SELECT "color", "createdAt", "description", "id", "name", "updatedAt" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "caseType" TEXT NOT NULL DEFAULT 'ORDER',
    "quoteId" TEXT,
    "productType" TEXT,
    "specs" TEXT,
    "customerName" TEXT,
    "poNumber" TEXT,
    "crmSystem" TEXT,
    "crmId" TEXT,
    "crmData" TEXT,
    "emailSlug" TEXT,
    "formPayloadJson" TEXT NOT NULL,
    "assigneeId" TEXT,
    "opdsl" DATETIME,
    "timelineItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "archivedAt" DATETIME,
    "deletedAt" DATETIME,
    "creatorId" TEXT,
    "escalatedToId" TEXT,
    CONSTRAINT "Case_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_timelineItemId_fkey" FOREIGN KEY ("timelineItemId") REFERENCES "TimelineItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_escalatedToId_fkey" FOREIGN KEY ("escalatedToId") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("archivedAt", "assigneeId", "boardId", "caseType", "closedAt", "columnId", "createdAt", "customerName", "deletedAt", "description", "emailSlug", "escalatedToId", "formPayloadJson", "id", "opdsl", "poNumber", "position", "priority", "productType", "quoteId", "specs", "title", "updatedAt") SELECT "archivedAt", "assigneeId", "boardId", "caseType", "closedAt", "columnId", "createdAt", "customerName", "deletedAt", "description", "emailSlug", "escalatedToId", "formPayloadJson", "id", "opdsl", "poNumber", "position", "priority", "productType", "quoteId", "specs", "title", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_emailSlug_key" ON "Case"("emailSlug");
CREATE UNIQUE INDEX "Case_escalatedToId_key" ON "Case"("escalatedToId");
CREATE INDEX "Case_boardId_idx" ON "Case"("boardId");
CREATE INDEX "Case_columnId_idx" ON "Case"("columnId");
CREATE INDEX "Case_assigneeId_idx" ON "Case"("assigneeId");
CREATE INDEX "Case_archivedAt_idx" ON "Case"("archivedAt");
CREATE INDEX "Case_caseType_idx" ON "Case"("caseType");
CREATE INDEX "Case_timelineItemId_idx" ON "Case"("timelineItemId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "TimelineItem_projectId_idx" ON "TimelineItem"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AftermarketAsset_serialNumber_key" ON "AftermarketAsset"("serialNumber");
