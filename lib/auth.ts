import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
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

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
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
          },
        };
      }

      token.id = String(currentUser.id);
      token.email = currentUser.email;
      token.role = currentUser.role;

      session.user.id = String(currentUser.id);
      session.user.email = currentUser.email;
      session.user.name = currentUser.name;
      session.user.role = currentUser.role;

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
