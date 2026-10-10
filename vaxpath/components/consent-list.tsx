import { getFormatter, getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CONSENT_PURPOSES, type ConsentState } from "@/lib/consent"

export async function ConsentList({
  state,
  patientId,
  action,
}: {
  state: ConsentState
  patientId: string
  action?: (formData: FormData) => Promise<void>
}) {
  const t = await getTranslations("consent")
  const format = await getFormatter()
  return (
    <ul className="divide-y rounded-md border">
      {CONSENT_PURPOSES.map((purpose) => {
        const c = state[purpose]
        return (
          <li key={purpose} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <div>
              <div className="font-medium">{t(purpose)}</div>
              {c.at && (
                <div className="text-xs text-muted-foreground">
                  {format.dateTime(c.at, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {t("policyVersion", { version: c.policyVersion ?? "" })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.granted ? "success" : "outline"}>{c.granted ? t("granted") : t("notGranted")}</Badge>
              {action && (
                <form action={action}>
                  <input type="hidden" name="patientId" value={patientId} />
                  <input type="hidden" name="purpose" value={purpose} />
                  <input type="hidden" name="granted" value={String(!c.granted)} />
                  <Button type="submit" size="sm" variant="outline">
                    {c.granted ? t("withdraw") : t("grant")}
                  </Button>
                </form>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
