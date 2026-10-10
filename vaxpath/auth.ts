import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "@/auth.config"
import { prisma } from "@/lib/db"
import { audit } from "@/lib/audit"

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
})

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  // Compare against a dummy hash when the user does not exist, to keep timing uniform.
  const hash = user?.passwordHash ?? "$2b$12$vUWjjJpanTmh9q3MWORRoOGrTEkmgtikp6DmZSMlHufGIGjycI0ZW"
  const ok = await bcrypt.compare(password, hash)
  if (!user || !ok || !user.active) {
    await audit({ practiceId: user?.practiceId, actorId: user?.id, action: "auth.login_failed" })
    return null
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await audit({ practiceId: user.practiceId, actorId: user.id, actorRole: user.role, action: "auth.login" })
  return user
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const user = await verifyCredentials(parsed.data.email, parsed.data.password)
        if (!user) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, practiceId: user.practiceId }
      },
    }),
  ],
})
