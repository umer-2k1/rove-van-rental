"use client";

import { useActionState } from "react";
import { LoaderCircleIcon, LockKeyholeIcon } from "lucide-react";
import { loginAdmin, type LoginState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="mt-7 space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[12px]">
          Admin password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="h-11"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "password-error" : undefined}
        />
        {state.error ? (
          <p id="password-error" role="alert" className="text-[12px] text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="h-11 w-full text-[13px]" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            <LockKeyholeIcon className="size-4" aria-hidden="true" />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
