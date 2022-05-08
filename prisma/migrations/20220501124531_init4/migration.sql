/*
  Warnings:

  - You are about to alter the column `lm_asset` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lm_asset" INTEGER NOT NULL,
    "syncedAt" DATETIME NOT NULL
);
INSERT INTO "new_Account" ("id", "lm_asset", "syncedAt") SELECT "id", "lm_asset", "syncedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
