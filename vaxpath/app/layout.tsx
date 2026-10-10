import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import "./globals.css"

export const metadata: Metadata = {
  title: "VaxPath",
  description: "Vaccination workflow for GP practices in Ireland",
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const t = await getTranslations("common")
  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <NextIntlClientProvider>
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900" role="note">
            {t("demoBanner")}
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
