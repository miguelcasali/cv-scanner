import { describe, expect, it } from "vitest"
import { can, homePathFor } from "@/lib/rbac"

describe("role permissions", () => {
  it("keeps patients out of staff areas", () => {
    expect(can("PATIENT", "dashboard:view")).toBe(false)
    expect(can("PATIENT", "patients:view")).toBe(false)
    expect(can("PATIENT", "audit:view")).toBe(false)
    expect(can("PATIENT", "portal:view")).toBe(true)
  })

  it("limits the audit log and user management to admins", () => {
    for (const role of ["CLINICIAN", "RECEPTION", "PATIENT"] as const) {
      expect(can(role, "audit:view")).toBe(false)
      expect(can(role, "users:manage")).toBe(false)
    }
    expect(can("ADMIN", "audit:view")).toBe(true)
  })

  it("reserves clinical decisions for clinicians", () => {
    expect(can("CLINICIAN", "clinical:decide")).toBe(true)
    expect(can("ADMIN", "clinical:decide")).toBe(false)
    expect(can("RECEPTION", "clinical:decide")).toBe(false)
    expect(can("RECEPTION", "templates:edit")).toBe(false)
  })

  it("denies when there is no role", () => {
    expect(can(undefined, "dashboard:view")).toBe(false)
  })

  it("sends each role to its home", () => {
    expect(homePathFor("PATIENT")).toBe("/portal")
    expect(homePathFor("RECEPTION")).toBe("/app")
  })
})
