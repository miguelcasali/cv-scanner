import { execSync } from "node:child_process"
import { existsSync } from "node:fs"

if (existsSync(".env")) process.loadEnvFile(".env")
const url = process.env.TEST_DATABASE_URL
if (!url) throw new Error("TEST_DATABASE_URL is not set")
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } })
