-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "emailSlug" TEXT,
    "formPayloadJson" TEXT NOT NULL,
    "assigneeId" TEXT,
    "opdsl" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "archivedAt" DATETIME,
    "deletedAt" DATETIME,
    "escalatedToId" TEXT,
    CONSTRAINT "Case_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_escalatedToId_fkey" FOREIGN KEY ("escalatedToId") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("archivedAt", "assigneeId", "boardId", "caseType", "closedAt", "columnId", "createdAt", "customerName", "deletedAt", "description", "formPayloadJson", "id", "opdsl", "position", "priority", "productType", "quoteId", "specs", "title", "updatedAt") SELECT "archivedAt", "assigneeId", "boardId", "caseType", "closedAt", "columnId", "createdAt", "customerName", "deletedAt", "description", "formPayloadJson", "id", "opdsl", "position", "priority", "productType", "quoteId", "specs", "title", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_emailSlug_key" ON "Case"("emailSlug");
CREATE UNIQUE INDEX "Case_escalatedToId_key" ON "Case"("escalatedToId");
CREATE INDEX "Case_boardId_idx" ON "Case"("boardId");
CREATE INDEX "Case_columnId_idx" ON "Case"("columnId");
CREATE INDEX "Case_assigneeId_idx" ON "Case"("assigneeId");
CREATE INDEX "Case_archivedAt_idx" ON "Case"("archivedAt");
CREATE INDEX "Case_caseType_idx" ON "Case"("caseType");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
