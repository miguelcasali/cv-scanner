import { getTranslations } from "next-intl/server"

export async function DeniedNotice({ denied }: { denied?: string }) {
  if (!denied) return null
  const t = await getTranslations("common")
  return (
    <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
      {t("accessDenied")}
    </div>
  )
}
