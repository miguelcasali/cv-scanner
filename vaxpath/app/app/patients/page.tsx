import Link from "next/link"
import { getFormatter, getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireUser } from "@/lib/session"

export default async function PatientsPage() {
  const { db } = await requireUser("patients:view")
  const t = await getTranslations()
  const format = await getFormatter()
  // List view selects only non-encrypted columns: no decryption, no sensitive data on screen.
  const patients = await db.patient.findMany({
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, erasedAt: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("patients.title")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("patients.name")}</TableHead>
            <TableHead>{t("patients.dob")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {p.erasedAt ? <Badge variant="outline">{t("patients.erased")}</Badge> : `${p.lastName}, ${p.firstName}`}
              </TableCell>
              <TableCell>{p.erasedAt ? "—" : format.dateTime(p.dateOfBirth, { dateStyle: "medium", timeZone: "UTC" })}</TableCell>
              <TableCell className="text-right">
                {!p.erasedAt && (
                  <Link className="text-primary underline-offset-4 hover:underline" href={`/app/patients/${p.id}`}>
                    {t("patients.view")}
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
