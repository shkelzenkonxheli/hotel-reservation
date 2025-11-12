"use client";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { setBooking } = useBooking();

  useEffect(() => {
    async function fetchRooms() {
      const response = await fetch("/api/rooms-type");
      const data = await response.json();
      setRoomTypes(data);
    }
    fetchRooms();
  }, []);
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data);
    }
    fetchUser();
  }, [router]);

  const handleBookClick = (room) => {
    setSelectedRoom(room);
    setShowDateInput(true);
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const res = await fetch(
      `/api/reservation?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`
    );
    const data = await res.json();

    if (!data.available) {
      alert("Room is not available for the selected dates.");
      return;
    }

    setBooking({ room: selectedRoom, startDate, endDate });
    router.push(
      `/checkoutBooking?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`
    );
  };

  return (
    <div className="pt-10 px-6 pb-16 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-10 text-center text-gray-800 flex items-center justify-center gap-2">
        🏨 Available Room Types
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {roomTypes.map((room) => (
          <div
            key={room.type}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col"
          >
            {/* Swiper images */}
            <div className="relative h-52 w-full">
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full w-full"
              >
                {room.images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={img}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {room.type}
              </span>
            </div>

            {/* Details */}
            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {room.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {room.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-600 font-semibold text-sm">
                  ${room.price}/night
                </span>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                  onClick={() => handleBookClick(room)}
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for dates */}
      {showDateInput && selectedRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-800 text-center">
              Select Dates
            </h3>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="date"
              value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex justify-between mt-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                onClick={() => setShowDateInput(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                onClick={checkAvailability}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
