import { randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/db"

// next-auth pulls in Next.js runtime modules; only verifyCredentials is under test here.
vi.mock("next-auth", () => ({ default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }) }))
vi.mock("next-auth/providers/credentials", () => ({ default: (c: unknown) => c }))

const { verifyCredentials } = await import("@/auth")

const run = randomUUID().slice(0, 8)
const email = `reception-${run}@example.com`
let practiceId: string

beforeAll(async () => {
  practiceId = (await prisma.practice.create({ data: { slug: `auth-${run}`, name: "Auth Test", isDemo: true } })).id
  await prisma.user.create({
    data: { email, name: "Test Reception", role: "RECEPTION", practiceId, passwordHash: await bcrypt.hash("correct-horse", 4) },
  })
  await prisma.user.create({
    data: { email: `inactive-${run}@example.com`, name: "Inactive", role: "CLINICIAN", practiceId, active: false, passwordHash: await bcrypt.hash("correct-horse", 4) },
  })
})

afterAll(() => prisma.$disconnect())

describe("credential login", () => {
  it("accepts the right password (case-insensitive email) and audits the login", async () => {
    const user = await verifyCredentials(email.toUpperCase(), "correct-horse")
    expect(user?.role).toBe("RECEPTION")
    const log = await prisma.auditLog.findFirst({ where: { actorId: user!.id, action: "auth.login" } })
    expect(log).not.toBeNull()
  })

  it("rejects a wrong password and audits the failure", async () => {
    expect(await verifyCredentials(email, "wrong")).toBeNull()
    const log = await prisma.auditLog.findFirst({ where: { practiceId, action: "auth.login_failed" } })
    expect(log).not.toBeNull()
  })

  it("rejects unknown and deactivated users", async () => {
    expect(await verifyCredentials(`nobody-${run}@example.com`, "correct-horse")).toBeNull()
    expect(await verifyCredentials(`inactive-${run}@example.com`, "correct-horse")).toBeNull()
  })
})
