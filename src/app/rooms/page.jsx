"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import usePageTitle from "../hooks/usePageTitle";

function fYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getFeatureChips(amenities = []) {
  return Array.isArray(amenities) ? amenities.filter(Boolean).slice(0, 3) : [];
}

export default function RoomsPage() {
  const t = useTranslations("rooms");
  usePageTitle(t("metaTitle"));

  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
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
      try {
        setLoadingRooms(true);
        const response = await fetch("/api/rooms-type");
        const data = await response.json();
        setRoomTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        setRoomTypes([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedDraft = localStorage.getItem("homeSearchDraft");
    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft);
      if (draft?.startDate) setStartDate(draft.startDate);
      if (draft?.endDate) setEndDate(draft.endDate);
    } catch {
      // Ignore malformed draft data from the home page widget.
    } finally {
      localStorage.removeItem("homeSearchDraft");
    }
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
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      alert(t("alerts.selectDates"));
      return;
    }
    if (startDate === endDate) {
      alert(t("alerts.minimumNight"));
      return;
    }
    if (!session?.user) {
      alert(t("alerts.loginFirst"));
      router.push("/login");
      return;
    }
    const res = await fetch(
      `/api/reservation?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
    );
    const data = await res.json();

    if (!data.available) {
      alert(t("alerts.notAvailable"));
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
      <PublicSection className="!pt-4 !pb-0">
        <PublicContainer>
          <div className="text-center max-w-2xl mx-auto mb-2">
            <h2 className="text-3xl md:text-4xl font-semibold mt-3">
              {t("title")}
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              {t("subtitle")}
            </p>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="!pt-0 pb-16">
        <PublicContainer>
          {loadingRooms ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <PublicCard key={i} className="overflow-hidden animate-pulse">
                  <div className="h-56 w-full bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-5/6 rounded bg-slate-100" />
                    <div className="h-9 w-28 rounded bg-slate-200 mt-4" />
                  </div>
                </PublicCard>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {roomTypes.map((room) => (
                <PublicCard
                  key={room.type}
                  className="overflow-hidden flex flex-col rounded-[22px] border border-slate-200/80 bg-white p-0 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)]"
                >
                  <button
                    type="button"
                    className="relative h-56 w-full cursor-pointer overflow-hidden text-left"
                    onClick={() => setGalleryRoom(room)}
                  >
                    <img
                      src={room.images?.[0]}
                      alt={room.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm">
                      {room.type}
                    </span>
                  </button>

                  <div className="flex flex-grow flex-col p-5">
                    <div>
                      <h3 className="text-[1.65rem] font-semibold leading-tight text-slate-900">
                        {room.name}
                      </h3>
                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500 line-clamp-2">
                        {getFirstLine(room.description)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {getFeatureChips(room.amenities).map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <span className="text-[1.6rem] font-semibold leading-none text-slate-900">
                          €{Number(room.price || 0).toFixed(0)}
                        </span>
                        <span className="ml-1 text-sm text-slate-500">
                          / {t("night")}
                        </span>
                      </div>

                      <button
                        className="inline-flex items-center justify-center rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#195fd0]"
                        onClick={() => handleBookClick(room)}
                      >
                        {t("buttons.bookNow")}
                      </button>
                    </div>
                  </div>
                </PublicCard>
              ))}
            </div>
          )}
        </PublicContainer>
      </PublicSection>

      {showDateInput && selectedRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-3">
          <div className="public-card p-4 md:p-6 w-full max-w-[420px]">
            <h3 className="text-lg font-semibold text-center">{t("selectDates")}</h3>

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
                className="public-button ghost cursor-pointer "
                onClick={() => {
                  setShowDateInput(false);
                  setSelectedRoom(null);
                }}
              >
                {t("buttons.cancel")}
              </button>

              <button
                className={`public-button primary cursor-pointer  ${
                  !startDate || !endDate ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={checkAvailability}
                disabled={!startDate || !endDate}
              >
                {t("buttons.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <div className="public-card p-5 md:p-6 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-slate-500 cursor-pointer "
              onClick={() => setExpandedRoom(null)}
            >
              {t("buttons.close")}
            </button>

            <h2 className="text-xl font-semibold mb-4">{expandedRoom.name}</h2>

            <p className="text-slate-600 text-sm">{expandedRoom.description}</p>

            {Array.isArray(expandedRoom.amenities) &&
            expandedRoom.amenities.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {expandedRoom.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {galleryRoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl px-3 md:px-4">
            <button
              className="absolute -top-10 right-0 text-white text-2xl cursor-pointer "
              onClick={() => setGalleryRoom(null)}
            >
              {t("buttons.close")}
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
