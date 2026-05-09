import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import { ensureAuthEnvironment, getAuthSecret } from "@/lib/auth-config";
import { hashPassword, verifyPassword } from "@/lib/password-auth";
import { staffLoginSchema } from "@/lib/validation";

ensureAuthEnvironment();

function isAuthDebugEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.AUTH_DEBUG === "true" ||
    process.env.NEXTAUTH_DEBUG === "true"
  );
}

function logAuthDebug(event: string, details?: Record<string, unknown>) {
  if (!isAuthDebugEnabled()) {
    return;
  }

  console.info("[auth]", event, details ?? {});
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        try {
          logAuthDebug("authorize:start", {
            hasCredentials: Boolean(credentials),
            email: typeof credentials?.email === "string" ? credentials.email : null,
            role: typeof credentials?.role === "string" ? credentials.role : null,
          });

          const parsedCredentials = staffLoginSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            logAuthDebug("authorize:validation_failed", {
              issues: parsedCredentials.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            });
            return null;
          }

          const { email, password, role } = parsedCredentials.data;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            logAuthDebug("authorize:user_not_found", { email, role });
            return null;
          }

          if (user.deletedAt) {
            logAuthDebug("authorize:user_deleted", {
              email,
              role,
              userId: user.id,
              deletedAt: user.deletedAt.toISOString(),
            });
            return null;
          }

          if (user.role !== role) {
            logAuthDebug("authorize:role_mismatch", {
              email,
              selectedRole: role,
              actualRole: user.role,
              userId: user.id,
            });
            return null;
          }

          const passwordResult = await verifyPassword(password, user.password);

          if (!passwordResult.isValid) {
            logAuthDebug("authorize:password_invalid", {
              email,
              role,
              userId: user.id,
            });
            return null;
          }

          if (passwordResult.shouldRehash) {
            logAuthDebug("authorize:rehash_password", {
              email,
              role,
              userId: user.id,
            });
            await prisma.user.update({
              where: { id: user.id },
              data: {
                password: await hashPassword(password),
              },
            });
          }

          logAuthDebug("authorize:success", {
            email,
            role,
            userId: user.id,
            mustChangePassword: user.mustChangePassword,
          });

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          console.error("NextAuth authorize failed", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        logAuthDebug("jwt:user_loaded", {
          userId: user.id,
          email: user.email,
          role: user.role,
        });
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
        logAuthDebug("session:missing_token_fields", {
          hasId: Boolean(token.id),
          hasEmail: Boolean(token.email),
          hasRole: Boolean(token.role),
          hasSessionUser: Boolean(session.user),
        });
        return session;
      }

      session.user.id = String(token.id);
      session.user.email = String(token.email);
      session.user.name = typeof token.name === "string" ? token.name : null;
      session.user.role = String(token.role);
      session.user.mustChangePassword = token.mustChangePassword === true;

       logAuthDebug("session:resolved", {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        mustChangePassword: session.user.mustChangePassword,
      });

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
  secret: getAuthSecret(),
  useSecureCookies: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
};
