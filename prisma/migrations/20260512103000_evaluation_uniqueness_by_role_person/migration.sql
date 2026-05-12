DROP INDEX `Evaluation_evaluatorId_evaluatedId_academicYear_semester_key` ON `Evaluation`;

ALTER TABLE `Evaluation`
  ADD COLUMN `evaluatorRole` ENUM('student', 'faculty', 'chairperson', 'dean', 'director', 'campus_director', 'secretary') NOT NULL DEFAULT 'student',
  ADD COLUMN `evaluatorName` VARCHAR(191) NULL,
  ADD COLUMN `evaluatedName` VARCHAR(191) NULL,
  ADD COLUMN `evaluatedRole` ENUM('student', 'faculty', 'chairperson', 'dean', 'director', 'campus_director', 'secretary') NOT NULL DEFAULT 'faculty';

UPDATE `Evaluation` e
INNER JOIN `Schedule` s ON s.`academicYear` = e.`academicYear` AND s.`semester` = e.`semester`
SET e.`scheduleId` = s.`id`
WHERE e.`scheduleId` IS NULL;

ALTER TABLE `Evaluation`
  MODIFY COLUMN `scheduleId` INT NOT NULL;

UPDATE `Evaluation` e
INNER JOIN `User` evaluator ON evaluator.`id` = e.`evaluatorId`
INNER JOIN `User` evaluated ON evaluated.`id` = e.`evaluatedId`
SET
  e.`evaluatorRole` = evaluator.`role`,
  e.`evaluatorName` = COALESCE(evaluator.`name`, evaluator.`email`),
  e.`evaluatedName` = COALESCE(evaluated.`name`, evaluated.`email`),
  e.`evaluatedRole` = evaluated.`role`
WHERE
  e.`evaluatorName` IS NULL
  OR e.`evaluatedName` IS NULL
  OR e.`evaluatorRole` = 'student'
  OR e.`evaluatedRole` = 'faculty';

CREATE UNIQUE INDEX `eval_once_role_person_sem`
ON `Evaluation`(`evaluatorRole`, `evaluatorId`, `evaluatedId`, `scheduleId`);
