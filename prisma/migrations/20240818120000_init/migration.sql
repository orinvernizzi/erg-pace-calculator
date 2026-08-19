-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeRole" TEXT NOT NULL DEFAULT 'rower',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "twoKSplitSeconds" DOUBLE PRECISION,
    "club" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "totalMeters" DOUBLE PRECISION NOT NULL,
    "totalWorkSeconds" DOUBLE PRECISION NOT NULL,
    "totalRestSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSplitSeconds" DOUBLE PRECISION NOT NULL,
    "avgWatts" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "dragFactor" DOUBLE PRECISION,
    "planItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSplit" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "meters" DOUBLE PRECISION NOT NULL,
    "workSeconds" DOUBLE PRECISION NOT NULL,
    "restSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "splitSeconds" DOUBLE PRECISION NOT NULL,
    "watts" DOUBLE PRECISION NOT NULL,
    "spm" DOUBLE PRECISION,
    "hr" DOUBLE PRECISION,
    "lengthMeters" DOUBLE PRECISION,
    "forceNewtons" DOUBLE PRECISION,

    CONSTRAINT "WorkoutSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutInsight" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "WorkoutInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'athlete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAthleteLink" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "CoachAthleteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'high-volume',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "athleteId" TEXT,
    "scheduledOn" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "sport" TEXT NOT NULL DEFAULT 'erg',
    "kind" TEXT NOT NULL DEFAULT 'time',
    "meters" DOUBLE PRECISION,
    "seconds" DOUBLE PRECISION,
    "intensity" TEXT NOT NULL DEFAULT 'moderate',
    "notes" TEXT,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Organization_inviteCode_key" ON "Organization"("inviteCode");
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");
CREATE UNIQUE INDEX "CoachAthleteLink_token_key" ON "CoachAthleteLink"("token");
CREATE UNIQUE INDEX "CoachAthleteLink_coachId_athleteId_key" ON "CoachAthleteLink"("coachId", "athleteId");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutSplit" ADD CONSTRAINT "WorkoutSplit_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutInsight" ADD CONSTRAINT "WorkoutInsight_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAthleteLink" ADD CONSTRAINT "CoachAthleteLink_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAthleteLink" ADD CONSTRAINT "CoachAthleteLink_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
