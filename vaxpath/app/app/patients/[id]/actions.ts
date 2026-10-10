"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { audit } from "@/lib/audit"
import { CONSENT_POLICY_VERSION } from "@/lib/consent"
import { requireUser } from "@/lib/session"

const schema = z.object({
  patientId: z.string().uuid(),
  purpose: z.enum(["DATA_PROCESSING", "SMS_CONTACT", "EMAIL_CONTACT"]),
  granted: z.enum(["true", "false"]).transform((v) => v === "true"),
})

export async function recordConsentAction(formData: FormData) {
  const { user, db } = await requireUser("consent:record")
  const input = schema.parse(Object.fromEntries(formData))
  // Tenant-scoped lookup: a patient id from another practice is simply not found.
  const patient = await db.patient.findUnique({ where: { id: input.patientId }, select: { id: true, erasedAt: true } })
  if (!patient || patient.erasedAt) throw new Error("Patient not found")
  const consent = await db.consent.create({
    data: {
      practiceId: user.practiceId,
      patientId: patient.id,
      purpose: input.purpose,
      granted: input.granted,
      policyVersion: CONSENT_POLICY_VERSION,
      recordedById: user.id,
    },
  })
  await audit({
    practiceId: user.practiceId,
    actorId: user.id,
    actorRole: user.role,
    action: input.granted ? "consent.grant" : "consent.withdraw",
    entityType: "Consent",
    entityId: consent.id,
    metadata: { patientId: patient.id, purpose: input.purpose },
  })
  revalidatePath(`/app/patients/${patient.id}`)
}
