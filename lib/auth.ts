import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ensureAuthEnvironment, getAuthSecret } from "@/lib/auth-config";
import { authorizeStaffCredentials } from "@/lib/staff-auth";

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
        logAuthDebug("authorize:start", {
          hasCredentials: Boolean(credentials),
          email: typeof credentials?.email === "string" ? credentials.email : null,
          role: typeof credentials?.role === "string" ? credentials.role : null,
        });

        const result = await authorizeStaffCredentials(credentials);

        if (!result.ok) {
          logAuthDebug(`authorize:${result.reason}`, result.details);

          if (result.reason === "database_unreachable") {
            console.error("NextAuth authorize failed", result.details);
            throw new Error("Server cannot connect to the database.");
          }

          if (result.reason === "server_error") {
            console.error("NextAuth authorize failed", result.details);
            throw new Error("Unable to sign in right now.");
          }

          return null;
        }

        logAuthDebug("authorize:success", {
          email: result.user.email,
          role: result.user.role,
          userId: result.user.id,
          mustChangePassword: result.user.mustChangePassword,
        });

        return result.user;
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
  debug: isAuthDebugEnabled(),
};
