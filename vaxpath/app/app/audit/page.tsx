import { getFormatter, getTranslations } from "next-intl/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireUser } from "@/lib/session"

export default async function AuditPage() {
  const { db } = await requireUser("audit:view")
  const t = await getTranslations()
  const format = await getFormatter()
  const events = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  const actorIds = [...new Set(events.map((e) => e.actorId).filter((id): id is string => !!id))]
  const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
  const actorName = new Map(actors.map((a) => [a.id, a.name]))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("audit.empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("audit.when")}</TableHead>
              <TableHead>{t("audit.actor")}</TableHead>
              <TableHead>{t("audit.action")}</TableHead>
              <TableHead>{t("audit.entity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{format.dateTime(e.createdAt, { dateStyle: "short", timeStyle: "medium" })}</TableCell>
                <TableCell>
                  {(e.actorId && actorName.get(e.actorId)) || "—"}
                  {e.actorRole && <span className="text-muted-foreground"> · {t(`roles.${e.actorRole}`)}</span>}
                </TableCell>
                <TableCell>
                  <code className="text-xs">{e.action}</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {e.entityType ? `${e.entityType} ${e.entityId?.slice(0, 8)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
