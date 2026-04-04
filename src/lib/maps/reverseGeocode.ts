export interface NominatimAddressDetail {
    /** Tên địa điểm / cơ sở (nhà hàng, công ty...) */
    amenity?: string;
    /** Số nhà */
    house_number?: string;
    /** Tên đường */
    road?: string;
    /** Tổ dân phố / khu phố / ấp */
    quarter?: string;
    /** Tên khu dân cư, phường (alternative) */
    neighbourhood?: string;
    /** Phường / xã */
    suburb?: string;
    /** Quận / huyện / thị xã */
    city_district?: string;
    /** Thành phố / tỉnh */
    city?: string;
    /** Tỉnh / thành phố trực thuộc TW (nếu city trống) */
    state?: string;
    country?: string;
    postcode?: string;
}

export interface GeocodeResult {
    display_name: string;
    address: NominatimAddressDetail;
}

/**
 * Lấy địa chỉ chi tiết từ tọa độ bằng Nominatim (OpenStreetMap).
 * Miễn phí, không cần API key. Rate limit: 1 req/giây.
 *
 * zoom=18 → building level (chi tiết nhất: số nhà, tên đường, phường, quận, tỉnh).
 * QUAN TRỌNG: Header User-Agent là bắt buộc theo policy của Nominatim.
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<GeocodeResult | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18&accept-language=vi`,
            {
                headers: { 'User-Agent': 'PNsolarRND6/1.0 (contact@pnsolar.com)' },
                signal: controller.signal,
            }
        );
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            display_name: data.display_name,
            address: data.address ?? {},
        };
    } catch {
        return null;
    }
}
