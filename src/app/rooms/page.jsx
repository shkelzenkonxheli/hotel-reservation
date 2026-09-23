"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import Calendar from "react-calendar";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";
import "react-calendar/dist/Calendar.css";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import RoomsHero from "../components/Rooms/RoomsHero";
import RoomsFilterBar from "../components/Rooms/RoomsFilterBar";
import RoomCard from "../components/Rooms/RoomCard";
import RoomCardSkeleton from "../components/Rooms/RoomCardSkeleton";
import RoomsEmptyState from "../components/Rooms/RoomsEmptyState";
import RoomDetailsDialog from "../components/Rooms/RoomDetailsDialog";
import AmenitiesDialog from "../components/Rooms/AmenitiesDialog";
import RoomsSearchParamsBridge from "../components/Rooms/RoomsSearchParamsBridge";
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
  const [guests, setGuests] = useState("");

  const { data: session } = useSession();

  const [bookedDays, setBookedDays] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [amenitiesRoom, setAmenitiesRoom] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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
  const datesLabel =
    typeof t.has === "function" && t.has("dates.label")
      ? t("dates.label")
      : "Dates";
  const datesPlaceholder =
    typeof t.has === "function" && t.has("dates.placeholder")
      ? t("dates.placeholder")
      : "Add dates";
  const guestsLabel =
    typeof t.has === "function" && t.has("dates.guestsLabel")
      ? t("dates.guestsLabel")
      : "Guests";
  const emptyTitle =
    typeof t.has === "function" && t.has("empty.title")
      ? t("empty.title")
      : "No rooms match your filters";
  const emptySubtitle =
    typeof t.has === "function" && t.has("empty.subtitle")
      ? t("empty.subtitle")
      : "Try a different room type.";
  const capacityLabel =
    typeof t.has === "function" && t.has("capacity")
      ? (count) => t("capacity", { count })
      : (count) => `Max ${count}`;

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
  }, [t]);

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

  const handleSearchParams = ({ checkIn, checkOut, guests: guestsParam }) => {
    if (checkIn) setStartDate(checkIn);
    if (checkOut) setEndDate(checkOut);
    if (guestsParam) setGuests(guestsParam);
  };

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
    const [availabilityRes, pricingRes] = await Promise.all([
      fetch(
        `/api/reservation?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
      ),
      fetch(
        `/api/rooms-type?start_date=${startDate}&end_date=${endDate}`,
      ),
    ]);
    const data = await availabilityRes.json();
    const pricingData = await pricingRes.json();

    if (!data.available) {
      showToast(t("alerts.notAvailable"));
      return;
    }

    const refreshedRoom =
      (Array.isArray(pricingData)
        ? pricingData.find((room) => room.type === selectedRoom.type)
        : null) || selectedRoom;

    if (selectedRoom.has_discount && !refreshedRoom.has_discount) {
      showToast(t("alerts.discountNotAvailableForDates"), "info");
    }

    const bookingDraft = { room: refreshedRoom, startDate, endDate };
    setBooking(bookingDraft);

    if (!session?.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "postLoginRedirect",
          JSON.stringify({
            destination: `/checkoutBooking?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
            booking: bookingDraft,
          }),
        );
      }
      setShowLoginPrompt(true);
      return;
    }

    router.push(
      `/checkoutBooking?room_type=${selectedRoom.type}&start_date=${startDate}&end_date=${endDate}`,
    );
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

  const sectionLabel = (key, fallback) =>
    typeof t.has === "function" && t.has(`sections.${key}`)
      ? t(`sections.${key}`)
      : fallback;
  const countLabelFor = (count) =>
    typeof t.has === "function" && t.has("sections.count")
      ? t("sections.count", { count })
      : `${count}`;
  const roomSections = [
    {
      key: "apartment",
      title: sectionLabel("apartmentsTitle", "Apartamentet"),
      eyebrow: sectionLabel("apartmentsEyebrow", "Per familje e grupe"),
    },
    {
      key: "hotel",
      title: sectionLabel("hotelRoomsTitle", "Dhoma e hotelit"),
      eyebrow: sectionLabel("hotelRoomsEyebrow", "Per cifte e qendrim te qete"),
    },
  ]
    .map((meta) => ({
      ...meta,
      rooms: visibleRoomTypes.filter(
        (room) => getRoomCategory(room.type) === meta.key,
      ),
      countLabel: countLabelFor(
        visibleRoomTypes.filter(
          (room) => getRoomCategory(room.type) === meta.key,
        ).length,
      ),
    }))
    .filter((section) => section.rooms.length > 0);

  return (
    <div className="public-page min-h-screen bg-[var(--sand)]">
      <Suspense fallback={null}>
        <RoomsSearchParamsBridge onParams={handleSearchParams} />
      </Suspense>

      <PublicSection className="!py-8 md:!py-10">
        <PublicContainer>
          <RoomsHero t={t} />
        </PublicContainer>
      </PublicSection>

      <PublicSection className="!py-0">
        <PublicContainer>
          <RoomsFilterBar
            roomCategory={roomCategory}
            setRoomCategory={setRoomCategory}
            roomFilterLabels={roomFilterLabels}
            startDate={startDate}
            endDate={endDate}
            guests={guests}
            datesLabel={datesLabel}
            guestsLabel={guestsLabel}
            datesPlaceholder={datesPlaceholder}
          />
        </PublicContainer>
      </PublicSection>

      <PublicSection className="!pb-16 !pt-8 md:!pb-24 md:!pt-10">
        <PublicContainer>
          {loadingRooms ? (
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleRoomTypes.length === 0 ? (
            <RoomsEmptyState
              title={emptyTitle}
              subtitle={emptySubtitle}
              actionLabel={roomFilterLabels.all}
              onAction={
                roomCategory !== "all" ? () => setRoomCategory("all") : undefined
              }
            />
          ) : (
            <div className="space-y-12 md:space-y-16">
              {roomSections.map((section) => (
                <section key={section.key}>
                  <div className="mb-6 flex items-end gap-5 md:mb-8 md:gap-7">
                    <div className="shrink-0">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
                        {section.eyebrow}
                      </span>
                      <h2 className="display mt-2 text-[1.7rem] leading-tight text-[var(--ink)] md:text-[2.1rem]">
                        {section.title}
                      </h2>
                    </div>
                    <div className="divider-soft mb-2 hidden flex-1 md:block" />
                    <span className="badge badge-ink mb-1 hidden shrink-0 sm:inline-flex">
                      {section.countLabel}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                    {section.rooms.map((room) => {
                      const roomLabelKey = getRoomLabelKey(room.type);
                      const amenities = getFeatureChips(room.amenities);

                      return (
                        <RoomCard
                          key={room.type}
                          room={room}
                          roomLabel={roomLabelKey ? t(`labels.${roomLabelKey}`) : ""}
                          amenities={amenities}
                          capacityLabel={capacityLabel}
                          showAllAmenitiesLabel={showAllAmenitiesLabel}
                          t={t}
                          onOpenGallery={openGallery}
                          onShowAmenities={setAmenitiesRoom}
                          onViewDetails={setExpandedRoom}
                          onBook={handleBookClick}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
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

      <Dialog
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("loginPrompt.title")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("loginPrompt.description")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setShowLoginPrompt(false)}>
            {t("loginPrompt.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowLoginPrompt(false);
              router.push("/login");
            }}
          >
            {t("loginPrompt.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <RoomDetailsDialog
        room={expandedRoom}
        t={t}
        capacityLabel={capacityLabel}
        onClose={() => setExpandedRoom(null)}
        onBook={(room) => {
          setExpandedRoom(null);
          handleBookClick(room);
        }}
      />

      <AmenitiesDialog
        room={amenitiesRoom}
        t={t}
        onClose={() => setAmenitiesRoom(null)}
      />

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

