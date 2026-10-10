import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/prisma/demo-accounts"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const t = await getTranslations()
  const showDemo = process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_ACCOUNTS === "true"
  return (
    <main className="container flex min-h-[80vh] max-w-md flex-col justify-center gap-4 py-12">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      {showDemo && (
        <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-medium">{t("login.demoAccounts", { password: DEMO_PASSWORD })}</p>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <code>{a.email}</code> — {t(`roles.${a.role}`)} ({a.practiceSlug})
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
