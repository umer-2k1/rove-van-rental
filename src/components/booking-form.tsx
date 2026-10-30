"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import {
  CalendarDaysIcon,
  CheckIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { createBooking } from "@/app/actions/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch, useAppSelector, selectBookingDraft } from "@/store/hooks";
import { clear, setDates, setVan } from "@/store";
import {
  addDaysIso,
  calendarDateToIso,
  diffDays,
  formatDate,
  parseIsoDate,
  todayIso,
} from "@/lib/dates";
import { findConflicts, occupiedNights, type DateRange } from "@/lib/availability";
import { formatMoney, quoteFor } from "@/lib/pricing";
import { bookingSchema, MAX_ADVANCE_DAYS, type BookingInput } from "@/lib/validation";
import type { VanSummary } from "@/lib/types";

type Props = {
  van: VanSummary;
  bookedRanges: DateRange[];
};

export function BookingForm({ van, bookedRanges }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectBookingDraft);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = todayIso();
  const lastBookableDay = addDaysIso(today, MAX_ADVANCE_DAYS);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vanSlug: van.slug,
      pickupDate: "",
      returnDate: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  const pickupDate = useWatch({ control, name: "pickupDate" });
  const returnDate = useWatch({ control, name: "returnDate" });

  // Restore a draft once Redux has hydrated from sessionStorage.
  useEffect(() => {
    if (!draft.hydrated) return;

    if (draft.vanSlug !== van.slug) {
      dispatch(setVan(van.slug));
      return;
    }

    if (draft.pickupDate) {
      setValue("pickupDate", draft.pickupDate, { shouldValidate: false });
    } else {
      setValue("pickupDate", "", { shouldValidate: false });
    }
    if (draft.returnDate) {
      setValue("returnDate", draft.returnDate, { shouldValidate: false });
    } else {
      setValue("returnDate", "", { shouldValidate: false });
    }
  }, [
    draft.hydrated,
    draft.vanSlug,
    draft.pickupDate,
    draft.returnDate,
    dispatch,
    setValue,
    van.slug,
  ]);

  const selectedRange = useMemo<DayPickerRange | undefined>(() => {
    if (!pickupDate) return undefined;
    return {
      from: parseISO(pickupDate),
      to: returnDate ? parseISO(returnDate) : undefined,
    };
  }, [pickupDate, returnDate]);

  const disabledDays = useMemo(() => {
    const nights = [...occupiedNights(bookedRanges)].map((iso) => parseISO(iso));
    return [
      { before: parseIsoDate(today) },
      { after: parseIsoDate(lastBookableDay) },
      ...nights,
    ];
  }, [bookedRanges, today, lastBookableDay]);

  const bookedDates = useMemo(
    () => [...occupiedNights(bookedRanges)].map((iso) => parseISO(iso)),
    [bookedRanges],
  );

  const days =
    pickupDate && returnDate ? diffDays(pickupDate, returnDate) : 0;
  const quote = days > 0 ? quoteFor(van, days) : null;

  const conflicts = useMemo(() => {
    if (!pickupDate || !returnDate) return [];
    if (diffDays(pickupDate, returnDate) <= 0) return [];
    return findConflicts({ start: pickupDate, end: returnDate }, bookedRanges);
  }, [pickupDate, returnDate, bookedRanges]);

  function handleRangeSelect(range: DayPickerRange | undefined) {
    const pickup = range?.from ? calendarDateToIso(range.from) : null;
    const hasDistinctReturn =
      range?.to && range.from && range.to.getTime() !== range.from.getTime();
    const nextReturn = hasDistinctReturn ? calendarDateToIso(range.to!) : null;

    setValue("pickupDate", pickup ?? "", { shouldValidate: false });
    setValue("returnDate", nextReturn ?? "", { shouldValidate: false });
    dispatch(setDates({ pickupDate: pickup, returnDate: nextReturn }));

    if (pickup && nextReturn) {
      setCalendarOpen(false);
      void trigger(["pickupDate", "returnDate"]);
    }
  }

  async function onSubmit(values: BookingInput) {
    setServerError(null);

    if (conflicts.length > 0) {
      setError("returnDate", {
        message: "Those dates overlap an existing booking for this van.",
      });
      return;
    }

    const result = await createBooking(values);

    if (!result.ok) {
      setServerError(result.message);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof BookingInput, { message: messages[0] });
          }
        }
      }
      return;
    }

    dispatch(clear());
    router.push(`/reservations/${result.reference}?new=1`);
  }

  const dateError = errors.pickupDate?.message ?? errors.returnDate?.message;

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <p className="eyebrow">Reserve</p>
        <p className="num text-sm">
          {formatMoney(van.dailyRateCents)}
          <span className="text-muted-foreground"> / day</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
        <div>
          <p id="dates-label" className="eyebrow mb-2">
            Dates
          </p>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-labelledby="dates-label dates-value"
                aria-describedby="dates-help"
                className="grid w-full grid-cols-2 divide-x divide-border rounded-lg border border-input bg-background text-left transition-colors hover:border-ring"
              >
                <span className="px-3 py-2.5">
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Pickup
                  </span>
                  <span
                    className={`mt-0.5 block text-[13px] ${
                      pickupDate ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {pickupDate ? formatDate(pickupDate, "EEE d MMM") : "Add date"}
                  </span>
                </span>
                <span className="px-3 py-2.5">
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Return
                  </span>
                  <span
                    className={`mt-0.5 block text-[13px] ${
                      returnDate ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {returnDate ? formatDate(returnDate, "EEE d MMM") : "Add date"}
                  </span>
                </span>
                <span id="dates-value" className="sr-only">
                  {pickupDate && returnDate
                    ? `Pickup ${formatDate(pickupDate)}, return ${formatDate(returnDate)}`
                    : "No dates selected"}
                </span>
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                disabled={disabledDays}
                numberOfMonths={1}
                startMonth={parseIsoDate(today)}
                endMonth={parseIsoDate(lastBookableDay)}
                modifiers={{ booked: bookedDates }}
                modifiersClassNames={{ booked: "rdp-booked" }}
                className="p-2"
              />
              <div className="flex items-start gap-2 border-t border-border px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                <CalendarDaysIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <p>
                  Struck-through dates are booked. The return day is free for the
                  next pickup.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <p className="mt-2 text-[11px] text-muted-foreground" id="dates-help">
            {days > 0
              ? `${days} ${days === 1 ? "night" : "nights"} · ${formatDate(
                  pickupDate,
                  "d MMM",
                )} – ${formatDate(returnDate, "d MMM")}`
              : "Pickup and return are counted per night."}
          </p>

          {dateError ? (
            <p className="mt-2 text-[11px] text-destructive" role="alert">
              {dateError}
            </p>
          ) : null}
        </div>

        {conflicts.length > 0 ? (
          <Alert variant="destructive" className="bg-background">
            <AlertDescription className="text-[12px]">
              Already reserved{" "}
              {formatDate(conflicts[0].start, "d MMM")} –{" "}
              {formatDate(conflicts[0].end, "d MMM")}. Choose dates outside that
              range.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3 border-t border-border pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="customerName" className="text-[12px]">
              Full name
            </Label>
            <Input
              id="customerName"
              autoComplete="name"
              placeholder="Alex Rivera"
              className="h-10"
              aria-invalid={Boolean(errors.customerName)}
              {...register("customerName")}
            />
            {errors.customerName ? (
              <p className="text-[11px] text-destructive" role="alert">
                {errors.customerName.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customerEmail" className="text-[12px]">
                Email
              </Label>
              <Input
                id="customerEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="alex@example.com"
                className="h-10"
                aria-invalid={Boolean(errors.customerEmail)}
                {...register("customerEmail")}
              />
              {errors.customerEmail ? (
                <p className="text-[11px] text-destructive" role="alert">
                  {errors.customerEmail.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customerPhone" className="text-[12px]">
                Phone
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 415 555 0134"
                className="h-10"
                aria-invalid={Boolean(errors.customerPhone)}
                {...register("customerPhone")}
              />
              {errors.customerPhone ? (
                <p className="text-[11px] text-destructive" role="alert">
                  {errors.customerPhone.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-border pt-4 text-[13px]">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">
              {quote ? (
                <>
                  {formatMoney(van.dailyRateCents)} × {quote.days}{" "}
                  {quote.days === 1 ? "day" : "days"}
                </>
              ) : (
                "Rental"
              )}
            </span>
            <span className="num">{quote ? formatMoney(quote.days * quote.dailyRateCents) : "—"}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Cleaning</span>
            <span className="num">{formatMoney(van.cleaningFeeCents)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2.5 text-[15px]">
            <span>Total</span>
            <span className="num font-medium">
              {quote ? formatMoney(quote.totalCents) : "—"}
            </span>
          </div>
        </div>

        {serverError ? (
          <Alert variant="destructive" className="bg-background">
            <AlertDescription className="text-[12px]">
              {serverError}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full text-[13px]"
          disabled={isSubmitting || conflicts.length > 0}
        >
          {isSubmitting ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
              Confirming…
            </>
          ) : (
            <>
              <CheckIcon className="size-4" aria-hidden="true" />
              Confirm reservation
            </>
          )}
        </Button>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheckIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          No payment now. You get a reference and an unlock code immediately.
        </p>
      </form>
    </div>
  );
}
