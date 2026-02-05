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
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import { useSession } from "next-auth/react";

function fYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: session } = useSession();

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
    if (!selectedRoom) return;

    async function loadAvailability() {
      const res = await fetch(
        `/api/availability?room_type=${selectedRoom.type}`,
      );
      const data = await res.json();

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
    if (!session?.user) {
      router.push("/login");
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
    <div className="public-page min-h-screen">
      <PublicSection className="pt-12">
        <PublicContainer>
          <div className="text-center max-w-2xl mx-auto">
            <p className="public-badge">Dijari Premium</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3">
              Available room types
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              Choose the space that matches your stay. Confirm your dates and
              book in minutes.
            </p>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="pt-2 pb-16">
        <PublicContainer>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {roomTypes.map((room) => (
              <PublicCard
                key={room.type}
                className="overflow-hidden flex flex-col transition duration-200 hover:-translate-y-1"
              >
                <div className="relative h-56 w-full">
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
                    <h3 className="text-lg font-semibold text-slate-900">
                      {room.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                      {getFirstLine(room.description)}
                    </p>
                    <button
                      className="text-slate-700 text-sm mt-2 underline underline-offset-4 w-fit"
                      onClick={() => setExpandedRoom(room)}
                    >
                      View details
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-5">
                    <span className="text-slate-900 font-semibold text-sm">
                      EUR {Number(room.price || 0).toFixed(2)} / night
                    </span>

                    <button
                      className="public-button primary text-sm px-4 py-2"
                      onClick={() => handleBookClick(room)}
                    >
                      Book now
                    </button>
                  </div>
                </div>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      {showDateInput && selectedRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="public-card p-6 w-[360px]">
            <h3 className="text-lg font-semibold text-center">Select dates</h3>

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
                className="public-button ghost"
                onClick={() => {
                  setShowDateInput(false);
                  setSelectedRoom(null);
                }}
              >
                Cancel
              </button>

              <button
                className={`public-button primary ${
                  !startDate || !endDate ? "opacity-60 cursor-not-allowed" : ""
                }`}
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
          <div className="public-card p-6 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-slate-500"
              onClick={() => setExpandedRoom(null)}
            >
              X
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {expandedRoom.name}
            </h2>

            <p className="text-slate-600 text-sm whitespace-pre-line">
              {expandedRoom.description}
            </p>
          </div>
        </div>
      )}

      {galleryRoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl px-4">
            <button
              className="absolute -top-10 right-0 text-white text-2xl"
              onClick={() => setGalleryRoom(null)}
            >
              X
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
