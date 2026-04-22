# Quy Chuẩn UI/UX cho mỗi Module Mới

Khi tạo bất kỳ module/trang quản lý mới nào, **BẮT BUỘC** phải tuân thủ tất cả các pattern dưới đây.
Lấy module **Khách hàng** (`src/features/khach-hang/`) làm chuẩn mẫu tham chiếu.

---

## 1. Toolbar & Mobile Filter Toggle + View Toggle

### Nguyên tắc
- Desktop: Thanh tìm kiếm + các filter + nút chức năng hiển thị trên cùng một dòng.
- Mobile (< lg): Chỉ hiển thị **thanh tìm kiếm** + **nút toggle List/Card** + **nút toggle Settings2**. Các filter và nút chức năng ẩn trong panel mở rộng.
- **Toolbar gradient**: Nền chuyển màu dọc `bg-linear-to-b from-primary/3 to-primary/8`, border `border-primary/10`.

### Cấu trúc JSX chuẩn (PageClient)

```tsx
// Import bắt buộc
import { useState } from "react";
import { Download, Settings2, LayoutList, LayoutGrid } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";

// State bắt buộc
const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
const [showFilters, setShowFilters] = useState(false);
const [viewMode, setViewMode] = useState<"list" | "card">("list");

// JSX Toolbar — nền gradient dọc
<div className="p-5 flex flex-col gap-4 text-sm font-medium border-b border-primary/10 bg-linear-to-b from-primary/3 to-primary/8">
    <div className="flex items-center justify-between gap-3 w-full">
        {/* Search - luôn hiển thị */}
        <div className="flex-1 w-full lg:max-w-[400px]">
            <SearchInput placeholder="Tìm..." />
        </div>

        {/* Mobile: Toggle View + Toggle Filter */}
        <div className="flex lg:hidden shrink-0 gap-2">
            {/* Toggle List/Card */}
            <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                    title="Dạng bảng"
                >
                    <LayoutList className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setViewMode("card")}
                    className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                    title="Dạng thẻ"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border border-border rounded-lg transition-colors shadow-sm flex items-center justify-center ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                title="Tùy chọn & Thao tác"
            >
                <Settings2 className="w-5 h-5" />
            </button>
        </div>

        {/* Desktop - filter + nút chức năng */}
        <div className="hidden lg:flex items-center gap-3 w-auto">
            <FilterSelect paramKey="..." options={...} placeholder="..." />
            <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
            <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex shrink-0" title="Xuất Excel">
                <Download className="w-4 h-4" />
            </button>
        </div>
    </div>

    {/* Mobile Expanded Filters */}
    {showFilters && (
        <div className="flex lg:hidden flex-col gap-3 w-full bg-muted/30 p-4 rounded-xl border border-border animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex flex-col gap-3 w-full">
                <FilterSelect paramKey="..." options={...} placeholder="..." />
            </div>
            <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-border w-full">
                <ColumnToggleButton visibleColumns={visibleColumns} onChange={setVisibleColumns} />
                <button className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg transition-colors shadow-sm flex" title="Xuất Excel">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    )}
</div>

// Truyền viewMode prop xuống List component
<[Tên]List ... viewMode={viewMode} />
```

---

## 2. Sort trên tiêu đề bảng (Table Header Sort)

### Nguyên tắc
- Các cột text/ngày quan trọng phải có khả năng sort khi click vào header.
- Click lần 1 = ASC (↑), click lần 2 = DESC (↓).
- Hiển thị icon `ArrowUpDown` (mờ) khi chưa sort, `ArrowUp`/`ArrowDown` (màu primary) khi đang sort.
- Sort phải áp dụng cho cả Desktop table VÀ Mobile card list.

### Code chuẩn (trong List component)

```tsx
import { useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// State
const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

// Sorted data
const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
        let aVal: any, bVal: any;
        // Xử lý riêng cho trường ngày tháng
        if (sortConfig.key === 'NGAY_...' || sortConfig.key.startsWith('NGAY_')) {
            aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
            bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
        } else {
            aVal = (a[sortConfig.key] || '').toString().toLowerCase();
            bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}, [data, sortConfig]);

// Handle sort
const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
};

// Sort Icon component
const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-40 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc'
        ? <ArrowUp className="w-3 h-3 ml-1 inline-block text-primary" />
        : <ArrowDown className="w-3 h-3 ml-1 inline-block text-primary" />;
};

// Sử dụng trong <thead>
<th onClick={() => handleSort('TEN')} className="... cursor-pointer group hover:text-foreground">
    Tên <SortIcon columnKey="TEN" />
</th>

// Sử dụng sortedData thay vì data gốc cho CẢ desktop table VÀ mobile cards
{sortedData.map((item) => (...))}
```

---

## 3. Table Header & Row Styling

### Nguyên tắc
- Header row: `bg-primary/10` (solid, KHÔNG dùng gradient ngang — bị lỗi trên mobile khi scroll)
- Header text: `font-bold text-muted-foreground tracking-widest text-[12px]`
- Data row: `hover:bg-muted/30 transition-colors`
- Cột STT (#) luôn hiển thị nếu có
- Cột "Hành động" luôn ở cuối, căn phải

```tsx
<tr className="border-b border-border bg-primary/10">
    <th className="h-11 px-4 align-middle font-bold text-muted-foreground tracking-widest text-[12px]">
        ...
    </th>
</tr>
```

---

## 4. Desktop/Mobile Dual Layout + Toggle View Mode

### Nguyên tắc
- Desktop (≥lg): **Luôn hiện bảng** `<table>` bất kể viewMode
- Mobile (<lg): **Người dùng chọn** giữa List (bảng) hoặc Card qua toggle buttons
- Card view trên mobile phải có **ĐẦY ĐỦ tất cả nút hành động** giống bảng (Xem, Tạo cơ hội, Kế hoạch, Người liên hệ, Sửa, Xóa)
- Cả hai layout phải hiển thị cùng dữ liệu (đã sort/filter)

### List component nhận prop viewMode

```tsx
interface Props {
    // ... các props khác
    viewMode?: "list" | "card";
}

export default function List({ ..., viewMode = "list" }: Props) {
    return (
        <>
            {/* Card View - Mobile only, khi viewMode === "card" */}
            {viewMode === "card" && (
                <div className="p-4 space-y-3 lg:hidden">
                    {sortedData.map((item) => (
                        <div
                            key={item.ID}
                            onClick={() => setViewItem(item)}
                            className="rounded-xl border border-border bg-card p-4 space-y-3 transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
                        >
                            {/* Header: Avatar + Tên + Badge */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Avatar/Icon */}
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <UserCircle className="w-5 h-5 text-primary/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{item.TEN}</p>
                                        {/* Nhóm/Tag */}
                                    </div>
                                </div>
                                <div className="shrink-0">{/* Badge phân loại */}</div>
                            </div>

                            {/* Info rows: grid 2 cột */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                {/* Các thông tin: SĐT, Email, Ngày, NV phụ trách... */}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Phone className="w-3 h-3 shrink-0 text-primary/50" />
                                    <span>{item.DIEN_THOAI}</span>
                                </div>
                            </div>

                            {/* Footer: Actions - ĐẦY ĐỦ NÚT */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    {/* Nguồn/Info phụ */}
                                </div>
                                <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                    {/* TẤT CẢ nút hành động: Eye, Target, CalendarPlus2, UserPlus, Edit2, Trash2 */}
                                    {/* Mỗi nút: p-1.5 hover:bg-muted rounded-lg transition-colors */}
                                    {/* BỌC bằng PermissionGuard tương ứng */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table View - ẩn trên mobile khi đang xem card */}
            <div className={viewMode === "card" ? "hidden lg:block" : ""}>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-sm max-md:whitespace-nowrap md:whitespace-normal">
                        ...
                    </table>
                </div>
            </div>
        </>
    );
}
```

### ⚠️ Quy tắc quan trọng cho Card View:
- **KHÔNG được cắt bớt nút hành động** — Card view phải có ĐẦY ĐỦ các nút giống bảng
- Nút hành động trong card dùng `p-1.5` (nhỏ hơn bảng) + icon `w-3.5 h-3.5`
- Mỗi nút phải bọc `PermissionGuard` đúng moduleKey/level
- Click vào card body → mở chi tiết; click vào nút → thực hiện action (dùng `e.stopPropagation()`)

---

## 5. ColumnToggleButton

### Nguyên tắc
Mỗi module cần có file `ColumnToggleButton.tsx` riêng, cho phép user ẩn/hiện cột:

```tsx
// Định nghĩa các cột
export type ColumnKey = 'col1' | 'col2' | 'col3';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'col1', label: 'Cột 1' },
    { key: 'col2', label: 'Cột 2' },
    { key: 'col3', label: 'Cột 3' },
];
```

---

## 6. Modal & Form Styling (Component `Modal` chung — BẮT BUỘC)

### Nguyên tắc CỐT LÕI
- **BẮT BUỘC** dùng component `Modal` chung tại `@/components/Modal`.
- **CẤM** tự viết `div.fixed.inset-0` hoặc bất kỳ modal overlay custom nào.
- Nút Hủy + Submit phải ở **`footer` prop** — **CẤM** để trong body/form.
- Nút trong footer phải **compact, align-right** (không `flex-1`).

### Props của Modal

| Prop | Type | Mô tả |
|------|------|--------|
| `isOpen` | `boolean` | Điều khiển hiển thị |
| `onClose` | `() => void` | Callback khi đóng (X, ESC, click overlay) |
| `title` | `string` | Tiêu đề chính |
| `subtitle?` | `string` | Mô tả phụ dưới title |
| `icon?` | `ElementType` | Icon lucide-react (hiển thị trong khung tròn) |
| `headerContent?` | `ReactNode` | Thay thế hoàn toàn title/icon mặc định |
| `children` | `ReactNode` | Nội dung body |
| `footer?` | `ReactNode` | Footer cố định dưới cùng |
| `size?` | `'md' \| 'lg' \| 'xl' \| '2xl'` | Chiều rộng (default: `md`) |
| `fullHeight?` | `boolean` | Header/footer cố định, body scroll |

### Code chuẩn — Modal đơn giản (Thêm/Sửa)

```tsx
import Modal from '@/components/Modal';
import { Tags } from 'lucide-react';

<Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Thêm phân loại mới"
    icon={Tags}
    footer={
        <>
            <span />
            <div className="flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-premium-secondary">Hủy</button>
                <button type="button" onClick={() => (document.querySelector('#form-add') as HTMLFormElement)?.requestSubmit()} disabled={loading} className="btn-premium-primary">
                    {loading ? "Đang xử lý..." : "Lưu"}
                </button>
            </div>
        </>
    }
>
    <form id="form-add" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Tên trường</label>
            <input name="..." className="input-modern" />
        </div>
    </form>
</Modal>
```

### Code chuẩn — Modal fullHeight (nhiều nội dung, bảng dữ liệu)

```tsx
<Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Chi tiết kế hoạch"
    icon={CalendarCheck2}
    size="xl"
    fullHeight
    footer={
        <>
            <span className="text-xs text-muted-foreground">
                Tổng: <strong>{items.length}</strong> mục
            </span>
            <div className="flex gap-3">
                <button onClick={onClose} className="btn-premium-secondary">Đóng</button>
                <button onClick={handleSave} className="btn-premium-primary">Lưu</button>
            </div>
        </>
    }
>
    {/* Body sẽ tự scroll */}
    <div className="space-y-4">...</div>
</Modal>
```

### Quy tắc Footer

| ✅ Đúng | ❌ Sai |
|---------|--------|
| Nút trong `footer` prop | Nút `flex-1` trong body form |
| `<span />` để đẩy nút sang phải | `<div className="flex gap-4 pt-4 mt-auto">` trong form |
| `btn-premium-secondary` + `btn-premium-primary` compact | Nút full-width 2 cột trải đều |
| `requestSubmit()` qua `document.querySelector('#form-id')` | `type="submit"` trực tiếp (vì nút nằm ngoài form) |

### Quy tắc Form trong Modal

- Form phải có `id="form-xxx"` để footer button `requestSubmit()` được.
- Class form: `className="space-y-4"` (KHÔNG `flex flex-col` hay `pt-4`).
- Label: `text-sm font-semibold text-muted-foreground` (KHÔNG `uppercase`).
- Input: class `input-modern`.
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4` (hoặc `gap-6` cho form lớn).

### Checklist Modal cho feature mới
- [ ] Import `Modal` từ `@/components/Modal`
- [ ] Mỗi modal phải có `icon` (chọn icon lucide-react phù hợp)
- [ ] Có `subtitle` mô tả ngắn nếu cần
- [ ] Nút Hủy + Submit nằm trong `footer` prop
- [ ] Footer nút align-right: `<span />` + `<div className="flex gap-3">...</div>`
- [ ] Form có `id` unique, nút submit dùng `requestSubmit()`
- [ ] Modal nhiều nội dung dùng `fullHeight` + `size="lg"` trở lên
- [ ] **KHÔNG** tạo custom modal div

---

## 7. Mobile Action Dropdown

### Nguyên tắc
- Desktop: Hiển thị các nút action riêng lẻ (Sửa, Xóa)
- Mobile: Gộp vào `DropdownMenu` với icon `MoreHorizontal`

```tsx
{/* Desktop Actions */}
<div className="hidden md:flex gap-1">
    <PermissionGuard moduleKey="..." level="edit">
        <button>...</button>
    </PermissionGuard>
</div>

{/* Mobile Actions Dropdown */}
<div className="md:hidden">
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button><MoreHorizontal className="w-4 h-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 rounded-xl">
            ...
        </DropdownMenuContent>
    </DropdownMenu>
</div>
```

---

## 8. Filter qua URL (useSearchParams)

### Nguyên tắc
- **KHÔNG** dùng `useState` cho filter. Filter phải đồng bộ qua URL.
- Dùng `useSearchParams` để đọc, `router.replace(?)` để cập nhật.
- Component `<FilterSelect>` và `<SearchInput>` đã xử lý logic này sẵn.

---

## Tham Chiếu (Các module mẫu)
- **Khách hàng** (mẫu chuẩn nhất): `src/features/khach-hang/`
- **Hàng hóa**: `src/features/hang-hoa/`
- **Nhân viên**: `src/features/nhan-vien/`
- **Gói giá**: `src/features/goi-gia/`
- **Giá nhập**: `src/features/gia-nhap/`

---

## 9. Stat Cards (Thẻ thống kê) — Multi-Color System + Client Component

### Nguyên tắc
- Mỗi trang quản lý **phải có stat cards** dạng grid nằm giữa header và bảng.
- **BẮT BUỘC** tách stat cards thành **Client Component** riêng (VD: `StatCards.tsx`).
- **KHÔNG ĐƯỢC** dùng `<Link>` cho stat cards — gây delay do full server re-render.
- Dùng `useTransition` + `router.replace` để navigate nhanh, non-blocking.
- Hiển thị `Loader2 animate-spin` trên card active khi đang loading.
- Layout: `grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4` (hoặc `lg:grid-cols-4` nếu 4 cards)
- **Multi-color accent system**: Mỗi card dùng MÀU CỐ ĐỊNH (inline style) để luôn nhất quán qua các theme:
  - 🟣 Card 1: **Indigo** `#6366f1` (Tổng)
  - 🟢 Card 2: **Emerald** `#10b981`
  - 🟡 Card 3: **Amber** `#f59e0b`
  - 🟣 Card 4: **Violet** `#8b5cf6`
  - 🔴 Card 5: **Red** `#ef4444` (nếu có 5 cards)
- **Icon**: Nền solid color + icon trắng (`w-10 h-10 md:w-11 md:h-11 rounded-xl`)
- **Card background**: Luôn có tint nhẹ `rgba(color, 0.06)`
- **Active state**: Border đậm + shadow `0 4px 12px ${color}20`
- **Text label KHÔNG dùng `truncate`** — cho phép xuống dòng

### Code chuẩn — StatCards Client Component (Multi-Color)

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Users2, UserCheck, UserX, UserCog, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    stats: {
        total: number;
        // ... các thống kê khác
    };
}

const statCards = [
    {
        label: "Tổng số",
        key: "total" as const,
        icon: Users2,
        iconBg: "#6366f1",       // indigo-500
        cardBg: "rgba(99, 102, 241, 0.16)",
        borderActive: "#6366f1",
        filterVal: "all",
    },
    {
        label: "Thống kê 2",
        key: "val2" as const,
        icon: UserPlus,
        iconBg: "#10b981",       // emerald-500
        cardBg: "rgba(16, 185, 129, 0.16)",
        borderActive: "#10b981",
        filterVal: "Filter2",
    },
    {
        label: "Thống kê 3",
        key: "val3" as const,
        icon: UserCog,
        iconBg: "#f59e0b",       // amber-500
        cardBg: "rgba(245, 158, 11, 0.16)",
        borderActive: "#f59e0b",
        filterVal: "Filter3",
    },
    {
        label: "Thống kê 4",
        key: "val4" as const,
        icon: UserCheck,
        iconBg: "#8b5cf6",       // violet-500
        cardBg: "rgba(139, 92, 246, 0.16)",
        borderActive: "#8b5cf6",
        filterVal: "Filter4",
    },
];

export default function StatCards({ stats }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentFilter = searchParams.get("TRANG_THAI") || "all";

    const handleCardClick = (filterVal: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterVal === "all") { params.delete("TRANG_THAI"); }
        else { params.set("TRANG_THAI", filterVal); }
        params.delete("page");
        const queryStr = params.toString();
        const href = `/[ten-tinh-nang]${queryStr ? `?${queryStr}` : ""}`;
        startTransition(() => { router.replace(href); });
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((stat) => {
                const isActive = stat.filterVal === "all"
                    ? (!currentFilter || currentFilter === "all")
                    : currentFilter === stat.filterVal;

                return (
                    <button
                        key={stat.label}
                        onClick={() => handleCardClick(stat.filterVal)}
                        disabled={isPending}
                        className={cn(
                            "group relative rounded-xl p-3.5 md:p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer text-left overflow-hidden border",
                            isActive
                                ? "shadow-md scale-[1.02]"
                                : "hover:shadow-md hover:-translate-y-0.5",
                            isPending && "opacity-70"
                        )}
                        style={{
                            backgroundColor: stat.cardBg,
                            borderColor: isActive ? stat.borderActive : "transparent",
                            boxShadow: isActive ? `0 4px 12px ${stat.borderActive}20` : undefined,
                        }}
                    >
                        {/* Icon — nền solid color, icon trắng */}
                        <div
                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: stat.iconBg }}
                        >
                            {isPending && isActive ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <stat.icon className="w-5 h-5 text-white" />
                            )}
                        </div>

                        {/* Content — KHÔNG truncate, cho phép xuống dòng */}
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                            <p className="text-xl md:text-2xl font-bold text-foreground leading-none mt-1">{stats[stat.key]}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
```

### Sử dụng trong page.tsx (Server Component)

```tsx
// page.tsx — Server Component
import StatCards from "@/features/[ten-tinh-nang]/components/StatCards";

// KHÔNG import Link cho stat cards!

export default async function Page({ searchParams }) {
    const stats = await getStats();
    return (
        <PermissionGuard moduleKey="..." level="view" showNoAccess>
            <StatCards stats={stats} />
            <PageClient data={data} />
        </PermissionGuard>
    );
}
```

### Tại sao KHÔNG dùng `<Link>`?
- `<Link>` gây **full server re-render** toàn bộ page → tất cả API calls chạy lại → delay 1-3 giây
- `useTransition` cho phép **UI phản hồi ngay lập tức** (spinner) trong khi server fetch data mới
- Kết hợp với `loading.tsx`, user thấy skeleton thay vì màn hình đơ

### Gợi ý thống kê theo module
- **Tổng bản ghi** (luôn có) — dùng `pagination.total` hoặc `data.length`
- **Số nhóm/phân loại unique** — dùng `new Set(data.map(...)).size`
- **Giá trung bình** — format bằng `new Intl.NumberFormat('vi-VN').format(value) + ' ₫'`
- **Có [field]** — đếm bản ghi có field không rỗng
- **Mới tháng này** — filter theo `CREATED_AT`

---

## 10. Label viết hoa chữ đầu

### Nguyên tắc
- Tất cả label trong form (modal thêm/sửa) **phải viết hoa chữ cái đầu tiên**.
- Ví dụ: `Ngày hiệu lực`, `Mã NCC`, `Tên hàng hóa` — **KHÔNG** viết `ngày hiệu lực`, `mã NCC`.
- Class label chuẩn: `text-sm font-semibold text-muted-foreground` (KHÔNG `uppercase`).

---

## 11. Format tiền tệ (Currency Input)

### Nguyên tắc
- Các trường đơn giá/giá tiền **phải hiển thị dấu phân cách hàng nghìn** khi nhập.
- Dùng `type="text"` + `inputMode="numeric"` thay vì `type="number"`.
- Format hiển thị bằng `new Intl.NumberFormat('vi-VN').format(value)`.
- Lưu giá trị thô (number) trong state riêng, hiển thị giá trị format trong input.

### Code chuẩn

```tsx
const [donGiaValue, setDonGiaValue] = useState(0);
const [donGiaDisplay, setDonGiaDisplay] = useState('');

const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setDonGiaValue(num);
    setDonGiaDisplay(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
};

<input
    type="text"
    inputMode="numeric"
    placeholder="VD: 1,234,500"
    value={donGiaDisplay}
    onChange={handleDonGiaChange}
/>
// Submit: sử dụng donGiaValue (number) để gửi về server
```

---

## 12. Loading Skeleton (loading.tsx) — BẮT BUỘC

### Nguyên tắc
- **MỌI trang quản lý** phải có file `loading.tsx` trong thư mục route.
- Next.js sẽ tự động hiển thị loading skeleton khi URL thay đổi (click card filter, chuyển trang, v.v.).
- Skeleton phải phản ánh đúng layout của trang thực: header, stat cards, toolbar, table rows.
- Dùng `animate-pulse` trên các khối `bg-muted`.

### Code chuẩn

```tsx
// src/app/(dashboard)/[ten-tinh-nang]/loading.tsx
export default function Loading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            {/* Header skeleton */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="h-8 w-72 bg-muted rounded-lg animate-pulse" />
                        <div className="h-4 w-56 bg-muted rounded mt-2 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
                        <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Stat Cards skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="h-3.5 w-20 bg-muted rounded animate-pulse" />
                                <div className="h-6 w-10 bg-muted rounded animate-pulse mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Card skeleton */}
            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
                <div className="p-5 flex items-center gap-3 border-b">
                    <div className="h-9 flex-1 max-w-[400px] bg-muted rounded-lg animate-pulse" />
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="h-9 w-[160px] bg-muted rounded-md animate-pulse" />
                        <div className="h-9 w-[160px] bg-muted rounded-md animate-pulse" />
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                            <div className="h-4 flex-2 bg-muted rounded animate-pulse" />
                            <div className="h-4 flex-1 bg-muted rounded animate-pulse hidden md:block" />
                            <div className="h-6 w-20 bg-muted rounded-full animate-pulse hidden md:block" />
                            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
```

### Tham chiếu
- **Khách hàng**: `src/app/(dashboard)/khach-hang/loading.tsx`
- **Kế hoạch CSKH**: `src/app/(dashboard)/ke-hoach-cs/loading.tsx`

---

## 13. Pagination + Global PageSize (BẮT BUỘC)

### Nguyên tắc
- Mỗi trang danh sách **PHẢI** có component `Pagination` đi kèm dropdown chọn số dòng/trang (10/20/50/100).
- **LUÔN hiển thị** Pagination — KHÔNG check `totalPages > 1` vì user cần thấy dropdown chọn số dòng.
- Số dòng/trang được quản lý **global** qua `PreferencesPopover` → lưu cookie `pnsolar-rows-per-page`.
- Server pages đọc giá trị global qua helper `getRowsPerPage()`.

### Thứ tự ưu tiên đọc pageSize
1. `?pageSize=X` trên URL (cao nhất — khi user đổi ở dropdown Pagination)
2. Cookie `pnsolar-rows-per-page` (từ PreferencesPopover — global)
3. Default value (param thứ 2 của `getRowsPerPage()`, mặc định = 10)

### Code chuẩn — Server Page (`page.tsx`)

```tsx
import Pagination from '@/components/Pagination';
import { getRowsPerPage } from '@/lib/getRowsPerPage';

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string; page?: string; pageSize?: string }> }) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const pageSize = await getRowsPerPage(params.pageSize); // Đọc global

    const { data = [], pagination } = await getItems({ page, limit: pageSize, query: params.query });

    return (
        <PermissionGuard moduleKey="..." level="view" showNoAccess>
            <ItemPageClient data={data} pageSize={pageSize} />

            {pagination && (
                <div className="p-4 border-t flex justify-center items-center bg-transparent">
                    <Pagination
                        totalPages={pagination.totalPages}
                        currentPage={page}
                        total={pagination.total}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </PermissionGuard>
    );
}
```

### Code chuẩn — Client Component nhận pageSize

```tsx
// Nếu Pagination nằm trong Client Component
interface Props {
    data: Item[];
    pageSize: number; // Nhận từ server page
    pagination: any;
    currentPage: number;
}

export default function ItemClient({ data, pageSize, pagination, currentPage }: Props) {
    return (
        <div>
            {/* ... table/card ... */}

            {/* Pagination - LUÔN hiển thị */}
            {pagination && (
                <div className="px-5 py-4 border-t">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </div>
    );
}
```

### Ghi chú kỹ thuật
- `getRowsPerPage()` nằm tại `src/lib/getRowsPerPage.ts`, dùng `cookies()` từ `next/headers`.
- Khi user đổi pageSize ở dropdown Pagination, tự động sync vào cookie + localStorage.
- PreferencesPopover cũng đọc/ghi `rowsPerPage` qua ThemeProvider context.
- **KHÔNG** tạo component `LimitSelect`/`PageSizeSelect` riêng — Pagination đã tích hợp sẵn.

### Checklist
- [ ] Import `getRowsPerPage` trong server page
- [ ] `const pageSize = await getRowsPerPage(params.pageSize);`
- [ ] Truyền `limit: pageSize` vào hàm fetch data
- [ ] Truyền `pageSize={pageSize}` vào `<Pagination>`
- [ ] **LUÔN** hiển thị Pagination (KHÔNG `totalPages > 1`)
- [ ] searchParams type có `pageSize?: string`
