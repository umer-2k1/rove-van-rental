import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/booking-slice";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const selectBookingDraft = (state: RootState) => state.booking;
