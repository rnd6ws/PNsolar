"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
    Map,
    Filter,
    BarChart2,
    X,
    RefreshCw,
    Maximize2,
    MapPin,
    Flame,
    ExternalLink,
    Phone,
    Mail,
    Building2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import FilterPanel from "@/features/ban-do-kh/components/FilterPanel";
import StatisticsPanel from "@/features/ban-do-kh/components/StatisticsPanel";
import { isValidCoordinate, getMapCenter, debounce } from "@/features/ban-do-kh/utils/mapUtils";
import { getKhachHangForMap } from "@/features/ban-do-kh/action";
import type {
    MapKhachHang,
    NguonKHMap,
    SalesMap,
    MapFilters,
    MapStatistics,
} from "@/features/ban-do-kh/types";
import type L from "leaflet";

// ⚠️ Dynamic import - KHÔNG SSR
const MapContainer = dynamic(
    () => import("@/features/ban-do-kh/components/MapContainer"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-muted/30 animate-pulse flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Đang tải bản đồ...</div>
            </div>
        ),
    }
);

const DEFAULT_STATS: MapStatistics = {
    total: 0,
    byPhanLoai: {},
    byNguon: {},
    bySales: {},
    byDanhGia: [0, 0, 0, 0, 0],
    coHopDong: 0,
};

const DEFAULT_FILTERS: MapFilters = {
    nguon: [],
    phanLoai: [],
    danhGia: [],
    sales: [],
};

interface Props {
    initialCustomers: MapKhachHang[];
    nguonList: NguonKHMap[];
    salesList: SalesMap[];
}

export default function BanDoKhachHangClient({ initialCustomers, nguonList, salesList }: Props) {
    // ─── Data ────────────────────────────────────────────────────────
    const [customers, setCustomers] = useState<MapKhachHang[]>(initialCustomers);
    const validCustomers = useMemo(
        () => customers.filter((c) => isValidCoordinate(c.LAT, c.LONG)),
        [customers]
    );
    const [filteredCustomers, setFilteredCustomers] = useState<MapKhachHang[]>(validCustomers);

    // ─── UI ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<"cluster" | "heatmap">("cluster");
    const [detailCustomer, setDetailCustomer] = useState<MapKhachHang | null>(null);
    const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
    const [showFilterPanel, setShowFilterPanel] = useState(true);
    const [showStatsPanel, setShowStatsPanel] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState<MapStatistics>(DEFAULT_STATS);
    const [mapCenter, setMapCenter] = useState(() => getMapCenter(validCustomers));
    const [mapRef, setMapRef] = useState<L.Map | null>(null);

    // ─── Mobile detection ────────────────────────────────────────────
    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setShowFilterPanel(false);
                setShowStatsPanel(false);
            }
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // ─── Apply filters ────────────────────────────────────────────────
    const applyFilters = useCallback(() => {
        let result = validCustomers;
        if (filters.nguon.length > 0)
            result = result.filter((c) => filters.nguon.includes(c.NGUON ?? ""));
        if (filters.phanLoai.length > 0)
            result = result.filter((c) => filters.phanLoai.includes(c.PHAN_LOAI ?? ""));
        if (filters.danhGia.length > 0)
            result = result.filter((c) => filters.danhGia.includes(c.DANH_GIA ?? ""));
        if (filters.sales.length > 0)
            result = result.filter((c) => filters.sales.includes(c.SALES_PT ?? ""));
        setFilteredCustomers(result);
    }, [validCustomers, filters]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // ─── Calculate stats ──────────────────────────────────────────────
    const calculateStatistics = useCallback(
        (list: MapKhachHang[], bounds?: L.LatLngBounds) => {
            const inView = bounds?.contains
                ? list.filter((c) => {
                      if (!isValidCoordinate(c.LAT, c.LONG)) return false;
                      try {
                          return bounds.contains([
                              parseFloat(String(c.LAT)),
                              parseFloat(String(c.LONG)),
                          ]);
                      } catch {
                          return false;
                      }
                  })
                : list;

            const stats: MapStatistics = {
                total: inView.length,
                byPhanLoai: {},
                byNguon: {},
                bySales: {},
                byDanhGia: [0, 0, 0, 0, 0],
                coHopDong: inView.filter((c) => c._count.HOP_DONG > 0).length,
            };

            inView.forEach((c) => {
                const pl = c.PHAN_LOAI || "Chưa phân loại";
                stats.byPhanLoai[pl] = (stats.byPhanLoai[pl] || 0) + 1;

                const ng = c.NGUON || "Khác";
                stats.byNguon[ng] = (stats.byNguon[ng] || 0) + 1;

                const sales = c.SALES_PT || "Chưa phân công";
                stats.bySales[sales] = (stats.bySales[sales] || 0) + 1;

                const r = (c.DANH_GIA || "").length;
                if (r > 0 && r <= 5) stats.byDanhGia[r - 1]++;
            });

            setStatistics(stats);
        },
        []
    );

    useEffect(() => {
        calculateStatistics(filteredCustomers);
    }, [filteredCustomers, calculateStatistics]);

    const debouncedBoundsChange = useMemo(
        () =>
            debounce((bounds: L.LatLngBounds) => {
                calculateStatistics(filteredCustomers, bounds);
            }, 500),
        [filteredCustomers, calculateStatistics]
    );

    // ─── Refresh data ─────────────────────────────────────────────────
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getKhachHangForMap();
            if (res.success && Array.isArray(res.data)) {
                const valid = res.data.filter((c) => isValidCoordinate(c.LAT, c.LONG));
                setCustomers(res.data as MapKhachHang[]);
                setMapCenter(getMapCenter(valid));
                const noCoords = res.data.length - valid.length;
                if (noCoords > 0)
                    toast.warning(`${noCoords} khách hàng chưa có tọa độ`);
                toast.success(`Đã cập nhật ${valid.length} khách hàng trên bản đồ`);
            }
        } catch {
            toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Fit bounds ───────────────────────────────────────────────────
    const handleFitBounds = useCallback(() => {
        if (!mapRef || filteredCustomers.length === 0) return;
        try {
            const Leaflet = (window as any).L;
            const bounds = Leaflet.latLngBounds(
                filteredCustomers.map((c) => [
                    parseFloat(String(c.LAT)),
                    parseFloat(String(c.LONG)),
                ])
            );
            mapRef.fitBounds(bounds, { padding: [40, 40] });
        } catch {}
    }, [mapRef, filteredCustomers]);

    const activeFilterCount =
        filters.nguon.length + filters.phanLoai.length + filters.danhGia.length + filters.sales.length;

    return (
        <div className="h-full flex flex-col bg-background">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Map className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground leading-tight">
                            Bản Đồ Khách Hàng
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {filteredCustomers.length} / {validCustomers.length} khách hàng
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* View mode toggle */}
                    <div className="flex p-0.5 bg-muted border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("cluster")}
                            title="Cluster markers"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                viewMode === "cluster"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Cluster</span>
                        </button>
                        <button
                            onClick={() => setViewMode("heatmap")}
                            title="Heatmap"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                viewMode === "heatmap"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Flame className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Heatmap</span>
                        </button>
                    </div>

                    {/* Fit bounds */}
                    <button
                        onClick={handleFitBounds}
                        title="Khớp tất cả markers"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={handleRefresh}
                        title="Làm mới dữ liệu"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    {/* Mobile toggles */}
                    {isMobile && (
                        <>
                            <button
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                title="Bộ lọc"
                                className={`p-2 rounded-lg transition-colors border ${
                                    showFilterPanel
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                                }`}
                            >
                                <Filter className="h-4 w-4" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowStatsPanel(!showStatsPanel)}
                                title="Thống kê"
                                className={`p-2 rounded-lg transition-colors border ${
                                    showStatsPanel
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                                }`}
                            >
                                <BarChart2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop Filter Sidebar */}
                {!isMobile && (
                    <div
                        className={`relative flex shrink-0 transition-all duration-300 ${
                            showFilterPanel ? "w-72" : "w-0"
                        } overflow-hidden`}
                    >
                        <div className="w-72 bg-card border-r border-border overflow-y-auto h-full">
                            <FilterPanel
                                filters={filters}
                                onFilterChange={setFilters}
                                onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                                nguonList={nguonList}
                                salesList={salesList}
                                customerCount={filteredCustomers.length}
                            />
                        </div>
                    </div>
                )}

                {/* Desktop Filter toggle button */}
                {!isMobile && (
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-12 bg-card border border-border rounded-r-lg flex items-center justify-center hover:bg-muted transition-all shadow-sm"
                        style={{ left: showFilterPanel ? "288px" : "0px" }}
                        title={showFilterPanel ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                    >
                        {showFilterPanel ? (
                            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                )}

                {/* Map area */}
                <div className="flex-1 relative overflow-hidden">
                    <MapContainer
                        customers={filteredCustomers}
                        viewMode={viewMode}
                        center={mapCenter}
                        loading={loading}
                        onMarkerClick={() => {}}
                        onViewDetail={(c) => setDetailCustomer(c)}
                        onBoundsChanged={debouncedBoundsChange}
                        setMapRef={setMapRef}
                    />

                    {/* Active filters badge (on map) */}
                    {activeFilterCount > 0 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                            <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                                {activeFilterCount} bộ lọc · {filteredCustomers.length} KH
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Stats Sidebar */}
                {!isMobile && (
                    <div
                        className={`relative flex shrink-0 transition-all duration-300 ${
                            showStatsPanel ? "w-72" : "w-0"
                        } overflow-hidden`}
                    >
                        <div className="w-72 bg-card border-l border-border overflow-y-auto h-full">
                            <StatisticsPanel statistics={statistics} />
                        </div>
                    </div>
                )}

                {/* Desktop Stats toggle button */}
                {!isMobile && (
                    <button
                        onClick={() => setShowStatsPanel(!showStatsPanel)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-5 h-12 bg-card border border-border rounded-l-lg flex items-center justify-center hover:bg-muted transition-all shadow-sm"
                        style={{ right: showStatsPanel ? "288px" : "0px" }}
                        title={showStatsPanel ? "Ẩn thống kê" : "Hiện thống kê"}
                    >
                        {showStatsPanel ? (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        ) : (
                            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                )}

                {/* Mobile Filter Drawer */}
                {isMobile && (
                    <>
                        <div
                            className={`fixed inset-y-0 left-0 z-[1001] w-72 bg-card shadow-2xl transform transition-transform duration-300 ${
                                showFilterPanel ? "translate-x-0" : "-translate-x-full"
                            }`}
                        >
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <span className="text-sm font-bold">Bộ lọc</span>
                                    <button
                                        onClick={() => setShowFilterPanel(false)}
                                        className="p-1.5 hover:bg-muted rounded-lg"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <FilterPanel
                                        filters={filters}
                                        onFilterChange={setFilters}
                                        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                                        nguonList={nguonList}
                                        salesList={salesList}
                                        customerCount={filteredCustomers.length}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Stats Bottom Sheet */}
                        <div
                            className={`fixed inset-x-0 bottom-0 z-[1001] bg-card rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${
                                showStatsPanel ? "translate-y-0" : "translate-y-full"
                            }`}
                            style={{ maxHeight: "60vh" }}
                        >
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <span className="text-sm font-bold">Thống kê</span>
                                    <button
                                        onClick={() => setShowStatsPanel(false)}
                                        className="p-1.5 hover:bg-muted rounded-lg"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <StatisticsPanel statistics={statistics} />
                                </div>
                            </div>
                        </div>

                        {/* Overlay */}
                        {(showFilterPanel || showStatsPanel) && (
                            <div
                                className="fixed inset-0 bg-black/50 z-[1000]"
                                onClick={() => {
                                    setShowFilterPanel(false);
                                    setShowStatsPanel(false);
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {detailCustomer && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-[2000]"
                        onClick={() => setDetailCustomer(null)}
                    />
                    <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4 pointer-events-none">
                        <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-5 border-b border-border">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-foreground leading-tight">
                                            {detailCustomer.TEN_KH}
                                        </h2>
                                        {detailCustomer.TEN_VT && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {detailCustomer.TEN_VT}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDetailCustomer(null)}
                                    className="p-1.5 hover:bg-muted rounded-lg shrink-0 ml-2"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="p-5 space-y-4">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {detailCustomer.PHAN_LOAI && (
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                            {detailCustomer.PHAN_LOAI}
                                        </span>
                                    )}
                                    {detailCustomer.DANH_GIA && (
                                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
                                            {detailCustomer.DANH_GIA}
                                        </span>
                                    )}
                                    {detailCustomer.NGUON && (
                                        <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                            {detailCustomer.NGUON}
                                        </span>
                                    )}
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {detailCustomer.DIA_CHI && (
                                        <InfoRow icon="📍" label="Địa chỉ" value={detailCustomer.DIA_CHI} />
                                    )}
                                    {detailCustomer.DIEN_THOAI && (
                                        <InfoRow icon="📞" label="Điện thoại" value={detailCustomer.DIEN_THOAI} />
                                    )}
                                    {detailCustomer.EMAIL && (
                                        <InfoRow icon="✉️" label="Email" value={detailCustomer.EMAIL} />
                                    )}
                                    {detailCustomer.SALES_PT && (
                                        <InfoRow icon="👤" label="Sales phụ trách" value={detailCustomer.SALES_PT} />
                                    )}
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                                        <p className="text-xl font-bold text-foreground">
                                            {detailCustomer._count.CO_HOI}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Cơ hội</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                                        <p className="text-xl font-bold text-foreground">
                                            {detailCustomer._count.HOP_DONG}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Hợp đồng</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="px-5 pb-5 flex gap-2.5">
                                <a
                                    href={`/khach-hang?query=${encodeURIComponent(detailCustomer.MA_KH)}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Xem hồ sơ
                                </a>
                                {detailCustomer.LAT && detailCustomer.LONG && (
                                    <button
                                        onClick={() => {
                                            if (!navigator.geolocation) return;
                                            navigator.geolocation.getCurrentPosition(({ coords }) => {
                                                window.open(
                                                    `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${detailCustomer.LAT},${detailCustomer.LONG}&travelmode=driving`,
                                                    "_blank"
                                                );
                                            });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        Chỉ đường
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="text-sm mt-0.5">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground">{value}</p>
            </div>
        </div>
    );
}
