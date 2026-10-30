import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type BookingDraft = {
  vanSlug: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  /** True once sessionStorage has been read, so the form can restore safely. */
  hydrated: boolean;
};

const initialState: BookingDraft = {
  vanSlug: null,
  pickupDate: null,
  returnDate: null,
  hydrated: false,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setVan(state, action: PayloadAction<string>) {
      if (state.vanSlug !== action.payload) {
        state.vanSlug = action.payload;
        state.pickupDate = null;
        state.returnDate = null;
      }
    },
    setDates(
      state,
      action: PayloadAction<{ pickupDate: string | null; returnDate: string | null }>,
    ) {
      state.pickupDate = action.payload.pickupDate;
      state.returnDate = action.payload.returnDate;
    },
    hydrate(state, action: PayloadAction<Omit<BookingDraft, "hydrated">>) {
      state.vanSlug = action.payload.vanSlug;
      state.pickupDate = action.payload.pickupDate;
      state.returnDate = action.payload.returnDate;
      state.hydrated = true;
    },
    clear(state) {
      state.vanSlug = null;
      state.pickupDate = null;
      state.returnDate = null;
      state.hydrated = true;
    },
  },
});

export const { setVan, setDates, hydrate, clear } = bookingSlice.actions;

export const store = configureStore({
  reducer: {
    booking: bookingSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
