import { Skeleton } from "@/components/ui/skeleton";
import { KpiCardSkeleton } from "@/components/shared/skeletons";

export default function ClientDashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
