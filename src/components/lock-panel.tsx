"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRoundIcon, LoaderCircleIcon, LockIcon, UnlockIcon } from "lucide-react";

import { toggleVanLock } from "@/app/actions/lock";
import { Button } from "@/components/ui/button";
import { LockStatePill } from "@/components/pills";
import { formatDate, type RentalPhase } from "@/lib/dates";

type Props = {
  reference: string;
  isLocked: boolean;
  status: "CONFIRMED" | "CANCELLED";
  pickupDate: string;
  returnDate: string;
  unlockCode: string;
  phase: RentalPhase;
};

export function LockPanel({
  reference,
  isLocked,
  status,
  pickupDate,
  returnDate,
  unlockCode,
  phase,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cancelled = status === "CANCELLED";
  const canControl = !cancelled && phase === "active";

  function toggle() {
    startTransition(async () => {
      const result = await toggleVanLock(reference);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.locked ? "Van locked." : "Van unlocked.");
      router.refresh();
    });
  }

  const reason = cancelled
    ? "This reservation was cancelled, so the lock is disabled."
    : phase === "upcoming"
      ? `The lock activates on pickup day, ${formatDate(pickupDate)}.`
      : phase === "ended"
        ? `This rental ended on ${formatDate(returnDate)}.`
        : null;

  return (
    <section
      aria-labelledby="lock-panel-title"
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 id="lock-panel-title" className="eyebrow">
          Van lock
        </h2>
        <LockStatePill isLocked={cancelled ? true : isLocked} />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-background"
          >
            {isLocked ? (
              <LockIcon className="size-4" />
            ) : (
              <UnlockIcon className="size-4" />
            )}
          </span>

          <div>
            <p className="text-[15px] leading-snug">
              {cancelled
                ? "The van has been released."
                : isLocked
                  ? "The van is locked."
                  : "The van is unlocked."}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {cancelled
                ? "No further changes can be made."
                : phase === "active"
                  ? isLocked
                    ? "Tap unlock when you are ready to drive."
                    : "Remember to lock it when you park."
                  : phase === "upcoming"
                    ? "This panel goes live on pickup day."
                    : "The rental period has closed."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={toggle}
          disabled={!canControl || pending}
          className="mt-5 h-11 w-full text-[13px] disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
        >
          {pending ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
              Working…
            </>
          ) : isLocked ? (
            <>
              <UnlockIcon className="size-4" aria-hidden="true" />
              Unlock van
            </>
          ) : (
            <>
              <LockIcon className="size-4" aria-hidden="true" />
              Lock van
            </>
          )}
        </Button>

        {reason ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {reason}
          </p>
        ) : null}

        <div className="mt-5 border-t border-border pt-4">
          <p className="eyebrow">Unlock code</p>
          <p className="num mt-2 font-mono text-[19px] tracking-[0.32em]">
            {unlockCode}
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <KeyRoundIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Also works on the keypad at the driver&apos;s door.
          </p>
        </div>

        <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
          Demonstration control. No vehicle is connected; state is stored with
          your reservation.
        </p>
      </div>
    </section>
  );
}
