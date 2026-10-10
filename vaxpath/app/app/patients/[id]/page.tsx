import Link from "next/link"
import { notFound } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import { ConsentList } from "@/components/consent-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { currentConsents } from "@/lib/consent"
import { viewPatientSensitive } from "@/lib/patients"
import { can } from "@/lib/rbac"
import { requireUser } from "@/lib/session"
import { recordConsentAction } from "./actions"

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, db } = await requireUser("patients:viewSensitive")
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const patient = await viewPatientSensitive(db, user, id)
  if (!patient || patient.erasedAt) notFound()
  const consents = await currentConsents(db, id)
  const t = await getTranslations()
  const format = await getFormatter()
  const rows: [string, string | null][] = [
    [t("patients.dob"), format.dateTime(patient.dateOfBirth, { dateStyle: "long", timeZone: "UTC" })],
    [t("patients.phone"), patient.phone],
    [t("patients.email"), patient.email],
    [t("patients.address"), patient.address],
    [t("patients.gmsNumber"), patient.gmsNumber],
    [t("patients.notes"), patient.notes],
  ]
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/app/patients" className="text-sm text-primary hover:underline">
        ← {t("patients.back")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            {patient.firstName} {patient.lastName}
          </CardTitle>
          <CardDescription>{t("patients.sensitiveNotice")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[200px_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("consent.title")}</CardTitle>
          <CardDescription>{t("consent.history")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ConsentList
            state={consents}
            patientId={id}
            action={can(user.role, "consent:record") ? recordConsentAction : undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}
