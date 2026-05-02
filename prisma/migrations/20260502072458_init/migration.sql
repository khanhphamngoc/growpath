-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('FIRST_CHECKIN', 'SKILL_LEVEL_UP', 'WEEK_STREAK_7', 'FIRST_ROADMAP_MONTH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "philosophyAcknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyLink" (
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "FamilyLink_pkey" PRIMARY KEY ("parentId","childId")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "userId" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "grade" INTEGER NOT NULL,
    "school" TEXT,
    "avatarUrl" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "dimensions" JSONB NOT NULL,
    "headline" TEXT NOT NULL,
    "childConfirmedAt" TIMESTAMP(3),
    "needsEditorialReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaDelta" (
    "personaId" TEXT NOT NULL,
    "parentView" JSONB NOT NULL,
    "childView" JSONB NOT NULL,
    "deltaNotes" JSONB NOT NULL,
    "possiblyUnderstated" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "PersonaDelta_pkey" PRIMARY KEY ("personaId")
);

-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerCluster" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "clusters" JSONB NOT NULL,
    "selectedCluster" TEXT,

    CONSTRAINT "CareerCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRoadmap" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "roadmap" JSONB NOT NULL,
    "currentWeekFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyCheckin" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "mood" TEXT NOT NULL,
    "activityLog" TEXT NOT NULL,
    "reflection" TEXT NOT NULL,
    "scenarioResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "title" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FamilyLink_childId_idx" ON "FamilyLink"("childId");

-- CreateIndex
CREATE INDEX "Persona_childId_idx" ON "Persona"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_childId_version_key" ON "Persona"("childId", "version");

-- CreateIndex
CREATE INDEX "Dream_childId_idx" ON "Dream"("childId");

-- CreateIndex
CREATE INDEX "CareerCluster_dreamId_idx" ON "CareerCluster"("dreamId");

-- CreateIndex
CREATE INDEX "SkillRoadmap_childId_idx" ON "SkillRoadmap"("childId");

-- CreateIndex
CREATE INDEX "WeeklyCheckin_childId_idx" ON "WeeklyCheckin"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCheckin_childId_weekNumber_key" ON "WeeklyCheckin"("childId", "weekNumber");

-- CreateIndex
CREATE INDEX "Milestone_childId_idx" ON "Milestone"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_childId_type_key" ON "Milestone"("childId", "type");

-- AddForeignKey
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaDelta" ADD CONSTRAINT "PersonaDelta_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerCluster" ADD CONSTRAINT "CareerCluster_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
