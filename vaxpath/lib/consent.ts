import type { ConsentPurpose } from "@prisma/client"
import type { TenantDb } from "@/lib/tenant-db"

export const CONSENT_POLICY_VERSION = "2026-10-v1"
export const CONSENT_PURPOSES: ConsentPurpose[] = ["DATA_PROCESSING", "SMS_CONTACT", "EMAIL_CONTACT"]

export type ConsentState = Record<ConsentPurpose, { granted: boolean; at: Date | null; policyVersion: string | null }>

/** Latest decision per purpose. No record means not granted (opt-in by default). */
export async function currentConsents(db: TenantDb, patientId: string): Promise<ConsentState> {
  const rows = await db.consent.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } })
  const state = Object.fromEntries(
    CONSENT_PURPOSES.map((p) => [p, { granted: false, at: null, policyVersion: null }]),
  ) as ConsentState
  const seen = new Set<ConsentPurpose>()
  for (const row of rows) {
    if (seen.has(row.purpose)) continue
    seen.add(row.purpose)
    state[row.purpose] = { granted: row.granted, at: row.createdAt, policyVersion: row.policyVersion }
  }
  return state
}

export async function hasConsent(db: TenantDb, patientId: string, purpose: ConsentPurpose) {
  return (await currentConsents(db, patientId))[purpose].granted
}
