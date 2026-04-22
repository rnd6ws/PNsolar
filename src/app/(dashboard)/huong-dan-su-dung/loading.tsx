export default function HuongDanSuDungLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-7 w-56 rounded-lg bg-muted animate-pulse" />
                            <div className="h-4 w-80 rounded-lg bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="h-14 w-full max-w-md rounded-2xl bg-muted animate-pulse" />
                </div>

                <div className="flex gap-3">
                    <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="h-[72vh] min-h-[620px] w-full bg-muted animate-pulse" />
            </div>
        </div>
    );
}
