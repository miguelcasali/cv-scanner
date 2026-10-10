import { describe, expect, it } from "vitest"
import { decrypt, decryptOptional, encrypt, encryptOptional } from "@/lib/crypto"

describe("field encryption", () => {
  it("round-trips text, including non-ASCII", () => {
    const value = "Pádraig — +353 87 000 0001"
    expect(decrypt(encrypt(value))).toBe(value)
  })

  it("never stores plaintext and uses a fresh IV each time", () => {
    const a = encrypt("DEMO-0001")
    const b = encrypt("DEMO-0001")
    expect(a).not.toContain("DEMO-0001")
    expect(a).not.toBe(b)
  })

  it("detects tampering", () => {
    const parts = encrypt("secret").split(":")
    parts[3] = Buffer.from("tampered").toString("base64")
    expect(() => decrypt(parts.join(":"))).toThrow()
  })

  it("fails with a different key", () => {
    const payload = encrypt("secret")
    const original = process.env.FIELD_ENCRYPTION_KEY
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64")
    try {
      expect(() => decrypt(payload)).toThrow()
    } finally {
      process.env.FIELD_ENCRYPTION_KEY = original
    }
  })

  it("passes null through the optional helpers", () => {
    expect(encryptOptional(null)).toBeNull()
    expect(decryptOptional(undefined)).toBeNull()
  })
})
