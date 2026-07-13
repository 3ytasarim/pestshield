import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, KpiCardSkeleton } from "@/components/shared/skeletons";

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <Skeleton className="h-9 w-64 rounded-lg" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
