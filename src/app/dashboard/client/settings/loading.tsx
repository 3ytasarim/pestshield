import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}
