import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/framework/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  providers: [
    // Keep your credentials provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        })

        if (user?.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials?.password || "",
            user.password
          );

          if (isPasswordValid) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name || "",
            };
          }
        }

        // If password is null or invalid, return null
        return null;
      },
    }),

    // Add Google provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  debug: true,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        });

        if (existingUser && !existingUser.accounts.some(a => a.provider === "google")) {
          return `/auth/error/ExistingUser`;
        }
      }
      return true;
    },
  }
}
