import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        if (user.email_verified === false) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],

  // ⭐️ EMRI I SAKTË
  callbacks: {
    async jwt({ token, user }) {
      // Merr gjithmonë user-in nga databaza (EMAIL nga token)
      const dbUser = await prisma.users.findUnique({
        where: { email: token.email },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.name = dbUser.name;
        token.allowed_tabs = dbUser.allowed_tabs || [];
        token.phone = dbUser.phone;
        token.address = dbUser.address;
        token.email_verified = dbUser.email_verified ?? false;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name;

      session.user.phone = token.phone;
      session.user.address = token.address;
      session.user.allowed_tabs = token.allowed_tabs || [];
      session.user.email_verified = token.email_verified ?? false;
      return session;
    },

    async signIn({ user, account }) {
      if (account.provider === "google") {
        const existing = await prisma.users.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          await prisma.users.create({
            data: {
              email: user.email,
              name: user.name,
              password: "",
              role: "client",
              email_verified: true,
            },
          });
        } else if (!existing.email_verified) {
          await prisma.users.update({
            where: { id: existing.id },
            data: { email_verified: true },
          });
        }
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
