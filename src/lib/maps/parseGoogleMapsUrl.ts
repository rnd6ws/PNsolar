export interface ParsedMapsUrl {
    lat: number | null;
    lng: number | null;
    /** Tên địa điểm hoặc tên doanh nghiệp từ /place/TÊN/ */
    name: string | null;
    /**
     * Địa chỉ được nhúng trực tiếp trong URL path (chỉ có khi user search theo địa chỉ,
     * không có khi search theo tên doanh nghiệp).
     * Ví dụ: /place/393+Nguyễn+Đức+Thuận,+Hiệp+Thành,+Phú+Lợi,+Hồ+Chí+Minh/
     */
    addressFromUrl: string | null;
}

// Regex nhận dạng chuỗi trông giống địa chỉ: bắt đầu bằng số + từ đường/phố/ấp/khu hoặc dấu phẩy
const ADDRESS_PATTERN = /^\d+[\s,]/;

/**
 * Parse tọa độ và tên địa điểm từ URL Google Maps đầy đủ.
 *
 * Tọa độ — ưu tiên:
 *   1. !3d / !4d (tọa độ địa điểm được pin — chính xác nhất)
 *   2. @lat,lng  (tọa độ camera/viewport — fallback)
 *
 * Địa chỉ — ưu tiên:
 *   - Khi URL chứa địa chỉ thực (search theo địa chỉ): /place/393+Nguyễn+Đức+Thuận,.../ → trả về `addressFromUrl`
 *   - Khi URL chứa tên doanh nghiệp: /place/TÊN+CÔNG+TY/ → trả về `name`, `addressFromUrl` = null
 */
export function parseGoogleMapsUrl(url: string): ParsedMapsUrl {
    const decoded = decodeURIComponent(url);

    // ── Tọa độ ──────────────────────────────────────────────────────────────
    // Ưu tiên !3d / !4d
    const latMatch = decoded.match(/!3d(-?\d+\.\d+)/);
    const lngMatch = decoded.match(/!4d(-?\d+\.\d+)/);

    // Fallback: @lat,lng
    const coordFallback = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    const lat = latMatch
        ? parseFloat(latMatch[1])
        : coordFallback
        ? parseFloat(coordFallback[1])
        : null;

    const lng = lngMatch
        ? parseFloat(lngMatch[1])
        : coordFallback
        ? parseFloat(coordFallback[2])
        : null;

    // ── Tên / Địa chỉ từ /place/.../ ────────────────────────────────────────
    const nameMatch = decoded.match(/\/place\/([^/@]+)/);
    const rawPlace = nameMatch
        ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')).trim()
        : null;

    // Phân biệt: nếu rawPlace bắt đầu bằng số → trông như địa chỉ
    const looksLikeAddress = rawPlace ? ADDRESS_PATTERN.test(rawPlace) : false;

    return {
        lat,
        lng,
        name: rawPlace && !looksLikeAddress ? rawPlace : null,
        addressFromUrl: rawPlace && looksLikeAddress ? rawPlace : null,
    };
}
