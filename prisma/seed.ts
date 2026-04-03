import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

  // Create sample questions
  const questions = [
    { questionText: "The instructor is well-prepared for class.", category: "Teaching" },
    { questionText: "The instructor explains concepts clearly.", category: "Teaching" },
    { questionText: "The instructor is respectful to students.", category: "Behavior" },
    { questionText: "The instructor provides timely feedback.", category: "Performance" },
    { questionText: "The instructor is knowledgeable in the subject matter.", category: "Teaching" },
    { questionText: "The instructor uses effective teaching methods.", category: "Teaching" },
    { questionText: "The instructor is approachable and helpful.", category: "Behavior" },
    { questionText: "The instructor grades fairly and objectively.", category: "Performance" },
  ];

  for (const q of questions) {
    const existing = await prisma.questionnaire.findFirst({
      where: { questionText: q.questionText },
    });
    if (!existing) {
      await prisma.questionnaire.create({
        data: {
          questionText: q.questionText,
          category: q.category,
          isActive: true,
        },
      });
    }
  }
  console.log("Sample questions created");

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