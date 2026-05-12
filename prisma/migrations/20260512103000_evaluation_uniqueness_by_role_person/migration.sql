DROP INDEX `Evaluation_evaluatorId_evaluatedId_academicYear_semester_key` ON `Evaluation`;

ALTER TABLE `Evaluation`
  ADD COLUMN `evaluatorRole` ENUM('student', 'faculty', 'chairperson', 'dean', 'director', 'campus_director', 'secretary') NOT NULL DEFAULT 'student',
  ADD COLUMN `evaluatorName` VARCHAR(191) NULL,
  ADD COLUMN `evaluatedName` VARCHAR(191) NULL,
  ADD COLUMN `evaluatedRole` ENUM('student', 'faculty', 'chairperson', 'dean', 'director', 'campus_director', 'secretary') NOT NULL DEFAULT 'faculty';

UPDATE `Evaluation` e
INNER JOIN `User` evaluator ON evaluator.`id` = e.`evaluatorId`
INNER JOIN `User` evaluated ON evaluated.`id` = e.`evaluatedId`
SET
  e.`evaluatorRole` = evaluator.`role`,
  e.`evaluatorName` = COALESCE(evaluator.`name`, evaluator.`email`),
  e.`evaluatedName` = COALESCE(evaluated.`name`, evaluated.`email`),
  e.`evaluatedRole` = evaluated.`role`;

CREATE UNIQUE INDEX `eval_once_role_person_period`
ON `Evaluation`(`evaluatorRole`, `evaluatorId`, `evaluatedId`, `academicYear`, `semester`);
