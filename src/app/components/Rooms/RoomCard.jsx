"use client";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

export default function RoomCard({
  room,
  reverse,
  roomLabel,
  amenities,
  capacityLabel,
  showAllAmenitiesLabel,
  t,
  onOpenGallery,
  onShowAmenities,
  onViewDetails,
  onBook,
}) {
  const previewImages = Array.isArray(room.images) ? room.images.slice(1, 3) : [];
  const visibleAmenities = amenities.slice(0, 4);

  return (
    <div className="card-lux hover-lift overflow-hidden p-0">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div
          className={`media relative min-h-[280px] overflow-hidden bg-slate-100 md:min-h-[420px] ${
            reverse ? "lg:order-2" : ""
          }`}
        >
          <button
            type="button"
            className="media-zoom absolute inset-0 h-full w-full cursor-pointer"
            onClick={() => onOpenGallery(room, 0)}
          >
            <img
              src={room.images?.[0]}
              alt={room.name}
              className="img-zoom h-full w-full object-cover"
            />
            <div className="media-shade" />
          </button>

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            {room.has_discount ? (
              <span className="badge badge-brass pointer-events-auto">
                {t("labels.specialRate") || "Special rate"}
              </span>
            ) : null}
          </div>

          {previewImages.length > 0 ? (
            <div className="absolute bottom-4 left-4 right-4 hidden gap-3 md:grid md:grid-cols-2">
              {previewImages.map((image, imageIndex) => (
                <button
                  key={`${room.type}-${imageIndex + 1}`}
                  type="button"
                  className="media-zoom overflow-hidden rounded-2xl border border-white/55 bg-white/20 backdrop-blur-sm"
                  onClick={() => onOpenGallery(room, imageIndex + 1)}
                >
                  <img
                    src={image}
                    alt={`${room.name} preview ${imageIndex + 2}`}
                    className="img-zoom h-24 w-full object-cover"
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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {roomLabel ? <span className="badge badge-ink">{roomLabel}</span> : null}
                <h3 className="display mt-4 text-[1.9rem] leading-tight text-[var(--ink)] md:text-[2.4rem]">
                  {room.name}
                </h3>
              </div>
              {room.max_guests ? (
                <span className="badge badge-glass shrink-0 !gap-1.5 whitespace-nowrap">
                  <GroupOutlinedIcon sx={{ fontSize: 15 }} />
                  {capacityLabel(room.max_guests)}
                </span>
              ) : null}
            </div>

            <p className="mt-4 max-w-xl text-[15px] leading-8 text-[var(--public-muted)] md:text-base">
              {room.description}
            </p>

            <div className="mt-5">
              <div className="flex flex-wrap gap-2.5">
                {visibleAmenities.map((amenity) => (
                  <span key={amenity} className="amenity">
                    {amenity}
                  </span>
                ))}
              </div>
              {amenities.length > 4 ? (
                <button
                  type="button"
                  className="btn btn-quiet btn-sm mt-2"
                  onClick={() => onShowAmenities(room)}
                >
                  {showAllAmenitiesLabel}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-[var(--public-border)] pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="price-line">
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
                  <span className="price-value">€{Number(room.price || 0).toFixed(0)}</span>
                  <span className="price-unit"> / {t("night")}</span>
                </span>
              )}
            </div>

            <div className="flex shrink-0 gap-2.5">
              <button
                type="button"
                className="btn btn-outline btn-sm min-h-[48px] flex-1 sm:flex-none"
                onClick={() => onViewDetails(room)}
              >
                {t("buttons.viewDetails")}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm min-h-[48px] min-w-[132px] flex-1 sm:flex-none"
                onClick={() => onBook(room)}
              >
                {t("buttons.bookNow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
