export default function Loading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
                        <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
                    </div>
                    <div className="h-9 w-36 bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="h-3.5 w-20 bg-muted rounded animate-pulse" />
                                <div className="h-6 w-10 bg-muted rounded animate-pulse mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
                <div className="p-5 flex items-center gap-3 border-b">
                    <div className="h-9 flex-1 max-w-[400px] bg-muted rounded-lg animate-pulse" />
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse" />
                        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
                        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                            <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                            <div className="h-6 w-20 bg-muted rounded-full animate-pulse hidden md:block" />
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
