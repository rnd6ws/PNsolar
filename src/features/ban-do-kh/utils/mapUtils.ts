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

/** Màu marker theo phân loại khách hàng */
export function getMarkerColor(phanLoai: string | null, danhGia: string | null): string {
    const pl = (phanLoai || "").toLowerCase();
    if (pl.includes("triển khai") || pl.includes("đang sử dụng")) return "#10b981"; // emerald
    if (pl.includes("tiềm năng")) return "#f59e0b"; // amber
    if (pl.includes("không phù hợp") || pl.includes("ngừng")) return "#ef4444"; // red
    const rating = (danhGia || "").length;
    if (rating >= 4) return "#8b5cf6"; // violet
    if (rating >= 2) return "#6366f1"; // indigo
    return "#6b7280"; // gray
}
