import type { Role } from "@prisma/client"

export const ROLES: Role[] = ["ADMIN", "CLINICIAN", "RECEPTION", "PATIENT"]
export const STAFF_ROLES: Role[] = ["ADMIN", "CLINICIAN", "RECEPTION"]

// Single source of truth for who may do what. Checked server-side on every page and action.
export const PERMISSIONS = {
  "dashboard:view": ["ADMIN", "CLINICIAN", "RECEPTION"],
  "patients:view": ["ADMIN", "CLINICIAN", "RECEPTION"],
  "patients:viewSensitive": ["ADMIN", "CLINICIAN", "RECEPTION"],
  "consent:record": ["ADMIN", "CLINICIAN", "RECEPTION"],
  "audit:view": ["ADMIN"],
  "users:manage": ["ADMIN"],
  "templates:edit": ["ADMIN", "CLINICIAN"],
  "clinical:decide": ["CLINICIAN"],
  "portal:view": ["PATIENT"],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly Role[]).includes(role)
}

export function homePathFor(role: Role): string {
  return role === "PATIENT" ? "/portal" : "/app"
}
