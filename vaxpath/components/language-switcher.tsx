"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { setLocale } from "@/i18n/actions"
import { LOCALES } from "@/i18n/config"

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        className="rounded-md border border-input bg-background px-2 py-1"
        value={locale}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setLocale(e.target.value)
            router.refresh()
          })
        }
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {l === "en" ? "English" : "Español"}
          </option>
        ))}
      </select>
    </label>
  )
}
