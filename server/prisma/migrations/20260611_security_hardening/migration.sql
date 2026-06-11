-- Add sessionToken to User
ALTER TABLE "User" ADD COLUMN "sessionToken" TEXT;
CREATE UNIQUE INDEX "User_sessionToken_key" ON "User"("sessionToken");

-- Replace subDelegateKey (plaintext private key) with burnerAddress (public address only)
ALTER TABLE "TradeIntent" ADD COLUMN "burnerAddress" TEXT;
ALTER TABLE "TradeIntent" DROP COLUMN "subDelegateKey";
