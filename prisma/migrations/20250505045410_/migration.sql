-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIResponse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consultationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'assistant',
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIResponse_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AIResponse" ("consultationId", "id", "message", "timestamp") SELECT "consultationId", "id", "message", "timestamp" FROM "AIResponse";
DROP TABLE "AIResponse";
ALTER TABLE "new_AIResponse" RENAME TO "AIResponse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
