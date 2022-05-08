-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lm_asset" INTEGER,
    "syncedAt" DATETIME NOT NULL
);
INSERT INTO "new_Account" ("id", "lm_asset", "syncedAt") SELECT "id", "lm_asset", "syncedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
