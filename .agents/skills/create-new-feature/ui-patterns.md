# Quy Chuẩn UI/UX cho mỗi Module Mới

Khi tạo bất kỳ module/trang quản lý mới nào, **BẮT BUỘC** phải tuân thủ tất cả các pattern dưới đây.
Lấy module **Khách hàng** (`src/features/khach-hang/`) làm chuẩn mẫu tham chiếu.

---

## 1. Toolbar & Mobile Filter Toggle

### Nguyên tắc
- Desktop: Thanh tìm kiếm + các filter + nút chức năng hiển thị trên cùng một dòng.
- Mobile (< lg): Chỉ hiển thị **thanh tìm kiếm** + **nút toggle Settings2**. Các filter và nút chức năng ẩn trong panel mở rộng.

### Cấu trúc JSX chuẩn (PageClient)

```tsx
// Import bắt buộc
import { useState } from "react";
import { Download, Settings2 } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import FilterSelect from "@/components/FilterSelect";
import ColumnToggleButton, { type ColumnKey } from "./ColumnToggleButton";

// State bắt buộc
const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
const [showFilters, setShowFilters] = useState(false);

// JSX Toolbar
<div className="p-5 flex flex-col gap-4 text-sm font-medium border-b bg-transparent">
    <div className="flex items-center justify-between gap-3 w-full">
        {/* Search - luôn hiển thị */}
        <div className="flex-1 w-full lg:max-w-[400px]">
            <SearchInput placeholder="Tìm..." />
        </div>
        
        {/* Nút toggle - CHỈ mobile */}
        <div className="flex lg:hidden shrink-0">
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
- Header row: `bg-primary/10`, hover: `bg-primary/15`
- Header text: `font-bold text-muted-foreground uppercase tracking-widest text-[11px]`
- Data row: `hover:bg-muted/30 transition-all`
- Cột STT (#) luôn hiển thị nếu có
- Cột "Hành động" luôn ở cuối, căn phải

```tsx
<tr className="border-b border-border hover:bg-primary/15 transition-colors bg-primary/10">
    <th className="h-11 px-4 align-middle font-bold text-muted-foreground uppercase tracking-widest text-[11px]">
        ...
    </th>
</tr>
```

---

## 4. Desktop/Mobile Dual Layout

### Nguyên tắc
- Desktop (`hidden lg:block`): Hiển thị dạng bảng `<table>`
- Mobile (`lg:hidden`): Hiển thị dạng card list
- Cả hai layout phải hiển thị cùng dữ liệu (đã sort/filter)

```tsx
{/* Desktop Table */}
<div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-left border-collapse text-[13px]">
        ...
    </table>
</div>

{/* Mobile Cards */}
<div className="lg:hidden flex flex-col gap-4 p-4 bg-muted/10">
    {sortedData.map((item) => (
        <div key={item.ID} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3">
            ...
        </div>
    ))}
</div>
```

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

## 6. Modal & Form Styling

### Nguyên tắc
- Label: `text-sm font-semibold` (KHÔNG dùng `uppercase` cho label trong modal)
- Input: dùng class `input-modern`
- Button Submit: `btn-premium-primary`
- Button Cancel: `btn-premium-secondary`
- Layout: Grid 1 cột mobile, 2 cột desktop `grid grid-cols-1 md:grid-cols-2 gap-6`

```tsx
<div className="space-y-2">
    <label className="text-sm font-semibold text-muted-foreground">Tên trường</label>
    <input name="..." className="input-modern" />
</div>
```

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

## 9. Stat Cards (Thẻ thống kê)

### Nguyên tắc
- Mỗi trang quản lý **phải có đúng 4 stat cards** dạng grid nằm giữa header và bảng.
- Layout: `grid grid-cols-2 md:grid-cols-4 gap-4`
- Mỗi card gồm: **icon** (trái) + **label text-sm** (trên) + **số đậm text-xl** (dưới).
- **KHÔNG** dùng gradient card, **KHÔNG** dùng card lớn padding-6.
- 4 màu chuẩn: `text-primary bg-primary/10`, `text-orange-500 bg-orange-500/10`, `text-green-600 bg-green-500/10`, `text-purple-600 bg-purple-500/10`.

### Code chuẩn

```tsx
import { cn } from '@/lib/utils';
// Import 4 icon phù hợp với module

const stats = [
    { label: 'Tổng [tên]', value: total, icon: Icon1, color: 'text-primary bg-primary/10' },
    { label: 'Thống kê 2', value: val2, icon: Icon2, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Thống kê 3', value: val3, icon: Icon3, color: 'text-green-600 bg-green-500/10' },
    { label: 'Thống kê 4', value: val4, icon: Icon4, color: 'text-purple-600 bg-purple-500/10' },
];

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {stats.map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground leading-none mt-1">{stat.value}</p>
            </div>
        </div>
    ))}
</div>
```

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
