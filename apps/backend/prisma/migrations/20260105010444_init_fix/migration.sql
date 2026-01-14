-- AlterTable
ALTER TABLE "Case" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "IngressRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "targetBoardId" TEXT NOT NULL,
    "targetColumnId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IngressRule_targetBoardId_fkey" FOREIGN KEY ("targetBoardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IngressRule_targetColumnId_fkey" FOREIGN KEY ("targetColumnId") REFERENCES "Column" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
