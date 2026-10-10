import { describe, expect, it } from "vitest"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe("translations", () => {
  it("English and Spanish define exactly the same keys", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort())
  })

  it("has no empty strings", () => {
    for (const messages of [en, es]) {
      const flat = keys(messages)
      for (const k of flat) {
        const value = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], messages)
        expect(value, k).not.toBe("")
      }
    }
  })
})
