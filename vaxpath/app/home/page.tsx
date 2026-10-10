import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { homePathFor } from "@/lib/rbac"

export default async function HomeRedirect() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  redirect(homePathFor(session.user.role))
}
