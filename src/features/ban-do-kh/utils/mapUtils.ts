/** Kiểm tra tọa độ hợp lệ */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
    const latNum = parseFloat(String(lat));
    const lngNum = parseFloat(String(lng));
    return (
        !isNaN(latNum) &&
        !isNaN(lngNum) &&
        latNum >= -90 &&
        latNum <= 90 &&
        lngNum >= -180 &&
        lngNum <= 180 &&
        !(latNum === 0 && lngNum === 0)
    );
}

/** Tính tâm bản đồ từ danh sách khách hàng có tọa độ */
export function getMapCenter(customers: Array<{ LAT: string | number | null; LONG: string | number | null }>): {
    lat: number;
    lng: number;
} {
    if (customers.length === 0) {
        return { lat: 10.8231, lng: 106.6297 }; // mặc định TP.HCM
    }
    const lats = customers.map((c) => parseFloat(String(c.LAT)));
    const lngs = customers.map((c) => parseFloat(String(c.LONG)));
    return {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
}

/** Debounce utility */
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/** Format tiền tệ VND */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

export const COLOR_PALETTE = [
    "#f59e0b", // amber
    "#ef4444", // red
    "#10b981", // emerald
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#14b8a6", // teal
    "#f97316", // orange
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
];

export function getDynamicColor(val: string | null, list: Array<{ PL_KH: string | null; ID: string }>): string {
    if (!val) return "#9ca3af";
    const index = list.findIndex((item) => (item.PL_KH || item.ID) === val);
    if (index === -1) return "#6366f1"; // default if not found
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
}
