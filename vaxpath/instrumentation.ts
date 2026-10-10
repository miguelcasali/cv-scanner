// Runs once at server start: refuse to boot with a non-EU data region or a live Stripe key.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("@/lib/env")
    env()
  }
}
