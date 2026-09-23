export default function RoomCardSkeleton() {
  return (
    <div className="card-lux overflow-hidden p-0">
      <div className="skeleton h-[260px] w-full rounded-none md:h-[300px]" />
      <div className="p-6 md:p-7">
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="skeleton mt-4 h-8 w-2/3 rounded-lg" />
        <div className="skeleton mt-4 h-3 w-full rounded" />
        <div className="skeleton mt-2 h-3 w-5/6 rounded" />
        <div className="mt-5 flex gap-2">
          <div className="skeleton h-7 w-20 rounded-full" />
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-7 w-16 rounded-full" />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-[var(--public-border)] pt-5">
          <div className="skeleton h-9 w-24 rounded-lg" />
          <div className="skeleton h-11 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}
