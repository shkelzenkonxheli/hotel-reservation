"use client";
import { useState, useEffect } from "react";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

export default function RoomDetailsDialog({
  room,
  t,
  capacityLabel,
  onClose,
  onBook,
}) {
  const images = Array.isArray(room?.images) ? room.images : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [room]);

  if (!room) return null;

  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const mainImage = images[activeIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="surface relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl md:max-h-[88vh] md:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-[var(--ink)] shadow-md transition hover:bg-white"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          X
        </button>

        <div className="overflow-y-auto pb-24 md:pb-0">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="media relative h-[260px] w-full overflow-hidden bg-slate-100 md:h-[420px]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={room.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              {images.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto p-3 md:p-4">
                  {images.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        index === activeIndex
                          ? "border-[var(--brass)]"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={t("gallery.thumbAlt")}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="px-5 pb-6 pt-2 md:px-8 md:pb-8">
                <h2 className="display text-[1.7rem] leading-tight text-[var(--ink)] md:text-[2.1rem]">
                  {room.name}
                </h2>
                {room.max_guests ? (
                  <span className="badge badge-glass mt-3 inline-flex !gap-1.5">
                    <GroupOutlinedIcon sx={{ fontSize: 15 }} />
                    {capacityLabel(room.max_guests)}
                  </span>
                ) : null}
                <p className="mt-4 text-[15px] leading-8 text-[var(--public-muted)]">
                  {room.description}
                </p>

                {amenities.length > 0 ? (
                  <div className="mt-6">
                    <p className="sec-head sec-title !text-base">
                      {t("details.amenitiesTitle")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {amenities.map((amenity) => (
                        <span key={amenity} className="amenity">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="divider-soft mt-6" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--public-muted)]">
                  {t("details.importantInfo")}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--public-muted)]">
                  {t("details.importantInfoText")}
                </p>
              </div>
            </div>

            <div className="hidden border-l border-[var(--public-border)] bg-[var(--sand)]/60 p-8 md:block">
              <div className="sticky top-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--public-muted)]">
                  {t("details.priceFrom")}
                </p>
                <div className="price-line mt-2">
                  {room.has_discount ? (
                    <div className="flex flex-col gap-1">
                      <span className="price-old">
                        €{Number(room.original_price || room.price || 0).toFixed(0)}
                      </span>
                      <span>
                        <span className="price-value">
                          €{Number(room.effective_price || room.price || 0).toFixed(0)}
                        </span>
                        <span className="price-unit"> / {t("night")}</span>
                      </span>
                    </div>
                  ) : (
                    <span>
                      <span className="price-value">
                        €{Number(room.price || 0).toFixed(0)}
                      </span>
                      <span className="price-unit"> / {t("night")}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg mt-6"
                  onClick={() => onBook(room)}
                >
                  {t("buttons.bookNow")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-raised fixed inset-x-0 bottom-0 flex items-center justify-between gap-4 border-t border-[var(--public-border)] p-4 md:hidden">
          <div className="price-line">
            <span className="price-value">
              €{Number(room.effective_price || room.price || 0).toFixed(0)}
            </span>
            <span className="price-unit"> / {t("night")}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary min-h-[48px] flex-1"
            onClick={() => onBook(room)}
          >
            {t("buttons.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
