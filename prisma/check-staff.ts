import { PrismaClient } from "@prisma/client";
import { getDatabaseUrlDiagnostics } from "../lib/database-health";

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || "secretary@bisu.edu.ph").trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      deletedAt: true,
      mustChangePassword: true,
      password: true,
    },
  });

  if (!user) {
    console.log(
      JSON.stringify(
        {
          found: false,
          email,
          message: "No staff account found for this email",
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        found: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          deletedAt: user.deletedAt,
          mustChangePassword: user.mustChangePassword,
          passwordIsBcrypt: /^\$2[abxy]\$/.test(user.password),
          passwordLength: user.password.length,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[check:staff] failed", {
      message: error instanceof Error ? error.message : "Unknown check error",
      database: getDatabaseUrlDiagnostics(),
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
