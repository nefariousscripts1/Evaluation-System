import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      mustChangePassword: boolean;
    };
  }

  interface User {
    role: string;
    mustChangePassword?: boolean;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    name?: string | null;
    mustChangePassword?: boolean;
  }
}
