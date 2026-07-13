import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, KpiCardSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  );
}
