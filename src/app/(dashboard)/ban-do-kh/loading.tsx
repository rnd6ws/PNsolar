export default function BanDoKhachHangLoading() {
    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                    <div>
                        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse mt-1" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Map area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar skeleton */}
                <div className="w-72 border-r border-border bg-card shrink-0 hidden lg:block p-4 space-y-4">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-6 w-full bg-muted rounded animate-pulse" />
                    ))}
                    <div className="h-px bg-border" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-5 w-full bg-muted rounded animate-pulse" />
                    ))}
                </div>

                {/* Map placeholder */}
                <div className="flex-1 bg-muted/30 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
                            <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
                        </div>
                    </div>
                    {/* Fake map grid */}
                    <svg
                        className="absolute inset-0 w-full h-full opacity-10"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#mapgrid)" />
                    </svg>
                </div>

                {/* Right sidebar skeleton */}
                <div className="w-72 border-l border-border bg-card shrink-0 hidden lg:block p-4 space-y-4">
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    <div className="grid grid-cols-2 gap-2.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-px bg-border" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-5 w-full bg-muted rounded animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
