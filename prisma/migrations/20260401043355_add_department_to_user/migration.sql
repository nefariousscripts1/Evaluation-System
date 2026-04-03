/*
  Warnings:

  - You are about to drop the column `departmentId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `department` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_departmentId_fkey`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `departmentId`,
    ADD COLUMN `department` ENUM('CSM', 'CTE') NULL;

-- DropTable
DROP TABLE `department`;
