"use client";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

export default function RoomCard({
  room,
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
  const visibleAmenities = amenities.slice(0, 3);
  const hasDiscount = Boolean(room.has_discount);

  return (
    <article className="card-lux hover-lift group flex h-full flex-col overflow-hidden p-0">
      <div className="media relative aspect-[4/3] overflow-hidden">
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

        {hasDiscount ? (
          <span className="badge badge-brass pointer-events-auto absolute left-4 top-4">
            {t("labels.specialRate") || "Special rate"}
          </span>
        ) : null}

        {room.max_guests ? (
          <span className="badge badge-glass absolute right-4 top-4 !gap-1.5 whitespace-nowrap">
            <GroupOutlinedIcon sx={{ fontSize: 14 }} />
            {capacityLabel(room.max_guests)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        {roomLabel ? (
          <span className="badge badge-ink self-start">{roomLabel}</span>
        ) : null}

        <h3 className="display mt-3 text-[1.55rem] leading-snug text-[var(--ink)] md:text-[1.75rem]">
          {room.name}
        </h3>

        <p className="mt-3 line-clamp-3 text-[14.5px] leading-7 text-[var(--public-muted)] md:text-[15px]">
          {room.description}
        </p>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {visibleAmenities.map((amenity) => (
              <span key={amenity} className="amenity">
                {amenity}
              </span>
            ))}
          </div>
          {amenities.length > 3 ? (
            <button
              type="button"
              className="btn btn-quiet btn-sm mt-1.5 !min-h-[34px]"
              onClick={() => onShowAmenities(room)}
            >
              {showAllAmenitiesLabel}
            </button>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          <div className="divider-soft mb-5" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="price-line">
              {hasDiscount ? (
                <div className="flex flex-col gap-0.5">
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

            <div className="flex gap-2.5">
              <button
                type="button"
                className="btn btn-outline btn-sm min-h-[44px] flex-1 sm:flex-none"
                onClick={() => onViewDetails(room)}
              >
                {t("buttons.viewDetails")}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm min-h-[44px] min-w-[116px] flex-1 sm:flex-none"
                onClick={() => onBook(room)}
              >
                {t("buttons.bookNow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
