import { parseGoogleMapsUrl } from './parseGoogleMapsUrl';
import { resolveShortUrl } from './resolveShortUrl';
import { reverseGeocode, NominatimAddressDetail } from './reverseGeocode';

export interface MapsInfo {
    name: string | null;
    lat: number;
    lng: number;
    /**
     * Địa chỉ tốt nhất có thể lấy được:
     *   - Ưu tiên 1: địa chỉ nhúng trong URL (khi user search theo địa chỉ)
     *   - Ưu tiên 2: địa chỉ build từ Nominatim addressDetail (zoom=18)
     *   - Fallback: display_name từ Nominatim bỏ ", Việt Nam"
     */
    address: string | null;
    /** Raw display_name từ Nominatim */
    displayName: string | null;
    addressDetail: NominatimAddressDetail | null;
}

/**
 * Build địa chỉ chuẩn VN từ addressDetail của Nominatim.
 * Thứ tự: số nhà + đường → tổ/khu phố → phường/xã → quận/huyện → tỉnh/TP.
 */
function buildViAddress(d: NominatimAddressDetail): string | null {
    const parts: string[] = [];

    // Số nhà + tên đường
    if (d.house_number && d.road) {
        parts.push(`${d.house_number} ${d.road}`);
    } else if (d.road) {
        parts.push(d.road);
    }

    // Tổ/khu phố/ấp
    const wsSub = d.quarter ?? d.neighbourhood;
    if (wsSub) parts.push(wsSub);

    // Phường / xã
    if (d.suburb) parts.push(d.suburb);

    // Quận / huyện
    if (d.city_district) parts.push(d.city_district);

    // Tỉnh / thành phố
    const province = d.city ?? d.state;
    if (province) parts.push(province);

    return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Hàm chính — nhận vào bất kỳ link Google Maps nào (rút gọn hoặc đầy đủ),
 * trả về tọa độ, tên địa điểm và địa chỉ theo thứ tự ưu tiên.
 *
 * Chỉ chạy phía server (Server Action / API Route).
 */
export async function resolveMapsInfo(url: string): Promise<MapsInfo> {
    const isShort =
        url.includes('maps.app.goo.gl') ||
        url.includes('goo.gl') ||
        url.includes('g.co/maps');
    const isGoogleMaps = url.includes('google.com/maps');

    if (!isShort && !isGoogleMaps) {
        throw new Error('URL không phải Google Maps hợp lệ. Vui lòng dùng link từ Google Maps.');
    }

    // Follow redirect nếu là link rút gọn
    const finalUrl = isShort ? await resolveShortUrl(url) : url;

    // Parse tọa độ, tên địa điểm và địa chỉ từ URL (nếu có)
    const { lat, lng, name, addressFromUrl } = parseGoogleMapsUrl(finalUrl);

    if (lat === null || lng === null) {
        throw new Error('Không tìm được tọa độ trong link. Hãy thử dùng link dài từ Google Maps.');
    }

    // Reverse geocoding zoom=18 → chi tiết đến building level
    const geo = await reverseGeocode(lat, lng);

    // Ưu tiên địa chỉ theo thứ tự:
    // 1. Địa chỉ nhúng trong URL (chính xác nhất — từ Google Maps khi search theo địa chỉ)
    // 2. Địa chỉ build từ Nominatim addressDetail
    // 3. display_name thô bỏ ", Việt Nam"
    const nominatimAddress = geo
        ? (buildViAddress(geo.address) ?? geo.display_name.replace(/,?\s*Việt Nam\s*$/i, '').trim())
        : null;

    const address = addressFromUrl ?? nominatimAddress;

    return {
        name,
        lat,
        lng,
        address,
        displayName: geo?.display_name ?? null,
        addressDetail: geo?.address ?? null,
    };
}
