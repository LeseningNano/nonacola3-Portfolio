-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Showreel" (
    "showreelId" TEXT NOT NULL PRIMARY KEY DEFAULT 'showreelId',
    "showreelUrl" TEXT NOT NULL DEFAULT '',
    "videoType" TEXT NOT NULL DEFAULT 'url',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Showreel" ("showreelId", "showreelUrl", "updatedAt") SELECT "showreelId", "showreelUrl", "updatedAt" FROM "Showreel";
DROP TABLE "Showreel";
ALTER TABLE "new_Showreel" RENAME TO "Showreel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
