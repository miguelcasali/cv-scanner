import type { Patient, Role } from "@prisma/client"
import { audit } from "@/lib/audit"
import { decryptOptional, encryptOptional } from "@/lib/crypto"
import type { TenantDb } from "@/lib/tenant-db"

export type PatientInput = {
  firstName: string
  lastName: string
  dateOfBirth: Date
  phone?: string | null
  email?: string | null
  address?: string | null
  gmsNumber?: string | null
  notes?: string | null
}

export function encryptPatientFields(input: PatientInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    phoneEnc: encryptOptional(input.phone),
    emailEnc: encryptOptional(input.email),
    addressEnc: encryptOptional(input.address),
    gmsNumberEnc: encryptOptional(input.gmsNumber),
    notesEnc: encryptOptional(input.notes),
  }
}

export function decryptPatient(p: Patient) {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    phone: decryptOptional(p.phoneEnc),
    email: decryptOptional(p.emailEnc),
    address: decryptOptional(p.addressEnc),
    gmsNumber: decryptOptional(p.gmsNumberEnc),
    notes: decryptOptional(p.notesEnc),
    erasedAt: p.erasedAt,
  }
}

type Actor = { id: string; role: Role; practiceId: string }

/** Reads a patient's decrypted record and leaves an audit trail of who looked at it. */
export async function viewPatientSensitive(db: TenantDb, actor: Actor, patientId: string) {
  const patient = await db.patient.findUnique({ where: { id: patientId } })
  if (!patient) return null
  await audit({
    practiceId: actor.practiceId,
    actorId: actor.id,
    actorRole: actor.role,
    action: "patient.view_sensitive",
    entityType: "Patient",
    entityId: patientId,
  })
  return decryptPatient(patient)
}

/** GDPR right to erasure: wipes personal fields, keeps a tombstone row for referential integrity. */
export async function erasePatient(db: TenantDb, actor: Actor, patientId: string) {
  await db.patient.update({
    where: { id: patientId },
    data: {
      firstName: "ERASED",
      lastName: "ERASED",
      dateOfBirth: new Date("1900-01-01"),
      phoneEnc: null,
      emailEnc: null,
      addressEnc: null,
      gmsNumberEnc: null,
      notesEnc: null,
      erasedAt: new Date(),
    },
  })
  await audit({
    practiceId: actor.practiceId,
    actorId: actor.id,
    actorRole: actor.role,
    action: "patient.erase",
    entityType: "Patient",
    entityId: patientId,
  })
}
