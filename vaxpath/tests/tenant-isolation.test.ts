import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db"
import { CONSENT_POLICY_VERSION, currentConsents } from "@/lib/consent"
import { encryptPatientFields, erasePatient, viewPatientSensitive } from "@/lib/patients"
import { tenantDb } from "@/lib/tenant-db"

// Integration tests against TEST_DATABASE_URL. Each run creates its own practices.
const run = randomUUID().slice(0, 8)
let practiceA: string
let practiceB: string
let patientA: string
let patientB: string
let actorA: { id: string; role: "ADMIN"; practiceId: string }

beforeAll(async () => {
  const a = await prisma.practice.create({ data: { slug: `test-a-${run}`, name: "Test A", isDemo: true } })
  const b = await prisma.practice.create({ data: { slug: `test-b-${run}`, name: "Test B", isDemo: true } })
  practiceA = a.id
  practiceB = b.id
  const fields = { firstName: "Test", lastName: "Fictional", dateOfBirth: new Date("1980-01-01"), phone: "+353 87 000 9999" }
  patientA = (await tenantDb(practiceA).patient.create({ data: { ...encryptPatientFields(fields), practiceId: practiceA } })).id
  patientB = (await tenantDb(practiceB).patient.create({ data: { ...encryptPatientFields(fields), practiceId: practiceB } })).id
  const user = await prisma.user.create({
    data: { email: `admin-${run}@example.com`, name: "Test Admin", role: "ADMIN", practiceId: practiceA, passwordHash: "x" },
  })
  actorA = { id: user.id, role: "ADMIN", practiceId: practiceA }
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe("tenant isolation", () => {
  it("lists only the current practice's rows", async () => {
    const rows = await tenantDb(practiceA).patient.findMany()
    expect(rows.map((r) => r.id)).toContain(patientA)
    expect(rows.every((r) => r.practiceId === practiceA)).toBe(true)
  })

  it("cannot read another practice's row by id", async () => {
    expect(await tenantDb(practiceA).patient.findUnique({ where: { id: patientB } })).toBeNull()
    expect(await tenantDb(practiceA).patient.findFirst({ where: { id: patientB } })).toBeNull()
  })

  it("cannot update or delete another practice's row", async () => {
    await expect(tenantDb(practiceA).patient.update({ where: { id: patientB }, data: { firstName: "Hacked" } })).rejects.toThrow()
    const res = await tenantDb(practiceA).patient.updateMany({ where: { id: patientB }, data: { firstName: "Hacked" } })
    expect(res.count).toBe(0)
    await expect(tenantDb(practiceA).patient.delete({ where: { id: patientB } })).rejects.toThrow()
    const still = await prisma.patient.findUniqueOrThrow({ where: { id: patientB } })
    expect(still.firstName).toBe("Test")
  })

  it("stamps the tenant on create even if the caller passes another practice", async () => {
    const created = await tenantDb(practiceA).patient.create({
      data: { ...encryptPatientFields({ firstName: "X", lastName: "Y", dateOfBirth: new Date("2000-01-01") }), practiceId: practiceB },
    })
    expect(created.practiceId).toBe(practiceA)
  })

  it("stores contact fields encrypted at rest", async () => {
    const raw = await prisma.patient.findUniqueOrThrow({ where: { id: patientA } })
    expect(raw.phoneEnc).not.toContain("9999")
    const viewed = await viewPatientSensitive(tenantDb(practiceA), actorA, patientA)
    expect(viewed?.phone).toBe("+353 87 000 9999")
  })

  it("audits every sensitive read", async () => {
    await viewPatientSensitive(tenantDb(practiceA), actorA, patientA)
    const log = await prisma.auditLog.findFirst({
      where: { practiceId: practiceA, action: "patient.view_sensitive", entityId: patientA },
    })
    expect(log?.actorId).toBe(actorA.id)
  })
})

describe("append-only records", () => {
  it("blocks updates and deletes on the audit log", async () => {
    const log = await prisma.auditLog.create({ data: { practiceId: practiceA, action: "test.event" } })
    await expect(prisma.auditLog.update({ where: { id: log.id }, data: { action: "tampered" } })).rejects.toThrow(/append-only/)
    await expect(prisma.auditLog.delete({ where: { id: log.id } })).rejects.toThrow(/append-only/)
  })

  it("keeps consent history and reports the latest decision", async () => {
    const db = tenantDb(practiceA)
    const base = { practiceId: practiceA, patientId: patientA, purpose: "SMS_CONTACT" as const, policyVersion: CONSENT_POLICY_VERSION }
    const first = await db.consent.create({ data: { ...base, granted: true } })
    await new Promise((r) => setTimeout(r, 5))
    await db.consent.create({ data: { ...base, granted: false } })
    const state = await currentConsents(db, patientA)
    expect(state.SMS_CONTACT.granted).toBe(false)
    expect(state.EMAIL_CONTACT.granted).toBe(false)
    await expect(prisma.consent.update({ where: { id: first.id }, data: { granted: false } })).rejects.toThrow(/append-only/)
  })
})

describe("right to erasure", () => {
  it("wipes personal fields and keeps a tombstone", async () => {
    const db = tenantDb(practiceA)
    const p = await db.patient.create({
      data: { ...encryptPatientFields({ firstName: "Erase", lastName: "Me", dateOfBirth: new Date("1990-01-01"), phone: "1" }), practiceId: practiceA },
    })
    await erasePatient(db, actorA, p.id)
    const after = await prisma.patient.findUniqueOrThrow({ where: { id: p.id } })
    expect(after.firstName).toBe("ERASED")
    expect(after.phoneEnc).toBeNull()
    expect(after.erasedAt).not.toBeNull()
  })
})
