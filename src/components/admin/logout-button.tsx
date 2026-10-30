"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 px-2 text-[12px] text-muted-foreground hover:text-foreground"
      disabled={pending}
      onClick={() => startTransition(() => logoutAdmin())}
    >
      <LogOutIcon className="size-3.5" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
