import { z } from "zod"

// EU/EEA region prefixes accepted for DATA_REGION (cloud provider region names).
const EU_REGION = /^(eu-|europe-|westeurope|northeurope|francecentral|germanywestcentral|swedencentral|local-eu)/

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  FIELD_ENCRYPTION_KEY: z.string().min(1),
  DATA_REGION: z.string().regex(EU_REGION, "DATA_REGION must be an EU/EEA region (GDPR data residency)"),
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith("sk_test_"), "Only Stripe TEST keys (sk_test_...) are allowed"),
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

export function parseEnv(source: Record<string, string | undefined>): Env {
  return schema.parse(source)
}

export function env(): Env {
  if (!cached) cached = parseEnv(process.env)
  return cached
}

export function isEuRegion(region: string) {
  return EU_REGION.test(region)
}
