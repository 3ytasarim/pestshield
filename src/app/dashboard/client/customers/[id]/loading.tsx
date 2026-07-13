import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/shared/skeletons";

export default function CustomerDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-2 border-b border-border/60 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}
