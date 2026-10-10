import { getTranslations } from "next-intl/server"
import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export async function SignOutButton() {
  const t = await getTranslations("common")
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        {t("signOut")}
      </Button>
    </form>
  )
}
