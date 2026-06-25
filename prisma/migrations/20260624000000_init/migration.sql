-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'TRIAL_EXPIRED', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "accessTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "quizData" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bmiCategory" TEXT NOT NULL,
    "dailyCalories" INTEGER NOT NULL,
    "proteinGrams" INTEGER NOT NULL,
    "carbGrams" INTEGER NOT NULL,
    "fatGrams" INTEGER NOT NULL,
    "weeklyWeightLossForecast" DOUBLE PRECISION NOT NULL,
    "weeksToGoal" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "weeklyProjection" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "HealthResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "plan" TEXT,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_accessTokenHash_key" ON "Session"("accessTokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "HealthResult_sessionId_key" ON "HealthResult"("sessionId");
CREATE INDEX "HealthResult_sessionId_idx" ON "HealthResult"("sessionId");
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_trialEndsAt_idx" ON "Subscription"("trialEndsAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HealthResult" ADD CONSTRAINT "HealthResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
