import { getFormatter, getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireUser } from "@/lib/session"

export default async function UsersPage() {
  const { db } = await requireUser("users:manage")
  const t = await getTranslations()
  const format = await getFormatter()
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("users.title")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users.name")}</TableHead>
            <TableHead>{t("users.email")}</TableHead>
            <TableHead>{t("users.role")}</TableHead>
            <TableHead>{t("users.active")}</TableHead>
            <TableHead>{t("users.lastLogin")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{t(`roles.${u.role}`)}</Badge>
              </TableCell>
              <TableCell>{u.active ? "✓" : "—"}</TableCell>
              <TableCell>{u.lastLoginAt ? format.dateTime(u.lastLoginAt, { dateStyle: "short", timeStyle: "short" }) : t("users.never")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
