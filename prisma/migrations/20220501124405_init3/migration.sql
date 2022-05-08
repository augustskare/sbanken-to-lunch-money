/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lm_asset" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL
);
INSERT INTO "new_Account" ("id", "lm_asset", "syncedAt") SELECT "id", "lm_asset", "syncedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
