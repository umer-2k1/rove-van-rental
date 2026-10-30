import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex xl:p-14">
        <p className="text-[19px] font-semibold tracking-[-0.03em]">ROVE</p>
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-background/65">
            Operations
          </p>
          <h1 className="mt-4 max-w-sm text-[clamp(1.9rem,3vw,2.6rem)] text-background">
            Every booking, one table.
          </h1>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-background/70">
            Reservations, lock activity, and cancellations. Authorised staff
            only.
          </p>
        </div>
        <p className="text-[11px] text-background/65">
          Rove Van Rental · Oakland, CA
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" aria-hidden="true" />
            Back to site
          </Link>

          <h2 className="mt-8 text-[clamp(1.6rem,3vw,2.1rem)]">Sign in</h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Use the password configured in <code className="font-mono text-[12px]">ADMIN_PASSWORD</code>.
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
