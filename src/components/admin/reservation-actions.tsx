"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon, LockIcon, UnlockIcon } from "lucide-react";

import { adminSetLock, cancelReservation } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  reservationId: string;
  status: "CONFIRMED" | "CANCELLED";
  isLocked: boolean;
};

export function ReservationActions({ reservationId, status, isLocked }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockPending, startLock] = useTransition();
  const [cancelPending, startCancel] = useTransition();

  const cancelled = status === "CANCELLED";

  function toggleLock() {
    startLock(async () => {
      const result = await adminSetLock(reservationId, !isLocked);
      if (!result.ok) {
        toast.error(result.message ?? "Could not change the lock.");
        return;
      }
      toast.success(isLocked ? "Van unlocked." : "Van locked.");
      router.refresh();
    });
  }

  function confirmCancel() {
    startCancel(async () => {
      const result = await cancelReservation(reservationId);
      if (!result.ok) {
        toast.error(result.message ?? "Could not cancel.");
        return;
      }
      setDialogOpen(false);
      toast.success("Reservation cancelled. Dates released.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-3 text-[12px]"
        onClick={toggleLock}
        disabled={cancelled || lockPending}
      >
        {lockPending ? (
          <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden="true" />
        ) : isLocked ? (
          <UnlockIcon className="size-3.5" aria-hidden="true" />
        ) : (
          <LockIcon className="size-3.5" aria-hidden="true" />
        )}
        {isLocked ? "Unlock" : "Lock"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[12px] text-destructive hover:text-destructive"
            disabled={cancelled}
          >
            Cancel reservation
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this reservation?</DialogTitle>
            <DialogDescription>
              The dates are released immediately and the customer can no longer
              unlock the van. This cannot be undone from the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9">
                Keep it
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-9 bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmCancel}
              disabled={cancelPending}
            >
              {cancelPending ? "Cancelling…" : "Cancel reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
