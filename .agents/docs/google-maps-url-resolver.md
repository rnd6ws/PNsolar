# Google Maps URL Resolver — NextJS

Giải pháp lấy **tọa độ** và **địa chỉ** từ link Google Maps (cả link rút gọn lẫn link đầy đủ), **miễn phí**, không cần API key.

---

## Cách hoạt động

```
Link Google Maps (rút gọn hoặc đầy đủ)
        ↓
[Server] Follow redirect nếu là link rút gọn
        ↓
Parse tọa độ từ !3d / !4d trong URL
        ↓
Gọi Nominatim (OpenStreetMap) để reverse geocoding
        ↓
Trả về: tên, tọa độ, địa chỉ đầy đủ
```

---

## Các loại URL được hỗ trợ

| Loại | Ví dụ | Xử lý |
|------|-------|-------|
| Link rút gọn | `https://maps.app.goo.gl/xxx` | Fetch → follow redirect → parse |
| Link đầy đủ | `https://www.google.com/maps/place/...` | Parse thẳng |

---

## Cài đặt

Không cần cài thêm thư viện — giải pháp dùng **fetch** thuần và **Nominatim API** (miễn phí).

---

## Các hàm tiện ích

### 1. Parse tọa độ từ URL Google Maps

```ts
// lib/maps/parseGoogleMapsUrl.ts

export interface ParsedMapsUrl {
  lat: number | null;
  lng: number | null;
  name: string | null;
}

/**
 * Parse tọa độ và tên địa điểm từ URL Google Maps đầy đủ.
 * Hỗ trợ cả 2 định dạng: !3d!4d và @lat,lng
 */
export function parseGoogleMapsUrl(url: string): ParsedMapsUrl {
  const decoded = decodeURIComponent(url);

  // Ưu tiên !3d / !4d — chính xác nhất
  const latMatch = decoded.match(/!3d(-?\d+\.\d+)/);
  const lngMatch = decoded.match(/!4d(-?\d+\.\d+)/);

  // Fallback: @lat,lng trong URL
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

  // Tên địa điểm từ /place/TÊN/
  const nameMatch = decoded.match(/\/place\/([^/@]+)/);
  const name = nameMatch
    ? decodeURIComponent(nameMatch[1].replace(/\+/g, " "))
    : null;

  return { lat, lng, name };
}
```

---

### 2. Resolve link rút gọn → URL đầy đủ

```ts
// lib/maps/resolveShortUrl.ts

/**
 * Follow redirect của link rút gọn Google Maps.
 * Chỉ dùng phía server (API Route) vì browser bị CORS.
 */
export async function resolveShortUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.url;
}
```

---

### 3. Reverse geocoding bằng Nominatim (miễn phí)

```ts
// lib/maps/reverseGeocode.ts

export interface AddressDetail {
  house_number?: string;
  road?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface GeocodeResult {
  display_name: string;
  address: AddressDetail;
}

/**
 * Lấy địa chỉ từ tọa độ bằng Nominatim (OpenStreetMap).
 * Miễn phí, không cần API key. Rate limit: 1 req/giây.
 *
 * QUAN TRỌNG: Header User-Agent là bắt buộc theo policy của Nominatim.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  appName = "MyNextJSApp"
): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=vi`;

  const res = await fetch(url, {
    headers: { "User-Agent": `${appName}/1.0` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    display_name: data.display_name,
    address: data.address,
  };
}
```

---

### 4. Hàm tổng hợp (dùng trong API Route)

```ts
// lib/maps/resolveMapsInfo.ts

import { parseGoogleMapsUrl } from "./parseGoogleMapsUrl";
import { resolveShortUrl } from "./resolveShortUrl";
import { reverseGeocode } from "./reverseGeocode";

export interface MapsInfo {
  name: string | null;
  lat: number;
  lng: number;
  address: string | null;
  addressDetail: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    postcode?: string;
  } | null;
}

/**
 * Hàm chính — nhận vào bất kỳ link Google Maps nào,
 * trả về tọa độ và địa chỉ đầy đủ.
 */
export async function resolveMapsInfo(url: string): Promise<MapsInfo> {
  const isShort = url.includes("maps.app.goo.gl");
  const isGoogleMaps = url.includes("google.com/maps");

  if (!isShort && !isGoogleMaps) {
    throw new Error("URL không phải Google Maps hợp lệ");
  }

  // Follow redirect nếu là link rút gọn
  const finalUrl = isShort ? await resolveShortUrl(url) : url;

  // Parse tọa độ và tên
  const { lat, lng, name } = parseGoogleMapsUrl(finalUrl);

  if (lat === null || lng === null) {
    throw new Error("Không tìm được tọa độ trong URL");
  }

  // Reverse geocoding
  const geo = await reverseGeocode(lat, lng);

  return {
    name,
    lat,
    lng,
    address: geo?.display_name ?? null,
    addressDetail: geo?.address ?? null,
  };
}
```

---

## API Route (NextJS App Router)

```ts
// app/api/resolve-maps/route.ts

import { resolveMapsInfo } from "@/lib/maps/resolveMapsInfo";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return Response.json({ error: "Thiếu URL" }, { status: 400 });
    }

    const result = await resolveMapsInfo(url);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 422 });
  }
}
```

---

## Hook React

```ts
// hooks/useResolveMapsUrl.ts

import { useState } from "react";
import type { MapsInfo } from "@/lib/maps/resolveMapsInfo";

interface UseResolveMapsUrlReturn {
  resolve: (url: string) => Promise<void>;
  result: MapsInfo | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useResolveMapsUrl(): UseResolveMapsUrlReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapsInfo | null>(null);

  async function resolve(url: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/resolve-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { resolve, result, loading, error, reset };
}
```

---

## Ví dụ sử dụng trong Component

```tsx
// components/MapsResolver.tsx
"use client";

import { useState } from "react";
import { useResolveMapsUrl } from "@/hooks/useResolveMapsUrl";

export default function MapsResolver() {
  const [url, setUrl] = useState("");
  const { resolve, result, loading, error, reset } = useResolveMapsUrl();

  const handleSubmit = () => {
    if (!url.trim()) return;
    resolve(url.trim());
  };

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          reset();
        }}
        placeholder="Dán link Google Maps vào đây..."
      />
      <button onClick={handleSubmit} disabled={loading || !url.trim()}>
        {loading ? "Đang xử lý..." : "Lấy thông tin"}
      </button>

      {error && <p style={{ color: "red" }}>Lỗi: {error}</p>}

      {result && (
        <div>
          {result.name && <p><strong>Tên:</strong> {result.name}</p>}
          <p><strong>Tọa độ:</strong> {result.lat}, {result.lng}</p>
          <p><strong>Địa chỉ:</strong> {result.address}</p>

          {result.addressDetail && (
            <ul>
              {result.addressDetail.road && (
                <li>Đường: {result.addressDetail.road}</li>
              )}
              {result.addressDetail.suburb && (
                <li>Phường/Xã: {result.addressDetail.suburb}</li>
              )}
              {result.addressDetail.city_district && (
                <li>Quận/Huyện: {result.addressDetail.city_district}</li>
              )}
              {result.addressDetail.city && (
                <li>Tỉnh/TP: {result.addressDetail.city}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Cấu trúc thư mục đề xuất

```
lib/
  maps/
    parseGoogleMapsUrl.ts   ← Parse tọa độ + tên từ URL
    resolveShortUrl.ts      ← Follow redirect link rút gọn
    reverseGeocode.ts       ← Nominatim reverse geocoding
    resolveMapsInfo.ts      ← Hàm tổng hợp chính

app/
  api/
    resolve-maps/
      route.ts              ← API Route NextJS

hooks/
  useResolveMapsUrl.ts      ← React hook

components/
  MapsResolver.tsx          ← Ví dụ component
```

---

## Ví dụ kết quả trả về

```json
{
  "name": "CÔNG TY CỔ PHẦN TẬP ĐOÀN WOWS - TRUNG TÂM NGOẠI NGỮ LIÊN ÂU MỸ LEA",
  "lat": 11.0073725,
  "lng": 106.6602052,
  "address": "Đường Lê Lợi, Phú Hòa, Thủ Dầu Một, Bình Dương, Việt Nam",
  "addressDetail": {
    "road": "Đường Lê Lợi",
    "suburb": "Phú Hòa",
    "city_district": "Thủ Dầu Một",
    "city": "Bình Dương",
    "country": "Việt Nam",
    "postcode": "75000"
  }
}
```

---

## Lưu ý quan trọng

### Nominatim (OpenStreetMap)
| Mục | Chi tiết |
|-----|----------|
| Chi phí | Hoàn toàn miễn phí |
| API key | Không cần |
| Rate limit | 1 request/giây |
| Header bắt buộc | `User-Agent` — đặt tên app của bạn |
| Độ chính xác VN | Tốt với khu đô thị, có thể thiếu số nhà ở vùng nông thôn |

### Fetch phải chạy phía Server
Không thể gọi Nominatim hay follow redirect trực tiếp từ browser do CORS.
Luôn gọi qua **API Route** của NextJS.

### Khi nào nên nâng cấp lên Google Maps API
- Cần số nhà chính xác tuyệt đối
- App có lưu lượng lớn (>1 req/giây liên tục)
- Cần thông tin bổ sung như giờ mở cửa, số điện thoại, đánh giá...
