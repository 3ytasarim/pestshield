import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-9 w-36 rounded-lg" />
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="size-9 rounded-xl" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-1 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3.5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
      <div className="flex flex-col divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 rounded-md"
                style={{ width: colIndex === 0 ? "35%" : `${100 / columns / 1.5}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
