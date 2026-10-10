import { describe, expect, it } from "vitest"
import { assertSafeMetadata } from "@/lib/audit"
import { isEuRegion, parseEnv } from "@/lib/env"

describe("GDPR guards", () => {
  it("accepts only EU/EEA data regions", () => {
    expect(isEuRegion("eu-west-1")).toBe(true)
    expect(isEuRegion("europe-west1")).toBe(true)
    expect(isEuRegion("northeurope")).toBe(true)
    expect(isEuRegion("us-east-1")).toBe(false)
    expect(isEuRegion("ap-southeast-2")).toBe(false)
  })

  it("rejects audit metadata that looks like personal data", () => {
    expect(() => assertSafeMetadata({ patientId: "x", purpose: "SMS_CONTACT" })).not.toThrow()
    expect(() => assertSafeMetadata({ phone: "+353" })).toThrow()
    expect(() => assertSafeMetadata({ changes: { dateOfBirth: "1980" } })).toThrow()
  })

  it("refuses a live Stripe key or a non-EU region at startup", () => {
    const base = { DATABASE_URL: "postgresql://x", AUTH_SECRET: "0123456789abcdef", FIELD_ENCRYPTION_KEY: "k", DATA_REGION: "eu-west-1" }
    expect(() => parseEnv({ ...base, STRIPE_SECRET_KEY: "sk_test_123" })).not.toThrow()
    expect(() => parseEnv({ ...base, STRIPE_SECRET_KEY: "sk_live_123" })).toThrow(/TEST/)
    expect(() => parseEnv({ ...base, DATA_REGION: "us-east-1" })).toThrow(/EU/)
  })
})
