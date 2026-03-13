// src/app/(dashboard)/loading.tsx
// Loading skeleton chung cho tất cả trang dashboard
export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            {/* Header skeleton */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
                        <div className="h-4 w-96 bg-muted rounded-lg animate-pulse mt-2" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    <div className="h-7 w-12 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content card skeleton */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mt-2">
                {/* Search bar skeleton */}
                <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="h-10 flex-1 max-w-sm bg-muted rounded-lg animate-pulse" />
                    <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
                </div>

                {/* Table skeleton */}
                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4">
                            <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-20 bg-muted rounded animate-pulse hidden md:block" />
                            <div className="h-4 w-20 bg-muted rounded animate-pulse hidden md:block" />
                            <div className="h-6 w-16 bg-muted rounded-full animate-pulse hidden md:block" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
