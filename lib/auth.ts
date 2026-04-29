import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password-auth";
import { staffLoginSchema } from "@/lib/validation";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = staffLoginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password, role } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.deletedAt || user.role !== role) {
          return null;
        }

        const passwordResult = await verifyPassword(password, user.password);

        if (!passwordResult.isValid) {
          return null;
        }

        if (passwordResult.shouldRehash) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              password: await hashPassword(password),
            },
          });
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }

      if (trigger === "update") {
        if (typeof session?.name === "string") {
          token.name = session.name;
        }

        if (typeof session?.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.email || !token.role || !session.user) {
        return session;
      }

      const currentUser = await prisma.user.findUnique({
        where: {
          email: String(token.email),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          mustChangePassword: true,
          deletedAt: true,
        },
      });

      if (!currentUser || currentUser.deletedAt) {
        return {
          ...session,
          user: {
            ...session.user,
            id: "",
            email: "",
            name: "",
            role: "",
            mustChangePassword: false,
          },
        };
      }

      token.id = String(currentUser.id);
      token.email = currentUser.email;
      token.name = currentUser.name;
      token.role = currentUser.role;
      token.mustChangePassword = currentUser.mustChangePassword;

      session.user.id = String(currentUser.id);
      session.user.email = currentUser.email;
      session.user.name = currentUser.name;
      session.user.role = currentUser.role;
      session.user.mustChangePassword = currentUser.mustChangePassword;

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
};
