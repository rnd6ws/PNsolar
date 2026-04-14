export default function BaoCaoNhanSuLoading() {
    return (
        <div className="flex flex-col flex-1 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col gap-5 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-2">
                        <div className="h-8 w-52 bg-muted rounded-lg" />
                        <div className="h-4 w-80 bg-muted rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-28 bg-muted rounded-md" />
                        <div className="h-9 w-32 bg-muted rounded-md" />
                        <div className="h-9 w-36 bg-muted rounded-md" />
                        <div className="h-9 w-32 bg-muted rounded-md" />
                    </div>
                </div>

                {/* Stat cards skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl p-4 bg-muted h-[90px]" />
                    ))}
                </div>
            </div>

            {/* Charts skeleton */}
            <div className="flex flex-col gap-6">
                {/* 1.1 Stacked column */}
                <div className="w-full h-[440px] bg-muted rounded-2xl" />

                {/* 1.2a + 1.2b */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="w-full h-[400px] bg-muted rounded-2xl" />
                    <div className="w-full h-[400px] bg-muted rounded-2xl" />
                </div>

                {/* 1.3 */}
                <div className="w-full h-[400px] bg-muted rounded-2xl" />

                {/* 1.4 */}
                <div className="w-full h-[460px] bg-muted rounded-2xl" />
            </div>
        </div>
    );
}
