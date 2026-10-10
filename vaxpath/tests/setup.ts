import { existsSync } from "node:fs"

if (existsSync(".env")) process.loadEnvFile(".env")
// Integration tests always run against a separate database, never the dev one.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
process.env.FIELD_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64")
