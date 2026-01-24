"use client";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function fYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function strToDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [user, setUser] = useState(null);

  const [bookedDays, setBookedDays] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [galleryRoom, setGalleryRoom] = useState(null);

  const router = useRouter();
  const { setBooking } = useBooking();

  const todayStr = fYMD(new Date());

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
      setUser(await res.json());
    }
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!selectedRoom) return;

    async function loadAvailability() {
      console.log("=== LOADING AVAILABILITY ===");

      const res = await fetch(
        `/api/availability?room_type=${selectedRoom.type}`,
      );
      const data = await res.json();

      console.log("API RESPONSE:", data);

      const dayMap = {};

      data.reservations.forEach((r) => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        if (isNaN(start) || isNaN(end)) return;

        let d = new Date(start);

        while (d < end) {
          const key = fYMD(d);
          if (!dayMap[key]) dayMap[key] = new Set();
          dayMap[key].add(r.room_id);
          d.setDate(d.getDate() + 1);
        }
      });

      const fullDays = Object.entries(dayMap)
        .filter(([_, set]) => set.size >= data.roomCount)
        .map(([day]) => day);

      console.log("FULL DAYS:", fullDays);

      setBookedDays(fullDays);
    }

    loadAvailability();
  }, [selectedRoom]);

  const handleBookClick = (room) => {
    setSelectedRoom(room);
    setShowDateInput(true);
    setStartDate("");
    setEndDate("");
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    if (startDate === endDate) {
      alert("Minimum one night");
      return;
    }
    const res = await fetch(
      `/api/reservation?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
    );
    const data = await res.json();

    if (!data.available) {
      alert("Room is not available for the selected dates.");
      return;
    }

    setBooking({ room: selectedRoom, startDate, endDate });
    router.push(
      `/checkoutBooking?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
    );
  };

  const getFirstLine = (text) => {
    if (!text) return "";
    return text.split("\n")[0];
  };
  return (
    <div
      className="pt-10 px-6 pb-16 min-h-screen"
      style={{ backgroundColor: "#eae1df" }}
    >
      <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
        🏨 Available Room Types
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {roomTypes.map((room) => (
          <div
            key={room.type}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col"
          >
            <div className="relative h-52 w-full">
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full w-full cursor-pointer"
                onClick={() => setGalleryRoom(room)}
              >
                {room.images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <img src={img} className="w-full h-full object-cover" />
                  </SwiperSlide>
                ))}
              </Swiper>

              <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {room.type}
              </span>
            </div>

            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {room.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {getFirstLine(room.description)}
                </p>
                <button
                  className="text-blue-600 text-sm mt-1 underline w-fit cursor-pointer"
                  onClick={() => setExpandedRoom(room)}
                >
                  View more
                </button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-600 font-semibold text-sm">
                  ${room.price}/night
                </span>

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => handleBookClick(room)}
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDateInput && selectedRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[350px]">
            <h3 className="text-lg font-bold text-center">Select Dates</h3>

            <Calendar
              selectRange={true}
              minDate={new Date()}
              onChange={(range) => {
                if (Array.isArray(range)) {
                  setStartDate(fYMD(range[0]));
                  setEndDate(fYMD(range[1]));
                }
              }}
              tileDisabled={({ date }) => {
                const d = fYMD(date);
                return d < todayStr || bookedDays.includes(d);
              }}
              tileClassName={({ date }) => {
                const d = fYMD(date);

                if (d < todayStr) return "disabled-day";

                if (bookedDays.includes(d)) return "booked-day";

                if (startDate && !endDate && d === startDate) {
                  return "start-day";
                }

                if (startDate && endDate) {
                  if (d === startDate) return "start-day";
                  if (d === endDate) return "end-day";

                  if (d > startDate && d < endDate) return "range-day";
                }

                return "available-day";
              }}
            />

            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => {
                  setShowDateInput(false);
                  setSelectedRoom(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={checkAvailability}
                disabled={!startDate || !endDate}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {expandedRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setExpandedRoom(null)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">{expandedRoom.name}</h2>

            <p className="text-gray-700 text-sm whitespace-pre-line">
              {expandedRoom.description}
            </p>
          </div>
        </div>
      )}
      {galleryRoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl px-4">
            <button
              className="absolute -top-10 right-0 text-white text-3xl"
              onClick={() => setGalleryRoom(null)}
            >
              ✕
            </button>

            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="w-full h-[70vh] rounded-lg overflow-hidden"
            >
              {galleryRoom.images.map((img, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={img}
                    className="w-full h-full object-contain bg-black"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}
