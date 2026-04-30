DROP INDEX `Evaluation_evaluatorId_evaluatedId_scheduleId_key` ON `Evaluation`;

CREATE UNIQUE INDEX `Evaluation_evaluatorId_evaluatedId_academicYear_semester_key`
ON `Evaluation`(`evaluatorId`, `evaluatedId`, `academicYear`, `semester`);
