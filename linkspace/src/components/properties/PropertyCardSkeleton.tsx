export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] w-full bg-muted"></div>
      <div className="flex flex-col flex-1 p-4">
        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
        
        <div className="flex items-center mb-3">
          <div className="h-4 bg-muted rounded w-4 mr-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4 mt-auto">
          <div className="h-5 bg-muted rounded-full w-16"></div>
          <div className="h-5 bg-muted rounded-full w-12"></div>
          <div className="h-5 bg-muted rounded-full w-20"></div>
        </div>
        
        <div className="mt-auto pt-4 border-t flex items-baseline gap-1">
          <div className="h-7 bg-muted rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}
