import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { getDatabaseUrlDiagnostics } from "../lib/database-health";

const prisma = new PrismaClient();

async function main() {
  const secretaryEmail = "secretary@bisu.edu.ph";
  const existingSecretary = await prisma.user.findUnique({
    where: { email: secretaryEmail },
    select: { id: true, email: true, role: true, deletedAt: true },
  });

  if (existingSecretary) {
    console.log(
      JSON.stringify(
        {
          created: false,
          message: "Default secretary account already exists",
          user: existingSecretary,
        },
        null,
        2
      )
    );
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const secretary = await prisma.user.create({
    data: {
      email: secretaryEmail,
      password: hashedPassword,
      name: "Secretary Admin",
      mustChangePassword: true,
      role: "secretary",
    },
    select: {
      id: true,
      email: true,
      role: true,
      mustChangePassword: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        created: true,
        message: "Default secretary account created",
        user: secretary,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[seed:staff] failed", {
      message: error instanceof Error ? error.message : "Unknown seed error",
      database: getDatabaseUrlDiagnostics(),
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
