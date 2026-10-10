import { getTranslations } from "next-intl/server"
import { DeniedNotice } from "@/components/denied-notice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/session"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { user, practice, db } = await requireUser("dashboard:view")
  const t = await getTranslations()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [patients, staff, auditEvents] = await Promise.all([
    db.patient.count({ where: { erasedAt: null } }),
    db.user.count({ where: { role: { not: "PATIENT" }, active: true } }),
    db.auditLog.count({ where: { createdAt: { gte: since } } }),
  ])
  const stats = [
    { label: t("dashboard.patients"), value: patients },
    { label: t("dashboard.staff"), value: staff },
    { label: t("dashboard.auditEvents"), value: auditEvents },
  ]
  return (
    <div className="space-y-6">
      <DeniedNotice denied={(await searchParams).denied} />
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.welcome", { name: user.name })}</h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.signedInAs", { role: t(`roles.${user.role}`), practice: practice.name })}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{t("common.notMedicalDevice")}</CardContent>
      </Card>
    </div>
  )
}
