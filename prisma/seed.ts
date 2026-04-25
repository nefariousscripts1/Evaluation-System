import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { OFFICIAL_QUESTIONNAIRE } from "../lib/questionnaire";

const prisma = new PrismaClient();

async function main() {
  // Create secretary account
  const secretaryEmail = "secretary@bisu.edu.ph";
  const existingSecretary = await prisma.user.findUnique({
    where: { email: secretaryEmail },
  });
  if (!existingSecretary) {
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: secretaryEmail,
        password: hashed,
        name: "Secretary Admin",
        role: "secretary",
      },
    });
    console.log("Secretary account created");
  }

  const officialQuestions = OFFICIAL_QUESTIONNAIRE.flatMap((section) =>
    section.questions.map((questionText) => ({
      questionText,
      category: section.category,
    }))
  );

  await prisma.questionnaire.updateMany({
    data: { isActive: false },
  });

  for (const question of officialQuestions) {
    const existing = await prisma.questionnaire.findFirst({
      where: { questionText: question.questionText },
    });

    if (existing) {
      await prisma.questionnaire.update({
        where: { id: existing.id },
        data: {
          category: question.category,
          isActive: true,
        },
      });
      continue;
    }

    await prisma.questionnaire.create({
      data: {
        questionText: question.questionText,
        category: question.category,
        isActive: true,
      },
    });
  }

  console.log("Official questionnaire synced");

  // Create sample faculty
  const facultyEmail = "faculty@university.edu";
  const existingFaculty = await prisma.user.findUnique({
    where: { email: facultyEmail },
  });
  if (!existingFaculty) {
    const hashed = await bcrypt.hash("faculty123", 10);
    await prisma.user.create({
      data: {
        email: facultyEmail,
        password: hashed,
        name: "Sample Faculty",
        role: "faculty",
        department: "Computer Science",
      },
    });
    console.log("Sample faculty account created");
  }

  // Create a sample student
  const studentEmail = "student@university.edu";
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });
  if (!existingStudent) {
    const hashed = await bcrypt.hash("student123", 10);
    await prisma.user.create({
      data: {
        email: studentEmail,
        password: hashed,
        name: "Sample Student",
        role: "student",
        studentId: "2024-0001",
      },
    });
    console.log("Sample student account created");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
