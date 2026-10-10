// End-to-end smoke test against a running server: node e2e/smoke.mjs [baseUrl]
import { chromium } from "playwright"

const BASE = process.argv[2] ?? "http://localhost:3000"
const PASSWORD = "VaxPath-demo-2026"
const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`)
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })

async function login(email) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.fill("#email", email)
  await page.fill("#password", PASSWORD)
  await Promise.all([page.waitForURL((u) => !["/login", "/home"].includes(u.pathname), { timeout: 15000 }), page.click("button[type=submit]")])
  return { ctx, page }
}

// Wrong password
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.fill("#email", "admin@valentia-demo.example.com")
  await page.fill("#password", "wrong")
  await page.click("button[type=submit]")
  await page.waitForSelector("[role=alert]")
  check("wrong password is rejected", page.url().includes("/login"))
  await ctx.close()
}

// Admin
{
  const { ctx, page } = await login("admin@valentia-demo.example.com")
  check("admin lands on /app", new URL(page.url()).pathname === "/app")
  check("admin sees practice name", (await page.textContent("aside")).includes("Valentia Medical Centre (DEMO)"))
  await page.goto(`${BASE}/app/patients`)
  const rows = await page.locator("tbody tr").count()
  check("admin sees only own practice patients", rows === 8 && !(await page.content()).includes("OtherPractice"), `${rows} rows`)
  await page.locator("tbody tr a").first().click()
  await page.waitForURL(/\/app\/patients\/.+/)
  const patientUrl = page.url()
  check("patient detail decrypts contact fields", (await page.content()).includes("+353 87 000"))
  const before = await page.locator("ul li").nth(1).textContent()
  await page.locator("ul li").nth(1).locator("button").click()
  await page.waitForFunction((b) => document.querySelectorAll("ul li")[1].textContent !== b, before)
  check("SMS consent toggles", true)
  await page.goto(`${BASE}/app/audit`)
  const audit = await page.content()
  check("audit log shows login, sensitive view and consent change",
    audit.includes("auth.login") && audit.includes("patient.view_sensitive") && /consent\.(grant|withdraw)/.test(audit))
  // Spanish
  await page.selectOption("select[aria-label]", "es")
  await page.waitForFunction(() => document.body.innerText.includes("Registro de auditoría"))
  check("language switches to Spanish", (await page.textContent("h1")).includes("Registro de auditoría"))
  await page.selectOption("select[aria-label]", "en")
  await page.waitForFunction(() => document.body.innerText.includes("Audit log"))
  await ctx.close()

  // Practice B admin cannot open a Valentia patient
  const b = await login("admin@practice-b.example.com")
  const res = await b.page.goto(patientUrl)
  check("other practice gets 404 on a foreign patient id", res.status() === 404, `status ${res.status()}`)
  await b.page.goto(`${BASE}/app/patients`)
  check("practice B sees only its 2 patients", (await b.page.locator("tbody tr").count()) === 2)
  await b.ctx.close()
}

// Reception: no audit/users
{
  const { ctx, page } = await login("reception@valentia-demo.example.com")
  await page.goto(`${BASE}/app/audit`)
  check("reception is denied the audit log", page.url().includes("/app?denied=1"))
  check("reception nav hides admin links", !(await page.textContent("aside")).includes("Audit log"))
  await ctx.close()
}

// Clinician
{
  const { ctx, page } = await login("clinician@valentia-demo.example.com")
  await page.goto(`${BASE}/app/users`)
  check("clinician is denied user management", page.url().includes("denied=1"))
  await ctx.close()
}

// Patient
{
  const { ctx, page } = await login("patient@valentia-demo.example.com")
  check("patient lands on /portal", new URL(page.url()).pathname === "/portal")
  check("patient sees own record", (await page.content()).includes("Sample-Patient"))
  await page.goto(`${BASE}/app`)
  check("patient is kept out of staff area", new URL(page.url()).pathname === "/portal")
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
