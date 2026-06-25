"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import Calendar from "react-calendar";
import { Alert, Snackbar } from "@mui/material";
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
  return Array.isArray(amenities) ? amenities.filter(Boolean) : [];
}

function getRoomLabelKey(type = "") {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("pool")) {
    return "poolView";
  }
  if (normalized.includes("standard")) {
    return "idealForCouples";
  }
  if (normalized.includes("3-room") || normalized.includes("3-rooms")) {
    return "familyStay";
  }
  if (normalized.includes("2-room") || normalized.includes("2-rooms")) {
    return "extraSpace";
  }
  if (normalized.includes("apartment")) {
    return "flexibleStay";
  }

  return "";
}

function getRoomCategory(type = "") {
  const normalized = String(type).toLowerCase();
  return normalized.includes("apartment") ? "apartment" : "hotel";
}

export default function RoomsPage() {
  const t = useTranslations("rooms");
  usePageTitle(t("metaTitle"));

  const [roomTypes, setRoomTypes] = useState([]);
  const [roomCategory, setRoomCategory] = useState("all");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: session } = useSession();

  const [bookedDays, setBookedDays] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [amenitiesRoom, setAmenitiesRoom] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  const router = useRouter();
  const { setBooking } = useBooking();

  const todayStr = fYMD(new Date());

  const showToast = (message, severity = "warning") => {
    setToast({ open: true, message, severity });
  };

  const showAllAmenitiesLabel =
    typeof t.has === "function" && t.has("showAllAmenities")
      ? t("showAllAmenities")
      : "Shfaq te gjitha";
  const roomFilterLabels = {
    all:
      typeof t.has === "function" && t.has("filters.all")
        ? t("filters.all")
        : "Te gjitha",
    apartment:
      typeof t.has === "function" && t.has("filters.apartment")
        ? t("filters.apartment")
        : "Apartmente",
    hotel:
      typeof t.has === "function" && t.has("filters.hotel")
        ? t("filters.hotel")
        : "Dhoma hoteli",
  };

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoadingRooms(true);
        const response = await fetch("/api/rooms-type");
        const data = await response.json();
        if (!response.ok) {
          showToast(data?.error || t("alerts.loadFailed"), "error");
          setRoomTypes([]);
          return;
        }
        setRoomTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        showToast(t("alerts.loadFailed"), "error");
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
      showToast(t("alerts.selectDates"));
      return;
    }
    if (startDate === endDate) {
      showToast(t("alerts.minimumNight"));
      return;
    }
    const res = await fetch(
      `/api/reservation?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
    );
    const data = await res.json();

    if (!data.available) {
      showToast(t("alerts.notAvailable"));
      return;
    }

    if (!session?.user) {
      const bookingDraft = { room: selectedRoom, startDate, endDate };
      setBooking(bookingDraft);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "postLoginRedirect",
          JSON.stringify({
            destination: `/checkoutBooking?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
            booking: bookingDraft,
          }),
        );
      }
      showToast(t("alerts.loginFirst"), "info");
      router.push("/login");
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

  const openGallery = (room, index = 0) => {
    setGalleryRoom(room);
    setGalleryIndex(index);
  };

  const galleryImages = Array.isArray(galleryRoom?.images)
    ? galleryRoom.images
    : [];
  const currentGalleryImage =
    galleryImages[galleryIndex] || galleryImages[0] || null;

  const showPreviousImage = () => {
    if (galleryImages.length <= 1) return;
    setGalleryIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1,
    );
  };

  const showNextImage = () => {
    if (galleryImages.length <= 1) return;
    setGalleryIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1,
    );
  };

  const sortedRoomTypes = [...roomTypes].sort((a, b) => {
    const categoryOrder = { apartment: 0, hotel: 1 };
    const categoryDiff =
      categoryOrder[getRoomCategory(a.type)] -
      categoryOrder[getRoomCategory(b.type)];

    if (categoryDiff !== 0) return categoryDiff;

    return String(a.name || a.type).localeCompare(String(b.name || b.type));
  });

  const visibleRoomTypes = sortedRoomTypes.filter((room) => {
    if (roomCategory === "all") return true;
    return getRoomCategory(room.type) === roomCategory;
  });

  return (
    <div className="public-page min-h-screen">
      <PublicSection className="!pt-4 !pb-0">
        <PublicContainer>
          <div className="mb-3 flex flex-col gap-4 md:mt-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[1.9rem] font-semibold leading-tight text-slate-900 md:text-[2.4rem]">
              {t("title")}
            </h2>
            <div className="flex md:justify-end">
              <div className="inline-flex w-full max-w-[430px] items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur md:w-auto md:max-w-none md:gap-2 md:p-2">
              {["all", "apartment", "hotel"].map((category) => {
                const isActive = roomCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setRoomCategory(category)}
                    className={`inline-flex min-w-0 shrink-0 flex-1 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-2 text-[0.88rem] font-semibold transition duration-200 md:min-w-[112px] md:flex-none md:px-4 md:py-2.5 md:text-sm ${
                      isActive
                        ? "bg-[#1f6feb] text-white shadow-[0_12px_28px_rgba(31,111,235,0.26)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {roomFilterLabels[category]}
                  </button>
                );
              })}
              </div>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection className="!pt-0 pb-16">
        <PublicContainer>
          {loadingRooms ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <PublicCard
                  key={i}
                  className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-0 animate-pulse"
                >
                  <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="h-[300px] bg-slate-200 md:h-[360px]" />
                    <div className="p-6 md:p-8">
                      <div className="h-3 w-24 rounded-full bg-slate-100" />
                      <div className="mt-5 h-8 w-2/3 rounded bg-slate-200" />
                      <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
                      <div className="mt-6 flex gap-2">
                        <div className="h-8 w-24 rounded-full bg-slate-100" />
                        <div className="h-8 w-20 rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-8 flex items-center justify-between">
                        <div className="h-8 w-28 rounded bg-slate-200" />
                        <div className="h-11 w-32 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>
                </PublicCard>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {visibleRoomTypes.map((room, index) => {
                const reverse = index % 2 === 1;
                const previewImages = Array.isArray(room.images)
                  ? room.images.slice(1, 3)
                  : [];
                const roomLabelKey = getRoomLabelKey(room.type);
                const amenities = getFeatureChips(room.amenities);
                const visibleAmenities = amenities.slice(0, 4);

                return (
                <PublicCard
                  key={room.type}
                  className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-0 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(15,23,42,0.1)]"
                >
                  <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
                    <div
                      className={`relative min-h-[320px] overflow-hidden bg-slate-100 md:min-h-[420px] ${
                        reverse ? "lg:order-2" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="absolute inset-0 h-full w-full cursor-pointer"
                        onClick={() => openGallery(room, 0)}
                      >
                        <img
                          src={room.images?.[0]}
                          alt={room.name}
                          className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                        />
                      </button>

                      {previewImages.length > 0 ? (
                        <div className="absolute bottom-4 left-4 right-4 hidden gap-3 md:grid md:grid-cols-2">
                          {previewImages.map((image, imageIndex) => (
                            <button
                              key={`${room.type}-${imageIndex + 1}`}
                              type="button"
                              className="overflow-hidden rounded-2xl border border-white/55 bg-white/20 backdrop-blur-sm"
                              onClick={() => openGallery(room, imageIndex + 1)}
                            >
                              <img
                                src={image}
                                alt={`${room.name} preview ${imageIndex + 2}`}
                                className="h-24 w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`flex flex-col justify-between p-6 md:p-8 lg:p-10 ${
                        reverse ? "lg:order-1" : ""
                      }`}
                    >
                      <div>
                        {roomLabelKey ? (
                          <span className="inline-flex rounded-full bg-[#e8f1ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f6feb]">
                            {t(`labels.${roomLabelKey}`)}
                          </span>
                        ) : null}
                        <h3 className="mt-4 text-[1.7rem] font-semibold leading-tight text-slate-900 md:text-[2.1rem]">
                          {room.name}
                        </h3>
                        <p className="mt-4 max-w-xl text-[15px] leading-8 text-slate-600 md:text-base">
                          {room.description || getFirstLine(room.description)}
                        </p>

                        <div className="mt-5">
                          <div className="flex flex-wrap gap-2.5">
                            {visibleAmenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                          {amenities.length > 4 ? (
                            <button
                              type="button"
                              className="mt-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1f6feb] transition hover:border-[#bfdbfe] hover:bg-[#eff6ff]"
                              onClick={() => setAmenitiesRoom(room)}
                            >
                              {showAllAmenitiesLabel}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200/80 pt-5">
                        <div>
                          <div>
                            <span className="text-[1.85rem] font-semibold leading-none text-slate-900 md:text-[2.2rem]">
                              €{Number(room.price || 0).toFixed(0)}
                            </span>
                            <span className="ml-2 text-sm text-slate-500">
                              / {t("night")}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-[#1f6feb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#195fd0] sm:min-w-[160px] sm:px-5"
                            onClick={() => handleBookClick(room)}
                          >
                            {t("buttons.bookNow")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </PublicCard>
                );
              })}
            </div>
          )}
        </PublicContainer>
      </PublicSection>

      {showDateInput && selectedRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-3">
          <div className="public-card p-4 md:p-6 w-full max-w-[420px]">
            <h3 className="text-lg font-semibold text-center">
              {t("selectDates")}
            </h3>

            <Calendar
              selectRange={true}
              allowPartialRange={true}
              minDate={new Date()}
              onChange={(range) => {
                if (Array.isArray(range)) {
                  setStartDate(range[0] ? fYMD(range[0]) : "");
                  setEndDate(range[1] ? fYMD(range[1]) : "");
                  return;
                }
                setStartDate(range ? fYMD(range) : "");
                setEndDate("");
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

      {amenitiesRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onClick={() => setAmenitiesRoom(null)}
        >
          <div
            className="public-card relative max-h-[82vh] w-full max-w-lg overflow-y-auto p-5 pr-12 md:p-6 md:pr-14"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 md:right-4 md:top-4"
              onClick={() => setAmenitiesRoom(null)}
              aria-label={t("buttons.close")}
            >
              X
            </button>
            <h2 className="text-xl font-semibold mb-4">{amenitiesRoom.name}</h2>
            <div className="flex flex-wrap gap-2.5">
              {(Array.isArray(amenitiesRoom.amenities)
                ? amenitiesRoom.amenities
                : []
              ).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {galleryRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24"
          onClick={() => setGalleryRoom(null)}
        >
          <div
            className="relative mx-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/62 text-xl font-semibold text-white shadow-lg transition hover:bg-black/78"
              onClick={() => setGalleryRoom(null)}
              aria-label={t("buttons.close")}
            >
              X
            </button>

            {currentGalleryImage ? (
              <div className="relative flex max-h-[78vh] w-[92vw] items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.35)] md:h-[75vh] md:w-[min(70vw,760px)]">
                <img
                  src={currentGalleryImage}
                  alt={`${galleryRoom.name} ${galleryIndex + 1}`}
                  className="relative z-10 max-h-[78vh] w-full object-contain md:h-full md:max-h-none md:w-full md:object-cover"
                />
                {galleryImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/72 md:left-4 md:h-12 md:w-12"
                      onClick={showPreviousImage}
                      aria-label="Previous image"
                    >
                      {"<"}
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-3xl text-white shadow-lg transition hover:bg-black/72 md:right-4 md:h-12 md:w-12"
                      onClick={showNextImage}
                      aria-label="Next image"
                    >
                      {">"}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
