-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "lm_asset" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL
);
