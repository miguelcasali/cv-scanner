import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { encryptOptional } from "../lib/crypto"
import { CONSENT_POLICY_VERSION } from "../lib/consent"
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_PRACTICES } from "./demo-accounts"

// Demo seed. Every person here is fictitious: names carry "Demo"/"Fictional"/"Sample" markers,
// emails use example.com, phone numbers use the unallocated 000 range, GMS numbers start with DEMO-.
const prisma = new PrismaClient()

const DEMO_PATIENTS: Record<string, { firstName: string; lastName: string; dob: string; sms: boolean }[]> = {
  "valentia-demo": [
    { firstName: "Pádraig", lastName: "Sample-Patient", dob: "1980-04-12", sms: true },
    { firstName: "Máire", lastName: "Fictional", dob: "1948-09-30", sms: true },
    { firstName: "Seán", lastName: "Example", dob: "1955-01-17", sms: false },
    { firstName: "Niamh", lastName: "Testperson", dob: "1992-06-05", sms: true },
    { firstName: "Cormac", lastName: "Placeholder", dob: "2019-11-22", sms: true },
    { firstName: "Siobhán", lastName: "Demo-Doe", dob: "1961-03-08", sms: true },
    { firstName: "Liam", lastName: "Notreal", dob: "1939-12-01", sms: false },
    { firstName: "Orla", lastName: "Mock", dob: "2001-07-19", sms: true },
  ],
  "demo-practice-b": [
    { firstName: "Ultan", lastName: "OtherPractice-Demo", dob: "1970-02-02", sms: true },
    { firstName: "Gráinne", lastName: "OtherPractice-Sample", dob: "1985-05-25", sms: false },
  ],
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Refusing to seed demo data in production (set ALLOW_DEMO_SEED=true to override)")
  }
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  for (const p of DEMO_PRACTICES) {
    const practice = await prisma.practice.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, name: p.name, county: p.county, isDemo: true },
    })

    if ((await prisma.patient.count({ where: { practiceId: practice.id } })) === 0) {
      for (const [i, dp] of DEMO_PATIENTS[p.slug].entries()) {
        const n = String(i + 1).padStart(4, "0")
        const patient = await prisma.patient.create({
          data: {
            practiceId: practice.id,
            firstName: dp.firstName,
            lastName: dp.lastName,
            dateOfBirth: new Date(dp.dob),
            phoneEnc: encryptOptional(`+353 87 000 ${n}`),
            emailEnc: encryptOptional(`${dp.firstName.normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase()}.${n}@example.com`),
            addressEnc: encryptOptional(`${i + 1} Fictional Road, Demo Town, Co. ${p.county}`),
            gmsNumberEnc: i % 2 === 0 ? encryptOptional(`DEMO-${n}`) : null,
            notesEnc: encryptOptional("Fictitious demo patient — not a real person."),
          },
        })
        await prisma.consent.createMany({
          data: [
            { practiceId: practice.id, patientId: patient.id, purpose: "DATA_PROCESSING", granted: true, policyVersion: CONSENT_POLICY_VERSION },
            { practiceId: practice.id, patientId: patient.id, purpose: "SMS_CONTACT", granted: dp.sms, policyVersion: CONSENT_POLICY_VERSION },
          ],
        })
      }
    }
  }

  for (const a of DEMO_ACCOUNTS) {
    const practice = await prisma.practice.findUniqueOrThrow({ where: { slug: a.practiceSlug } })
    const patientId =
      a.role === "PATIENT"
        ? (await prisma.patient.findFirstOrThrow({ where: { practiceId: practice.id, lastName: "Sample-Patient" } })).id
        : null
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { email: a.email, name: a.name, role: a.role, practiceId: practice.id, passwordHash, patientId },
    })
  }

  console.log(`Seeded ${DEMO_PRACTICES.length} demo practices and ${DEMO_ACCOUNTS.length} demo accounts (password: ${DEMO_PASSWORD}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
