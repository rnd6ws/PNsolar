"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    ChevronLeft,
    ChevronRight,
    Building2
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import FilterPanel from "@/features/ban-do-kh/components/FilterPanel";
import StatisticsPanel from "@/features/ban-do-kh/components/StatisticsPanel";
import KhachHangDetail from "@/features/khach-hang/components/KhachHangDetail";
import { isValidCoordinate, getMapCenter, debounce } from "@/features/ban-do-kh/utils/mapUtils";
import { getKhachHangForMap } from "@/features/ban-do-kh/action";
import type {
    MapKhachHang,
    NguonKHMap,
    SalesMap,
    MapFilters,
    MapStatistics,
    PhanLoaiMap,
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
    coHopDong: 0,
};

const DEFAULT_FILTERS: MapFilters = {
    nguon: [],
    phanLoai: [],
    sales: [],
};

interface Props {
    initialCustomers: MapKhachHang[];
    totalCustomers: number;
    nguonList: NguonKHMap[];
    salesList: SalesMap[];
    phanLoaiList: PhanLoaiMap[];
}

export default function BanDoKhachHangClient({ initialCustomers, totalCustomers, nguonList, salesList, phanLoaiList }: Props) {
    // ─── Data ────────────────────────────────────────────────────────
    const [customers, setCustomers] = useState<MapKhachHang[]>(initialCustomers);
    const validCustomers = useMemo(
        () => customers.filter((c) => isValidCoordinate(c.LAT, c.LONG)),
        [customers]
    );
    const [filteredCustomers, setFilteredCustomers] = useState<MapKhachHang[]>(validCustomers);
    const [totalDbCount, setTotalDbCount] = useState<number>(totalCustomers);

    // ─── UI ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<"cluster" | "heatmap">("cluster");
    const [fullCustomerProps, setFullCustomerProps] = useState<{ kh: any, nhanViens: any[], nguoiGioiThieus: any[] } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
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
                coHopDong: inView.filter((c) => c._count.HOP_DONG > 0).length,
            };

            inView.forEach((c) => {
                const pl = c.PHAN_LOAI || "Chưa phân loại";
                stats.byPhanLoai[pl] = (stats.byPhanLoai[pl] || 0) + 1;

                const ng = c.NGUON || "Khác";
                stats.byNguon[ng] = (stats.byNguon[ng] || 0) + 1;

                const sales = c.SALES_PT_TEN || c.SALES_PT || "Chưa phân công";
                stats.bySales[sales] = (stats.bySales[sales] || 0) + 1;
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
                setTotalDbCount((res as any).totalCount || 0);
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
        } catch { }
    }, [mapRef, filteredCustomers]);

    // ─── View detail ─────────────────────────────────────────────────
    const handleViewDetail = async (c: MapKhachHang) => {
        setDetailLoading(true);
        const toastId = toast.loading("Đang tải dữ liệu khách hàng...");
        try {
            const { getKhachHangById, getNVList, getNguoiGioiThieu } = await import("@/features/khach-hang/action");
            const [khRes, nvRes, ngtRes] = await Promise.all([
                getKhachHangById(c.ID),
                getNVList(),
                getNguoiGioiThieu(),
            ]);
            if (khRes.success && khRes.data) {
                setFullCustomerProps({
                    kh: khRes.data,
                    nhanViens: nvRes.success ? nvRes.data : [],
                    nguoiGioiThieus: ngtRes.success ? ngtRes.data : []
                });
                toast.dismiss(toastId);
            } else {
                toast.error("Không thể lấy thông tin chi tiết", { id: toastId });
            }
        } catch {
            toast.error("Lỗi khi lấy thông tin", { id: toastId });
        } finally {
            setDetailLoading(false);
        }
    };

    const activeFilterCount =
        filters.nguon.length + filters.phanLoai.length + filters.sales.length;

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
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
                            {filteredCustomers.length} / {validCustomers.length} KH có tọa độ (Tổng: {totalDbCount})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* View mode toggle */}
                    <div className="flex p-0.5 bg-muted border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("cluster")}
                            title="Cluster markers"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "cluster"
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
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "heatmap"
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
                                className={`p-2 rounded-lg transition-colors border ${showFilterPanel
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
                                className={`p-2 rounded-lg transition-colors border ${showStatsPanel
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
                        className={`relative flex shrink-0 transition-all duration-300 ${showFilterPanel ? "w-72" : "w-0"
                            } overflow-hidden`}
                    >
                        <div className="w-72 bg-card border-r border-border overflow-y-auto h-full">
                            <FilterPanel
                                filters={filters}
                                onFilterChange={setFilters}
                                onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                                nguonList={nguonList}
                                salesList={salesList}
                                phanLoaiList={phanLoaiList}
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
                <div className="flex-1 relative z-0 overflow-hidden">
                    <MapContainer
                        customers={filteredCustomers}
                        phanLoaiList={phanLoaiList}
                        viewMode={viewMode}
                        center={mapCenter}
                        loading={loading}
                        onMarkerClick={() => { }}
                        onViewDetail={handleViewDetail}
                        onBoundsChanged={debouncedBoundsChange}
                        setMapRef={setMapRef}
                    />

                    {/* Active filters badge (on map) */}
                    {activeFilterCount > 0 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 pointer-events-none">
                            <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                                {activeFilterCount} bộ lọc · {filteredCustomers.length} KH
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Stats Sidebar */}
                {!isMobile && (
                    <div
                        className={`relative flex shrink-0 transition-all duration-300 ${showStatsPanel ? "w-72" : "w-0"
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
                            className={`fixed inset-y-0 left-0 z-1001 w-72 bg-card shadow-2xl transform transition-transform duration-300 ${showFilterPanel ? "translate-x-0" : "-translate-x-full"
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
                                        phanLoaiList={phanLoaiList}
                                        customerCount={filteredCustomers.length}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Stats Bottom Sheet */}
                        <div
                            className={`fixed inset-x-0 bottom-0 z-1001 bg-card rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${showStatsPanel ? "translate-y-0" : "translate-y-full"
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
                                className="fixed inset-0 bg-black/50 z-1000"
                                onClick={() => {
                                    setShowFilterPanel(false);
                                    setShowStatsPanel(false);
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* ── Detail Modal (dùng component Modal chung) ── */}
            {/* KhachHangDetail tự có header/tab/footer/scroll nên dùng p-0 + disableBodyScroll */}
            {/* wrapperClassName z-[2000]: Leaflet map dùng z-index 200-700+, cần vượt qua */}
            <Modal
                title="Chi tiết khách hàng"
                icon={Building2}
                isOpen={!!fullCustomerProps}
                onClose={() => setFullCustomerProps(null)}
                size="xl"
                // fullHeight
                // bodyClassName="p-3"
                disableBodyScroll
                wrapperClassName="z-[2000]"
            >
                {fullCustomerProps && (
                    <KhachHangDetail
                        kh={fullCustomerProps.kh}
                        nhanViens={fullCustomerProps.nhanViens}
                        nguoiGioiThieus={fullCustomerProps.nguoiGioiThieus}
                        onClose={() => setFullCustomerProps(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
