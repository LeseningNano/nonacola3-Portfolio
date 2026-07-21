import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "@/lib/env";

declare module "@auth/core/types" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = ADMIN_USERNAME;
        const pass = ADMIN_PASSWORD;
        // 缺环境变量直接拒绝，避免与空输入做空串相等比较
        if (!user || !pass) return null;
        if (
          typeof credentials?.username !== "string" ||
          typeof credentials?.password !== "string" ||
          credentials.username.length === 0 ||
          credentials.password.length === 0
        ) {
          return null;
        }
        // 长度上限防滥用
        if (credentials.username.length > 64 || credentials.password.length > 256) return null;
        if (credentials.username === user && credentials.password === pass) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      return session;
    },
  },
});
