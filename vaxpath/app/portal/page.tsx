import { getFormatter, getTranslations } from "next-intl/server"
import { ConsentList } from "@/components/consent-list"
import { DeniedNotice } from "@/components/denied-notice"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SignOutButton } from "@/components/sign-out-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { currentConsents } from "@/lib/consent"
import { viewPatientSensitive } from "@/lib/patients"
import { requireUser } from "@/lib/session"

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { user, practice, db } = await requireUser("portal:view")
  const t = await getTranslations()
  const format = await getFormatter()
  const patient = user.patientId ? await viewPatientSensitive(db, user, user.patientId) : null
  const consents = patient ? await currentConsents(db, patient.id) : null
  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-primary">{t("common.appName")}</div>
          <div className="text-xs text-muted-foreground">{practice.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <SignOutButton />
        </div>
      </header>
      <DeniedNotice denied={(await searchParams).denied} />
      <Card>
        <CardHeader>
          <CardTitle>{t("portal.title")}</CardTitle>
          <CardDescription>{t("portal.intro")}</CardDescription>
        </CardHeader>
        {patient && (
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              {patient.firstName} {patient.lastName}
            </p>
            <p>
              {t("patients.dob")}: {format.dateTime(patient.dateOfBirth, { dateStyle: "long", timeZone: "UTC" })}
            </p>
            <p>
              {t("patients.email")}: {patient.email ?? "—"}
            </p>
          </CardContent>
        )}
      </Card>
      {patient && consents && (
        <Card>
          <CardHeader>
            <CardTitle>{t("portal.yourConsents")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsentList state={consents} patientId={patient.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
