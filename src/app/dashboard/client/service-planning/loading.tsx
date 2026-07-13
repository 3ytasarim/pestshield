import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, KpiCardSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-9 w-72 rounded-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
