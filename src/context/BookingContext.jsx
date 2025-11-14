"use client";
import { createContext, useContext, useState, useEffect } from "react";

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [booking, setBookingState] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("booking");
    if (saved) setBookingState(JSON.parse(saved));
  }, []);

  const setBooking = (data) => {
    setBookingState(data);
    localStorage.setItem("booking", JSON.stringify(data));
  };

  const clearBooking = () => {
    setBookingState(null);
    localStorage.removeItem("booking");
  };

  return (
    <BookingContext.Provider value={{ booking, setBooking, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
