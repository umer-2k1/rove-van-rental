"use client";

import { useActionState } from "react";
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import { lookupBooking, type LookupState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LookupState = {};

export function LookupForm() {
  const [state, formAction, pending] = useActionState(lookupBooking, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reference" className="text-[12px]">
          Booking reference
        </Label>
        <Input
          id="reference"
          name="reference"
          placeholder="RV-4K7M2Q"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className="h-11 font-mono tracking-[0.12em] uppercase"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "reference-error" : undefined}
        />
        {state.error ? (
          <p id="reference-error" role="alert" className="text-[12px] text-destructive">
            {state.error}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="h-11 w-full text-[13px]" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
            Looking…
          </>
        ) : (
          <>
            Find my booking
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
