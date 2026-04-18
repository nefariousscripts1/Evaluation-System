-- AlterTable
ALTER TABLE `Evaluation`
    ADD COLUMN `semester` VARCHAR(191) NOT NULL DEFAULT '1st Semester';

-- AlterTable
ALTER TABLE `Schedule`
    ADD COLUMN `semester` VARCHAR(191) NOT NULL DEFAULT '1st Semester';

-- CreateTable
CREATE TABLE `InstructorAccessCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheduleId` INTEGER NOT NULL,
    `instructorId` INTEGER NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InstructorAccessCode_scheduleId_instructorId_key`(`scheduleId`, `instructorId`),
    UNIQUE INDEX `InstructorAccessCode_scheduleId_code_key`(`scheduleId`, `code`),
    INDEX `InstructorAccessCode_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InstructorAccessCode`
    ADD CONSTRAINT `InstructorAccessCode_scheduleId_fkey`
    FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructorAccessCode`
    ADD CONSTRAINT `InstructorAccessCode_instructorId_fkey`
    FOREIGN KEY (`instructorId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
