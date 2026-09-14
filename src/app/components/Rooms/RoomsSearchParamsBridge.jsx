"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RoomsSearchParamsBridge({ onParams }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");
    if (checkIn || checkOut || guests) {
      onParams({ checkIn, checkOut, guests });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
