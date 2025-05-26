-- CreateEnum
CREATE TYPE "StatType" AS ENUM ('WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR');

-- CreateEnum
CREATE TYPE "StrokeType" AS ENUM ('FOREHAND', 'BACKHAND', 'SMASH', 'VOLEIO_DIREITA', 'VOLEIO_ESQUERDA', 'BANDEJA', 'VIBORA', 'SAQUE', 'RESTA', 'GLOBO', 'OUTRO');

-- CreateEnum
CREATE TYPE "PointOutcome" AS ENUM ('GANHO', 'PERDIDO');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSessionStudent" (
    "gameSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "GameSessionStudent_pkey" PRIMARY KEY ("gameSessionId","studentId")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stat_type" "StatType" NOT NULL,
    "stroke_type" "StrokeType" NOT NULL,
    "point_outcome" "PointOutcome" NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionStudent" ADD CONSTRAINT "GameSessionStudent_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionStudent" ADD CONSTRAINT "GameSessionStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
