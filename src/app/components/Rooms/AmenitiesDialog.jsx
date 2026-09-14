export default function AmenitiesDialog({ room, t, onClose }) {
  if (!room) return null;
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3"
      onClick={onClose}
    >
      <div
        className="surface relative max-h-[82vh] w-full max-w-lg overflow-y-auto p-5 pr-12 md:p-6 md:pr-14"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 md:right-4 md:top-4"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          X
        </button>
        <h2 className="display text-xl text-[var(--ink)]">{room.name}</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {amenities.map((amenity) => (
            <span key={amenity} className="amenity">
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
