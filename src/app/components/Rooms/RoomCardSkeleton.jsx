export default function RoomCardSkeleton() {
  return (
    <div className="card-lux overflow-hidden p-0">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="skeleton h-[280px] w-full rounded-none md:h-[380px]" />
        <div className="p-6 md:p-8 lg:p-10">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton mt-5 h-9 w-2/3 rounded-lg" />
          <div className="skeleton mt-4 h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-5/6 rounded" />
          <div className="mt-6 flex gap-2">
            <div className="skeleton h-8 w-24 rounded-full" />
            <div className="skeleton h-8 w-20 rounded-full" />
            <div className="skeleton h-8 w-16 rounded-full" />
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="skeleton h-9 w-28 rounded-lg" />
            <div className="skeleton h-11 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
