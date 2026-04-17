-- AlterTable
ALTER TABLE `Schedule`
    ADD COLUMN `accessCode` VARCHAR(32) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Evaluation`
    ADD COLUMN `scheduleId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Evaluation_evaluatorId_fkey` ON `Evaluation`(`evaluatorId`);

-- DropIndex
DROP INDEX `Schedule_academicYear_key` ON `Schedule`;

-- DropIndex
DROP INDEX `Evaluation_evaluatorId_evaluatedId_academicYear_key` ON `Evaluation`;

-- CreateIndex
CREATE INDEX `Schedule_isOpen_startDate_endDate_idx` ON `Schedule`(`isOpen`, `startDate`, `endDate`);

-- CreateIndex
CREATE INDEX `Schedule_academicYear_createdAt_idx` ON `Schedule`(`academicYear`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Evaluation_evaluatorId_evaluatedId_scheduleId_key` ON `Evaluation`(`evaluatorId`, `evaluatedId`, `scheduleId`);

-- AddForeignKey
ALTER TABLE `Evaluation`
    ADD CONSTRAINT `Evaluation_scheduleId_fkey`
    FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
