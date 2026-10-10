import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const t = await getTranslations()
  return (
    <main className="container flex min-h-[80vh] flex-col justify-center gap-8 py-16">
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-primary">{t("common.appName")}</span>
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("landing.headline")}</h1>
        <p className="text-lg text-muted-foreground">{t("landing.intro")}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">{t("landing.staffLogin")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("landing.patientLogin")}</Link>
          </Button>
        </div>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{t("common.notMedicalDevice")}</p>
    </main>
  )
}
