/*
  Warnings:

  - You are about to alter the column `department` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `schedule` ADD COLUMN `isOpen` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` MODIFY `department` VARCHAR(191) NULL;
