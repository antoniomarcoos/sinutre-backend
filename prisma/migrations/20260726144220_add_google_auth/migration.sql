-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubId" TEXT,
    "githubLogin" TEXT,
    "googleId" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "birth_date" DATETIME,
    "avatar_url" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'NAO_ESPECIFICADO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("avatar_url", "birth_date", "created_at", "gender", "githubId", "githubLogin", "id", "name") SELECT "avatar_url", "birth_date", "created_at", "gender", "githubId", "githubLogin", "id", "name" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
CREATE UNIQUE INDEX "users_githubLogin_key" ON "users"("githubLogin");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
