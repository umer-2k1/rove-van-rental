"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { nav } from "@/lib/constants";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-[13px] focus:text-background"
      >
        Skip to content
      </a>
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-baseline gap-3"
          aria-label="Rove — home"
        >
          <span className="text-[19px] font-semibold tracking-[-0.03em]">
            ROVE
          </span>
          <span className="eyebrow hidden sm:block">Van rental</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "text-sm text-foreground"
                  : "text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="h-9 px-4 text-[13px]">
            <Link href="/#fleet">Book a van</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background p-6">
              <SheetHeader className="p-0">
                <SheetTitle className="text-left text-sm font-medium tracking-[0.18em] uppercase text-muted-foreground">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-b border-border py-4 text-lg tracking-[-0.02em]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admin/login"
                  className="py-4 text-sm text-muted-foreground"
                >
                  Admin
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
