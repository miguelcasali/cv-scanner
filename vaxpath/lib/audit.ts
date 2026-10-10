import type { Prisma, Role } from "@prisma/client"
import { prisma } from "@/lib/db"

export type AuditEvent = {
  practiceId?: string | null
  actorId?: string | null
  actorRole?: Role | null
  action: string
  entityType?: string
  entityId?: string
  // Non-clinical, non-contact context only (ids, counts, field names). Never values of sensitive fields.
  metadata?: Prisma.InputJsonValue
}

const FORBIDDEN_METADATA_KEYS = /phone|email|address|gms|ppsn|note|dob|birth|password/i

export function assertSafeMetadata(metadata: unknown, path = "metadata"): void {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    for (const [k, v] of Object.entries(metadata)) {
      if (FORBIDDEN_METADATA_KEYS.test(k)) throw new Error(`Audit ${path}.${k} looks like personal data`)
      assertSafeMetadata(v, `${path}.${k}`)
    }
  }
}

export async function audit(event: AuditEvent) {
  assertSafeMetadata(event.metadata)
  await prisma.auditLog.create({
    data: {
      practiceId: event.practiceId ?? null,
      actorId: event.actorId ?? null,
      actorRole: event.actorRole ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
    },
  })
}
