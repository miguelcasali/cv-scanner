import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { can, homePathFor, type Permission } from "@/lib/rbac"
import { tenantDb } from "@/lib/tenant-db"

/**
 * Loads the signed-in user from the database on every request (so deactivation or a role change
 * takes effect immediately) and enforces the permission. Returns a tenant-bound db client.
 */
export async function requireUser(permission?: Permission) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { practice: true } })
  if (!user || !user.active) redirect("/login")
  if (permission && !can(user.role, permission)) redirect(`${homePathFor(user.role)}?denied=1`)
  return { user, practice: user.practice, db: tenantDb(user.practiceId) }
}
