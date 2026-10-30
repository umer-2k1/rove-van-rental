import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="shell flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[15px] font-semibold tracking-[-0.03em]"
            >
              ROVE
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span className="eyebrow">Operations</span>
          </div>

          <nav aria-label="Admin" className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Reservations
            </Link>
            <Link
              href="/"
              className="hidden text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              View site
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main id="main" className="shell flex-1 py-8 md:py-10">{children}</main>

      <footer className="border-t border-border">
        <div className="shell flex flex-col gap-1 py-4 text-[11px] text-muted-foreground sm:flex-row sm:justify-between">
          <p>Rove Operations · session expires after 8 hours</p>
          <p>Times shown in UTC</p>
        </div>
      </footer>
    </div>
  );
}
