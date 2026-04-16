# Hướng Dẫn Xây Dựng Bản Đồ Phân Bổ Khách Hàng trong Next.js

> Tài liệu này hướng dẫn tái tạo hoàn chỉnh tính năng **Customer Map** (hiện đang dùng React + Leaflet) sang **Next.js App Router** với TypeScript và Tailwind CSS.

---

## Mục Lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cài đặt dependencies](#2-cài-đặt-dependencies)
3. [Cấu hình Leaflet cho Next.js (SSR Fix)](#3-cấu-hình-leaflet-cho-nextjs-ssr-fix)
4. [Utility functions](#4-utility-functions)
5. [Types & Interfaces](#5-types--interfaces)
6. [Server Action lấy dữ liệu](#6-server-action-lấy-dữ-liệu)
7. [Component: FilterPanel](#7-component-filterpanel)
8. [Component: StatisticsPanel](#8-component-statisticspanel)
9. [Component: MapContainer (Client)](#9-component-mapcontainer-client)
10. [Page: CustomerMap](#10-page-customermap)
11. [Layout & responsive mobile](#11-layout--responsive-mobile)
12. [Các gotcha phổ biến](#12-các-gotcha-phổ-biến)

---

## 1. Tổng Quan Kiến Trúc

```
app/
└── customer-map/
    ├── page.tsx                    ← Server Component (entry point)
    ├── CustomerMapClient.tsx       ← Client Component (state, logic)
    └── actions.ts                  ← Server Actions (data fetching)

components/
└── map/
    ├── MapContainer.tsx            ← Leaflet map (dynamic import, client only)
    ├── FilterPanel.tsx             ← Bộ lọc sidebar
    └── StatisticsPanel.tsx         ← Panel thống kê

config/
└── leafletConfig.ts                ← Tile layer, map options

utils/
├── mapUtils.ts                     ← isValidCoordinate, getMapCenter, debounce, formatCurrency
└── customerMapHelpers.ts           ← calculateStatistics, applyFilters
```

### Luồng dữ liệu

```
page.tsx (Server)
  └─► CustomerMapClient.tsx (Client)
        ├─► actions.ts (Server Action: fetch customers & nguon list)
        ├─► FilterPanel ◄──► filters state
        ├─► MapContainer (dynamic, no SSR)
        │     ├── ClusterMarkers (leaflet.markercluster)
        │     └── HeatmapLayer (leaflet.heat)
        └─► StatisticsPanel ◄── statistics (calculated from filteredCustomers + mapBounds)
```

---

## 2. Cài Đặt Dependencies

```bash
npm install react-leaflet leaflet leaflet.markercluster leaflet.heat
npm install -D @types/leaflet
```

> **Lưu ý**: `leaflet.heat` không có type definitions chính thức. Nếu cần, tạo `leaflet.heat.d.ts` tự khai báo.

### `next.config.ts` — cho phép import CSS của Leaflet

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cho phép import CSS từ node_modules (Leaflet, MarkerCluster)
  transpilePackages: ['leaflet', 'react-leaflet', 'leaflet.markercluster'],
};

export default nextConfig;
```

---

## 3. Cấu Hình Leaflet Cho Next.js (SSR Fix)

Leaflet dùng `window` và `document` nên **không thể chạy trên server**. Giải pháp: dùng `dynamic` import với `{ ssr: false }`.

### `config/leafletConfig.ts`

```ts
export const LEAFLET_CONFIG = {
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  mapOptions: {
    zoom: 12,
    defaultCenter: { lat: 10.8231, lng: 106.6297 }, // TP.HCM
  },
};

/** Trả màu marker theo trạng thái khách hàng */
export function getMarkerColor(customer: Customer): string {
  if (customer['CHỐT THÀNH KH'] === 'KH') return '#10b981'; // green
  const rating = (customer['ĐÁNH GIÁ TIỂM NĂNG'] || '').length;
  if (rating >= 4) return '#8b5cf6'; // purple
  if (rating >= 2) return '#f59e0b'; // amber
  return '#6b7280'; // gray
}
```

### Fix icon mặc định của Leaflet

Tạo file `components/map/LeafletIconFix.ts` và import vào MapContainer:

```ts
// components/map/LeafletIconFix.ts
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Ghi đè icon mặc định bị vỡ trong webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
```

---

## 4. Utility Functions

### `utils/mapUtils.ts`

```ts
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
export function getMapCenter(
  customers: Customer[]
): { lat: number; lng: number } {
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
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

---

## 5. Types & Interfaces

### `types/customer.ts`

```ts
export interface Customer {
  'TÊN CÔNG TY': string;
  'TÊN VIẾT TẮT'?: string;
  'ĐỊA CHỈ CÔNG TY'?: string;
  'HÌNH ẢNH'?: string;
  'CHỐT THÀNH KH'?: 'TN' | 'KH';
  'ĐÁNH GIÁ TIỂM NĂNG'?: string; // Chuỗi ⭐
  'NGUỒN'?: string;
  'SALES PHỤ TRÁCH'?: string;
  'SỐ TIỀN'?: number | string;
  LAT: string | number;
  LONG: string | number;
  [key: string]: unknown;
}

export interface NguonKH {
  ID_NGUON: string;
  'NGUỒN'?: string;
}

export interface MapFilters {
  nguon: string[];
  trangThai: string[];
  danhGia: string[];
  sales: string[];
}

export interface MapStatistics {
  total: number;
  tn: number;
  kh: number;
  highPotential: number;
  totalRevenue: number;
  bySource: Record<string, number>;
  bySales: Record<string, number>;
  byRating: number[]; // index 0 = 1 sao, index 4 = 5 sao
}
```

---

## 6. Server Action Lấy Dữ Liệu

### `app/customer-map/actions.ts`

```ts
'use server';

import { Customer, NguonKH } from '@/types/customer';

/** Fetch danh sách khách hàng từ API */
export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${process.env.API_BASE_URL}/KHTN/Find`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.API_TOKEN}` },
    body: JSON.stringify({
      Properties: {
        Locale: 'vi-VN',
        Timezone: 'Asia/Ho_Chi_Minh',
        Selector: 'Filter(KHTN, true)',
      },
    }),
    // Next.js cache: revalidate mỗi 5 phút
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

/** Fetch danh sách nguồn khách hàng */
export async function fetchNguonList(): Promise<NguonKH[]> {
  const res = await fetch(`${process.env.API_BASE_URL}/NGUON_KH/Find`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.API_TOKEN}` },
    body: JSON.stringify({
      Properties: { Locale: 'vi-VN', Timezone: 'Asia/Ho_Chi_Minh' },
    }),
    next: { revalidate: 3600 }, // cache 1 giờ
  });

  if (!res.ok) throw new Error('Failed to fetch nguon list');
  return res.json();
}
```

> **Tip**: Nếu dùng `authUtils.apiRequest` như bản gốc, hãy bọc wrapper dưới dạng server action tương tự.

---

## 7. Component: FilterPanel

### `components/map/FilterPanel.tsx`

```tsx
'use client';

import { Filter } from 'lucide-react';
import { MapFilters, NguonKH } from '@/types/customer';

interface FilterPanelProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  onClearFilters: () => void;
  nguonList: NguonKH[];
  salesList: string[];
  customerCount: number;
}

export default function FilterPanel({
  filters, onFilterChange, onClearFilters,
  nguonList, salesList, customerCount,
}: FilterPanelProps) {
  const toggle = (category: keyof MapFilters, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [category]: updated });
  };

  const activeCount =
    filters.nguon.length + filters.trangThai.length +
    filters.danhGia.length + filters.sales.length;

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-800">Bộ lọc</h2>
        </div>
        {activeCount > 0 && (
          <button onClick={onClearFilters} className="text-xs text-amber-600 font-medium">
            Xóa tất cả
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{activeCount}</span> bộ lọc đang áp dụng
          </p>
          <p className="text-xs text-amber-600 mt-1">Hiển thị {customerCount} khách hàng</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Trạng thái */}
        <FilterSection title="Trạng thái">
          <FilterCheckbox label="Tiềm năng (TN)" checked={filters.trangThai.includes('TN')}
            onChange={() => toggle('trangThai', 'TN')} color="amber" />
          <FilterCheckbox label="Khách hàng (KH)" checked={filters.trangThai.includes('KH')}
            onChange={() => toggle('trangThai', 'KH')} color="green" />
        </FilterSection>

        {/* Đánh giá */}
        <FilterSection title="Đánh giá tiềm năng">
          {['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐', '⭐'].map((r) => (
            <FilterCheckbox key={r} label={r}
              checked={filters.danhGia.includes(r)}
              onChange={() => toggle('danhGia', r)} />
          ))}
        </FilterSection>

        {/* Nguồn */}
        {nguonList.length > 0 && (
          <FilterSection title="Nguồn khách hàng">
            <div className="max-h-48 overflow-y-auto">
              {nguonList.map((n) => {
                const val = n['NGUỒN'] || n.ID_NGUON;
                return (
                  <FilterCheckbox key={n.ID_NGUON} label={val}
                    checked={filters.nguon.includes(val)}
                    onChange={() => toggle('nguon', val)} />
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Sales */}
        {salesList.length > 0 && (
          <FilterSection title="Sales phụ trách">
            <div className="max-h-48 overflow-y-auto">
              {salesList.map((s) => (
                <FilterCheckbox key={s} label={s}
                  checked={filters.sales.includes(s)}
                  onChange={() => toggle('sales', s)} />
              ))}
            </div>
          </FilterSection>
        )}
      </div>

      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-2xl font-bold text-amber-600">{customerCount}</p>
        <p className="text-sm text-gray-600">khách hàng phù hợp</p>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-4 border-b border-gray-200 last:border-b-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label, checked, onChange, color = 'amber',
}: {
  label: string; checked: boolean; onChange: () => void; color?: 'amber' | 'green';
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group">
      <input type="checkbox" checked={checked} onChange={onChange}
        className={`w-4 h-4 cursor-pointer ${color === 'green' ? 'accent-green-500' : 'accent-amber-500'}`} />
      <span className="text-sm text-gray-700 select-none">{label}</span>
    </label>
  );
}
```

---

## 8. Component: StatisticsPanel

### `components/map/StatisticsPanel.tsx`

```tsx
'use client';

import { BarChart2, Users, TrendingUp, UserCheck, DollarSign, Star } from 'lucide-react';
import { MapStatistics } from '@/types/customer';
import { formatCurrency } from '@/utils/mapUtils';

export default function StatisticsPanel({ statistics }: { statistics: MapStatistics }) {
  const { total, tn, kh, highPotential, totalRevenue, bySource, bySales, byRating } = statistics;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <BarChart2 className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-800">Thống kê khu vực</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Users}      label="Tổng số"       value={total}         color="blue" />
        <StatCard icon={TrendingUp} label="Tiềm năng"     value={tn}            color="amber" />
        <StatCard icon={UserCheck}  label="Khách hàng"    value={kh}            color="green" />
        <StatCard icon={Star}       label="Tiềm năng cao" value={highPotential} color="purple" />
      </div>

      {/* Revenue */}
      {totalRevenue > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-green-800">Tổng doanh thu</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">Từ {kh} khách hàng</p>
        </div>
      )}

      {/* By Source */}
      {Object.keys(bySource).length > 0 && (
        <BarList
          title="Theo nguồn"
          data={Object.entries(bySource).sort(([, a], [, b]) => b - a).slice(0, 8)}
          total={total}
          barColor="bg-amber-500"
          textColor="text-amber-600"
        />
      )}

      {/* By Rating */}
      {byRating.some((c) => c > 0) && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Phân bố đánh giá</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = byRating[star - 1] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs w-14 flex-shrink-0">{'⭐'.repeat(star)}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-16 text-right">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By Sales */}
      {Object.keys(bySales).length > 0 && (
        <BarList
          title="Theo sales"
          data={Object.entries(bySales).sort(([, a], [, b]) => b - a).slice(0, 8)}
          total={total}
          barColor="bg-blue-500"
          textColor="text-blue-600"
        />
      )}

      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Thống kê dựa trên khách hàng hiển thị trong vùng bản đồ hiện tại
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number;
  color: 'blue' | 'amber' | 'green' | 'purple';
}) {
  const styles = {
    blue:   { card: 'from-blue-50 to-blue-100 border-blue-200',     text: 'text-blue-700',   icon: 'text-blue-600' },
    amber:  { card: 'from-amber-50 to-amber-100 border-amber-200',   text: 'text-amber-700',  icon: 'text-amber-600' },
    green:  { card: 'from-green-50 to-green-100 border-green-200',   text: 'text-green-700',  icon: 'text-green-600' },
    purple: { card: 'from-purple-50 to-purple-100 border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
  }[color];

  return (
    <div className={`p-3 bg-gradient-to-br ${styles.card} border rounded-xl`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${styles.icon}`} />
        <span className={`text-xs font-medium ${styles.text}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${styles.icon}`}>{value}</p>
    </div>
  );
}

function BarList({ title, data, total, barColor, textColor }: {
  title: string; data: [string, number][]; total: number;
  barColor: string; textColor: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map(([key, count]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-700 truncate flex-1 mr-2">{key}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full`}
                  style={{ width: `${(count / total) * 100}%` }} />
              </div>
              <span className={`font-semibold ${textColor} w-8 text-right`}>{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 9. Component: MapContainer (Client)

> **Quan trọng**: Toàn bộ file này phải dùng `'use client'` và **được import với `dynamic({ ssr: false })`** từ component cha.

### `components/map/MapContainer.tsx`

```tsx
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { RefreshCw, MapPin } from 'lucide-react';
import { Customer } from '@/types/customer';
import { LEAFLET_CONFIG, getMarkerColor } from '@/config/leafletConfig';

// === Fix Leaflet default icon ===
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIconPng.src,
  shadowUrl: markerShadowPng.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// === Sub-components ===

function MapEventHandler({
  onBoundsChanged, setMapRef,
}: {
  onBoundsChanged?: (bounds: L.LatLngBounds) => void;
  setMapRef?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => { setMapRef?.(map); }, [map, setMapRef]);

  useMapEvents({
    moveend: () => onBoundsChanged?.(map.getBounds()),
    zoomend: () => onBoundsChanged?.(map.getBounds()),
  });
  return null;
}

function MapViewController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

/** Cluster markers layer */
function ClusterMarkers({
  customers, onMarkerClick, onViewDetail,
}: {
  customers: Customer[];
  onMarkerClick: (c: Customer) => void;
  onViewDetail: (c: Customer) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  const handleGetDirections = useCallback((customer: Customer) => {
    if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ định vị');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${customer.LAT},${customer.LONG}&travelmode=driving`;
        window.open(url, '_blank');
      },
      () => alert('Không thể lấy vị trí hiện tại')
    );
  }, []);

  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    // @ts-ignore – leaflet.markercluster không có types đầy đủ
    clusterRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        const color = count > 100 ? '#92400e' : count > 50 ? '#b45309' : count > 10 ? '#d97706' : '#f59e0b';
        return L.divIcon({
          html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40, true),
        });
      },
    });

    customers.forEach((customer) => {
      const lat = parseFloat(String(customer.LAT));
      const lng = parseFloat(String(customer.LONG));
      const color = getMarkerColor(customer);

      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><div style="width:8px;height:8px;background-color:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([lat, lng], { icon });

      // Popup DOM
      const popup = document.createElement('div');
      popup.style.minWidth = '280px';
      popup.innerHTML = `
        <div style="padding:12px">
          <h3 style="font-weight:bold;font-size:15px;margin-bottom:4px">${customer['TÊN CÔNG TY']}</h3>
          ${customer['ĐỊA CHỈ CÔNG TY'] ? `<p style="font-size:12px;color:#6b7280;margin-bottom:8px">📍 ${customer['ĐỊA CHỈ CÔNG TY']}</p>` : ''}
          <div style="display:flex;gap:8px;margin-bottom:10px">
            ${customer['ĐÁNH GIÁ TIỂM NĂNG'] ? `<span>⭐ ${customer['ĐÁNH GIÁ TIỂM NĂNG']}</span>` : ''}
            <span style="padding:2px 8px;border-radius:4px;font-size:12px;${customer['CHỐT THÀNH KH'] === 'KH' ? 'background:#d1fae5;color:#065f46' : 'background:#fef3c7;color:#92400e'}">
              ${customer['CHỐT THÀNH KH'] === 'KH' ? 'Khách hàng' : 'Tiềm năng'}
            </span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="detail-btn" style="flex:1;background:linear-gradient(to right,#f59e0b,#d97706);color:white;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px">👁️ Chi tiết</button>
            <button class="dir-btn" style="flex:1;background:linear-gradient(to right,#3b82f6,#2563eb);color:white;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px">🧭 Chỉ đường</button>
          </div>
        </div>
      `;

      popup.querySelector('.detail-btn')?.addEventListener('click', () => {
        marker.closePopup();
        onViewDetail(customer);
      });
      popup.querySelector('.dir-btn')?.addEventListener('click', () => handleGetDirections(customer));

      marker.bindPopup(popup);
      marker.on('click', () => onMarkerClick(customer));
      clusterRef.current!.addLayer(marker);
    });

    map.addLayer(clusterRef.current);
    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current); };
  }, [map, customers, onMarkerClick, onViewDetail, handleGetDirections]);

  return null;
}

/** Heatmap layer */
function HeatmapLayer({ customers }: { customers: Customer[] }) {
  const map = useMap();
  const heatRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    import('leaflet.heat').then(() => {
      if (heatRef.current) map.removeLayer(heatRef.current);
      const data = customers.map((c) => {
        const rating = (c['ĐÁNH GIÁ TIỂM NĂNG'] || '').length;
        const weight = c['CHỐT THÀNH KH'] === 'KH' ? 3 : rating >= 4 ? 2.5 : rating >= 2 ? 1.5 : 1;
        return [parseFloat(String(c.LAT)), parseFloat(String(c.LONG)), weight] as [number, number, number];
      });
      if ((L as any).heatLayer && data.length > 0) {
        heatRef.current = (L as any).heatLayer(data, {
          radius: 25, blur: 15, maxZoom: 17, max: 3.0,
          gradient: { 0.0: '#fbbf24', 0.5: '#f59e0b', 0.7: '#d97706', 1.0: '#92400e' },
        }).addTo(map);
      }
    }).catch(console.warn);
    return () => { if (heatRef.current) map.removeLayer(heatRef.current); };
  }, [customers, map]);

  return null;
}

// === Main Export ===

interface MapContainerProps {
  customers: Customer[];
  viewMode: 'cluster' | 'heatmap';
  center: { lat: number; lng: number };
  loading?: boolean;
  onMarkerClick: (c: Customer) => void;
  onViewDetail: (c: Customer) => void;
  onBoundsChanged?: (bounds: L.LatLngBounds) => void;
  setMapRef?: (map: L.Map) => void;
}

export default function MapContainer({
  customers, viewMode, center, loading,
  onMarkerClick, onViewDetail, onBoundsChanged, setMapRef,
}: MapContainerProps) {
  const [ready, setReady] = useState(false);

  // Delay mount để tránh SSR hydration issue
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!ready || loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bản đồ...</p>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có khách hàng trên bản đồ</h3>
          <p className="text-gray-600">Thử điều chỉnh bộ lọc hoặc thêm tọa độ cho khách hàng</p>
        </div>
      </div>
    );
  }

  return (
    <LeafletMap
      center={[center.lat, center.lng]}
      zoom={LEAFLET_CONFIG.mapOptions.zoom}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution={LEAFLET_CONFIG.tileLayer.attribution}
        url={LEAFLET_CONFIG.tileLayer.url}
      />
      <MapEventHandler onBoundsChanged={onBoundsChanged} setMapRef={setMapRef} />
      <MapViewController center={center} />
      {viewMode === 'cluster' && (
        <ClusterMarkers customers={customers} onMarkerClick={onMarkerClick} onViewDetail={onViewDetail} />
      )}
      {viewMode === 'heatmap' && <HeatmapLayer customers={customers} />}
    </LeafletMap>
  );
}
```

---

## 10. Page: CustomerMap

### `app/customer-map/page.tsx` — Server Component

```tsx
// Server Component: không có 'use client'
import { Suspense } from 'react';
import CustomerMapClient from './CustomerMapClient';
import { fetchCustomers, fetchNguonList } from './actions';

export const metadata = {
  title: 'Bản Đồ Khách Hàng | CRM',
  description: 'Xem phân bổ khách hàng tiềm năng và khách hàng trên bản đồ',
};

export default async function CustomerMapPage() {
  // Prefetch data on server (optional - có thể để client fetch)
  const [customers, nguonList] = await Promise.all([
    fetchCustomers(),
    fetchNguonList(),
  ]);

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CustomerMapClient
        initialCustomers={customers}
        initialNguonList={nguonList}
      />
    </Suspense>
  );
}
```

### `app/customer-map/CustomerMapClient.tsx` — Client Component

```tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Map, Filter, BarChart2, X, RefreshCw, Maximize2, MapPin, Flame } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FilterPanel from '@/components/map/FilterPanel';
import StatisticsPanel from '@/components/map/StatisticsPanel';
import { isValidCoordinate, getMapCenter, debounce } from '@/utils/mapUtils';
import { fetchCustomers } from './actions';
import type { Customer, MapFilters, MapStatistics, NguonKH } from '@/types/customer';
import type L from 'leaflet';

// ⚠️ Dynamic import - KHÔNG có SSR
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
);

const DEFAULT_STATS: MapStatistics = {
  total: 0, tn: 0, kh: 0, highPotential: 0, totalRevenue: 0,
  bySource: {}, bySales: {}, byRating: [0, 0, 0, 0, 0],
};

export default function CustomerMapClient({
  initialCustomers,
  initialNguonList,
}: {
  initialCustomers: Customer[];
  initialNguonList: NguonKH[];
}) {
  const hasLoadedRef = useRef(false);

  // Data
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(() =>
    initialCustomers.filter((c) => isValidCoordinate(c.LAT, c.LONG))
  );
  const [nguonList] = useState<NguonKH[]>(initialNguonList);

  // View
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap'>('cluster');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Filters
  const [filters, setFilters] = useState<MapFilters>({
    nguon: [], trangThai: [], danhGia: [], sales: [],
  });

  // Panels
  const [showFilters, setShowFilters] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Map
  const [mapCenter, setMapCenter] = useState(() => getMapCenter(
    initialCustomers.filter((c) => isValidCoordinate(c.LAT, c.LONG))
  ));
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [statistics, setStatistics] = useState<MapStatistics>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);

  // Mobile detection (client-only)
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) { setShowFilters(false); setShowStatistics(false); }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load dữ liệu (refresh)
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      if (Array.isArray(data)) {
        const withCoords = data.filter((c) => isValidCoordinate(c.LAT, c.LONG));
        setCustomers(data);
        setFilteredCustomers(withCoords);
        setMapCenter(getMapCenter(withCoords));

        const noCoords = data.length - withCoords.length;
        if (noCoords > 0) toast.warning(`${noCoords} khách hàng chưa có tọa độ`, { autoClose: 5000 });
        toast.success(`Đã tải ${withCoords.length} khách hàng lên bản đồ`);
      }
    } catch {
      toast.error('Không thể tải dữ liệu khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    let result = customers.filter((c) => isValidCoordinate(c.LAT, c.LONG));
    if (filters.nguon.length)     result = result.filter((c) => filters.nguon.includes(c['NGUỒN'] ?? ''));
    if (filters.trangThai.length) result = result.filter((c) => filters.trangThai.includes(c['CHỐT THÀNH KH'] ?? ''));
    if (filters.danhGia.length)   result = result.filter((c) => filters.danhGia.includes(c['ĐÁNH GIÁ TIỂM NĂNG'] ?? ''));
    if (filters.sales.length)     result = result.filter((c) => filters.sales.includes(c['SALES PHỤ TRÁCH'] ?? ''));
    setFilteredCustomers(result);
  }, [customers, filters]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  // Calculate statistics
  const calculateStatistics = useCallback((customers: Customer[], bounds?: L.LatLngBounds) => {
    const inView = bounds?.contains
      ? customers.filter((c) => {
          if (!isValidCoordinate(c.LAT, c.LONG)) return false;
          return bounds.contains([parseFloat(String(c.LAT)), parseFloat(String(c.LONG))]);
        })
      : customers;

    const stats: MapStatistics = {
      total: inView.length,
      tn: inView.filter((c) => c['CHỐT THÀNH KH'] === 'TN').length,
      kh: inView.filter((c) => c['CHỐT THÀNH KH'] === 'KH').length,
      highPotential: inView.filter((c) => (c['ĐÁNH GIÁ TIỂM NĂNG'] || '').length >= 4).length,
      totalRevenue: inView
        .filter((c) => c['CHỐT THÀNH KH'] === 'KH')
        .reduce((sum, c) => sum + (parseFloat(String(c['SỐ TIỀN'])) || 0), 0),
      bySource: {}, bySales: {}, byRating: [0, 0, 0, 0, 0],
    };
    inView.forEach((c) => {
      const src = c['NGUỒN'] || 'Khác';
      stats.bySource[src] = (stats.bySource[src] || 0) + 1;
      const sales = c['SALES PHỤ TRÁCH'] || 'Chưa phân công';
      stats.bySales[sales] = (stats.bySales[sales] || 0) + 1;
      const r = (c['ĐÁNH GIÁ TIỂM NĂNG'] || '').length;
      if (r > 0 && r <= 5) stats.byRating[r - 1]++;
    });
    setStatistics(stats);
  }, []);

  const debouncedBoundsChange = useMemo(
    () => debounce((bounds: L.LatLngBounds) => calculateStatistics(filteredCustomers, bounds), 500),
    [filteredCustomers, calculateStatistics]
  );

  // Fit map to markers
  const handleFitBounds = useCallback(() => {
    if (!mapRef || filteredCustomers.length === 0) return;
    const L = (window as any).L;
    const bounds = L.latLngBounds(
      filteredCustomers.map((c) => [parseFloat(String(c.LAT)), parseFloat(String(c.LONG))])
    );
    mapRef.fitBounds(bounds);
  }, [mapRef, filteredCustomers]);

  const salesList = useMemo(() =>
    [...new Set(customers.map((c) => c['SALES PHỤ TRÁCH']).filter(Boolean))] as string[],
    [customers]
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-amber-600" />
            <h1 className="text-xl font-bold text-gray-800">Bản Đồ Khách Hàng</h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
              {filteredCustomers.length} khách hàng
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="hidden md:flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(['cluster', 'heatmap'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'cluster'
                    ? <><MapPin className="h-4 w-4 inline mr-1" />Cluster</>
                    : <><Flame className="h-4 w-4 inline mr-1" />Heatmap</>
                  }
                </button>
              ))}
            </div>

            <button onClick={handleFitBounds} title="Fit all markers"
              className="p-2 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Maximize2 className="h-5 w-5" />
            </button>
            <button onClick={loadCustomers} title="Refresh"
              className="p-2 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isMobile && (
              <>
                <button onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-lg">
                  <Filter className="h-5 w-5" />
                </button>
                <button onClick={() => setShowStatistics(!showStatistics)}
                  className="p-2 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-lg">
                  <BarChart2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Filter Sidebar */}
        {!isMobile && showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <FilterPanel filters={filters} onFilterChange={setFilters}
              onClearFilters={() => setFilters({ nguon: [], trangThai: [], danhGia: [], sales: [] })}
              nguonList={nguonList} salesList={salesList} customerCount={filteredCustomers.length} />
          </div>
        )}

        {/* Mobile Filter Drawer */}
        {isMobile && (
          <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Bộ lọc</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FilterPanel filters={filters} onFilterChange={setFilters}
                  onClearFilters={() => setFilters({ nguon: [], trangThai: [], danhGia: [], sales: [] })}
                  nguonList={nguonList} salesList={salesList} customerCount={filteredCustomers.length} />
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            customers={filteredCustomers}
            viewMode={viewMode}
            center={mapCenter}
            loading={loading}
            onMarkerClick={setSelectedCustomer}
            onViewDetail={(c) => { setDetailCustomer(c); setShowDetailModal(true); setSelectedCustomer(null); }}
            onBoundsChanged={debouncedBoundsChange}
            setMapRef={setMapRef}
          />
        </div>

        {/* Desktop Statistics Sidebar */}
        {!isMobile && showStatistics && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <StatisticsPanel statistics={statistics} />
          </div>
        )}

        {/* Mobile Statistics Bottom Sheet */}
        {isMobile && (
          <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${showStatistics ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ maxHeight: '60vh' }}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Thống kê</h2>
                <button onClick={() => setShowStatistics(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StatisticsPanel statistics={statistics} />
              </div>
            </div>
          </div>
        )}

        {/* Mobile overlay */}
        {isMobile && (showFilters || showStatistics) && (
          <div className="fixed inset-0 bg-black/50 z-40"
            onClick={() => { setShowFilters(false); setShowStatistics(false); }} />
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailCustomer && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={() => { setShowDetailModal(false); setDetailCustomer(null); }} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto pointer-events-auto bg-white rounded-2xl p-6">
              {/* CustomerDetailModal goes here */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{detailCustomer['TÊN CÔNG TY']}</h2>
                <button onClick={() => { setShowDetailModal(false); setDetailCustomer(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              {/* Thêm nội dung chi tiết khách hàng vào đây */}
            </div>
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
```

---

## 11. Layout & Responsive Mobile

### Pattern Mobile Drawer (Filter)

```
Desktop: Sidebar w-80 cố định bên trái bản đồ
Mobile:  fixed inset-y-0 left-0 z-50 + translate-x-full (ẩn) / translate-x-0 (hiện)
         + overlay bg-black/50 để click ra ngoài đóng lại
```

### Pattern Mobile Bottom Sheet (Statistics)

```
Desktop: Sidebar w-80 cố định bên phải bản đồ  
Mobile:  fixed inset-x-0 bottom-0 z-50 + translate-y-full (ẩn) / translate-y-0 (hiện)
         maxHeight: 60vh để không che toàn màn hình
```

---

## 12. Các Gotcha Phổ Biến

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| `window is not defined` | Leaflet chạy trên server | `dynamic(..., { ssr: false })` |
| Icon marker bị vỡ / không hiện | Webpack không bundle được đúng path ảnh | Dùng `L.Icon.Default.mergeOptions` với `.src` |
| Bản đồ không render khi navigate back | React StrictMode + useEffect cleanup | Dùng `useRef` flag `hasLoadedRef` để load 1 lần |
| Popup button không click được | React event không attach được vào DOM thuần | Dùng `element.addEventListener` thay vì React onClick |
| Thống kê không cập nhật khi pan | Cần debounce bounds-change | `debounce(fn, 500ms)` bọc `onBoundsChanged` |
| `leaflet.heat` không có types | Package không khai báo types | `@ts-ignore` hoặc tạo `.d.ts` thủ công |
| CSS của Leaflet bị missing | Next.js không import CSS từ node_modules mặc định | Thêm `transpilePackages` vào `next.config.ts` |

---

> **Tóm tắt nhanh các file cần tạo:**
> 1. `next.config.ts` — transpilePackages
> 2. `types/customer.ts` — interfaces
> 3. `config/leafletConfig.ts` — tile layer, getMarkerColor
> 4. `utils/mapUtils.ts` — isValidCoordinate, getMapCenter, debounce, formatCurrency
> 5. `app/customer-map/actions.ts` — Server Actions
> 6. `components/map/FilterPanel.tsx`
> 7. `components/map/StatisticsPanel.tsx`
> 8. `components/map/MapContainer.tsx` — `'use client'` + full Leaflet logic
> 9. `app/customer-map/page.tsx` — Server Component
> 10. `app/customer-map/CustomerMapClient.tsx` — `'use client'` + state management
