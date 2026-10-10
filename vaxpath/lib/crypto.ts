import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

// Field-level encryption for sensitive columns (`*Enc`). Format: v1:<iv>:<tag>:<ciphertext>, all base64.
const VERSION = "v1"

function key(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set")
  const buf = Buffer.from(raw, "base64")
  if (buf.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes, base64-encoded")
  return buf
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":")
}

export function decrypt(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(":")
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) throw new Error("Invalid encrypted payload")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8")
}

export function encryptOptional(value: string | null | undefined): string | null {
  return value ? encrypt(value) : null
}

export function decryptOptional(value: string | null | undefined): string | null {
  return value ? decrypt(value) : null
}
