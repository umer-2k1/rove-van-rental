"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/store";
import type { AppDispatch } from "@/store";
import { hydrate } from "@/store/booking-slice";

const STORAGE_KEY = "rove.booking.draft";

function DraftPersistence() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          vanSlug?: string | null;
          pickupDate?: string | null;
          returnDate?: string | null;
        };
        dispatch(
          hydrate({
            vanSlug: parsed.vanSlug ?? null,
            pickupDate: parsed.pickupDate ?? null,
            returnDate: parsed.returnDate ?? null,
          }),
        );
      }
    } catch {
      // A corrupt draft is not worth a broken page.
    }

    const unsubscribe = store.subscribe(() => {
      try {
        const { vanSlug, pickupDate, returnDate } = store.getState().booking;
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ vanSlug, pickupDate, returnDate }),
        );
      } catch {
        // Private mode can block storage; the form still works.
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <DraftPersistence />
      {children}
    </Provider>
  );
}
