"use client";

export default function RoomsFilterBar({
  roomCategory,
  setRoomCategory,
  roomFilterLabels,
  startDate,
  endDate,
  guests,
  datesLabel,
  guestsLabel,
  datesPlaceholder,
}) {
  const dateText =
    startDate && endDate ? `${startDate} \u2192 ${endDate}` : datesPlaceholder;

  return (
    <div className="sticky top-[64px] z-30 -mx-4 border-b border-[var(--public-border)]/70 bg-[var(--sand)]/92 px-4 py-3 backdrop-blur md:top-[72px] md:mx-0 md:rounded-2xl md:border md:px-4 md:py-3.5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          {["all", "apartment", "hotel"].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setRoomCategory(category)}
              className={`chip shrink-0 !min-h-[44px] ${
                roomCategory === category ? "active" : ""
              }`}
            >
              {roomFilterLabels[category]}
            </button>
          ))}
        </div>

        {(startDate && endDate) || guests ? (
          <div className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-full border border-[var(--public-border)] bg-white/70 px-4 py-2 text-sm md:w-auto md:min-w-[280px]">
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--public-muted)]">
                {datesLabel}
              </span>
              <span className="font-medium text-[var(--ink)]">{dateText}</span>
            </span>
            {guests ? (
              <span className="badge badge-brass shrink-0">
                {guestsLabel}: {guests}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
