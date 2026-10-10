import type { NextAuthConfig } from "next-auth"
import type { Role } from "@prisma/client"

// Edge-safe part of the Auth.js config (used by middleware). No Prisma / bcrypt here.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname
      const isProtected = path.startsWith("/app") || path.startsWith("/portal")
      return isProtected ? !!auth?.user : true
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string
        token.role = (user as { role: Role }).role
        token.practiceId = (user as { practiceId: string }).practiceId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.uid as string
      session.user.role = token.role as Role
      session.user.practiceId = token.practiceId as string
      return session
    },
  },
} satisfies NextAuthConfig
