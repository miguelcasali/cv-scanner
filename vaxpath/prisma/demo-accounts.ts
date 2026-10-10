import type { Role } from "@prisma/client"

// All demo people are fictitious. Emails use the reserved example.com domain (RFC 2606).
export const DEMO_PASSWORD = "VaxPath-demo-2026"

export const DEMO_PRACTICES = [
  { slug: "valentia-demo", name: "Valentia Medical Centre (DEMO)", county: "Kerry" },
  { slug: "demo-practice-b", name: "Fictional Practice B (DEMO)", county: "Cork" },
] as const

export const DEMO_ACCOUNTS: { email: string; name: string; role: Role; practiceSlug: string }[] = [
  { email: "admin@valentia-demo.example.com", name: "Aoife Demo-Admin", role: "ADMIN", practiceSlug: "valentia-demo" },
  { email: "clinician@valentia-demo.example.com", name: "Dr. Ciarán Fictional", role: "CLINICIAN", practiceSlug: "valentia-demo" },
  { email: "reception@valentia-demo.example.com", name: "Róisín Test-Reception", role: "RECEPTION", practiceSlug: "valentia-demo" },
  { email: "patient@valentia-demo.example.com", name: "Pádraig Sample-Patient", role: "PATIENT", practiceSlug: "valentia-demo" },
  { email: "admin@practice-b.example.com", name: "Brian Demo-AdminB", role: "ADMIN", practiceSlug: "demo-practice-b" },
]
