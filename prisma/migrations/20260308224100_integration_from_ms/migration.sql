/*
  Warnings:

  - The primary key for the `WaterSaving` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `calculatedAt` on the `WaterSaving` table. All the data in the column will be lost.
  - You are about to drop the column `savingsPct` on the `WaterSaving` table. All the data in the column will be lost.
  - The `baselineType` column on the `WaterSaving` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `actualUsage` to the `WaterSaving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baselineUsage` to the `WaterSaving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `savings` to the `WaterSaving` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnomalyLog" ALTER COLUMN "confidenceScore" SET DEFAULT 0.0,
ALTER COLUMN "confidenceScore" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WaterSaving" DROP CONSTRAINT "WaterSaving_pkey",
DROP COLUMN "calculatedAt",
DROP COLUMN "savingsPct",
ADD COLUMN     "actualUsage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "baselineUsage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "savings" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "baselineType",
ADD COLUMN     "baselineType" TEXT NOT NULL DEFAULT 'HYBRID',
ADD CONSTRAINT "WaterSaving_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WaterSaving_id_seq";
