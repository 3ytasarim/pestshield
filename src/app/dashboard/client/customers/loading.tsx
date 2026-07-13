import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, KpiCardSkeleton, TableSkeleton } from "@/components/shared/skeletons";

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <TableSkeleton rows={7} columns={7} />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
