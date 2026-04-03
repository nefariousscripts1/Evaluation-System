/*
  Warnings:

  - You are about to drop the `questionnaires` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `evaluationanswer` DROP FOREIGN KEY `EvaluationAnswer_questionId_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `agreedToTerms` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `studentId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `questionnaires`;

-- CreateTable
CREATE TABLE `Questionnaire` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionText` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_studentId_key` ON `User`(`studentId`);

-- AddForeignKey
ALTER TABLE `EvaluationAnswer` ADD CONSTRAINT `EvaluationAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Questionnaire`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
