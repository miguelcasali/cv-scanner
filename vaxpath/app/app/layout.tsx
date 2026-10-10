import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SignOutButton } from "@/components/sign-out-button"
import { can, type Permission } from "@/lib/rbac"
import { requireUser } from "@/lib/session"

type NavItem = { href: string; key: string; permission: Permission; phase?: number }

const NAV: NavItem[] = [
  { href: "/app", key: "dashboard", permission: "dashboard:view" },
  { href: "/app/patients", key: "patients", permission: "patients:view" },
  { href: "#", key: "travel", permission: "dashboard:view", phase: 1 },
  { href: "#", key: "referrals", permission: "dashboard:view", phase: 2 },
  { href: "#", key: "campaigns", permission: "dashboard:view", phase: 3 },
  { href: "#", key: "coldChain", permission: "dashboard:view", phase: 4 },
  { href: "/app/users", key: "users", permission: "users:manage" },
  { href: "/app/audit", key: "audit", permission: "audit:view" },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, practice } = await requireUser("dashboard:view")
  const t = await getTranslations()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b bg-muted/40 p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-1 text-lg font-bold text-primary">{t("common.appName")}</div>
        <div className="mb-4 text-xs text-muted-foreground">{practice.name}</div>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {NAV.filter((item) => can(user.role, item.permission)).map((item) =>
            item.phase ? (
              <span
                key={item.key}
                className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground"
                title={t("common.comingSoon", { phase: item.phase })}
              >
                {t(`nav.${item.key}`)} <span className="text-[10px]">· F{item.phase}</span>
              </span>
            ) : (
              <Link key={item.key} href={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                {t(`nav.${item.key}`)}
              </Link>
            ),
          )}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b px-6 py-3 text-sm">
          <span className="text-muted-foreground">
            {user.name} · {t(`roles.${user.role}`)}
          </span>
          <LanguageSwitcher />
          <SignOutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
