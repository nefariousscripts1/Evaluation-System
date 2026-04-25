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
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
