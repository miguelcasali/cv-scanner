import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/config"

// Locale comes from a cookie (no URL prefix). English is the default.
export default getRequestConfig(async () => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(value) ? value : DEFAULT_LOCALE
  return { locale, messages: (await import(`../messages/${locale}.json`)).default, timeZone: "Europe/Dublin" }
})
