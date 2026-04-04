---
name: create-new-feature
description: Kỹ năng tạo module/tính năng mới theo chuẩn Feature-based, Phân quyền, và UI/UX Patterns chuẩn hóa của dự án.
---

# Kỹ Năng / AI Skill: create-new-feature

Bạn được trang bị kỹ năng này để đảm bảo mỗi khi User yêu cầu "Tạo chức năng/module quản lý [Tên]", bạn sẽ tuân thủ tuyệt đối cấu trúc thư mục VÀ quy chuẩn UI/UX của dự án.

## MỤC TIÊU CỐT LÕI
1. **Kiến trúc Feature-Based**: Mọi dòng code liên quan đến một tính năng phải được gom vào 1 folder duy nhất trong `src/features/[tên-tính-năng]/`.
2. **Server Actions First**: Không dùng API Route (`/api/`). Database Fetch / Mutate phải làm bằng `Server Actions` kết hợp Prisma.
3. **Authorization Guard**: Toàn bộ UI (Trang và Nút) bắt buộc phải bọc bằng `<PermissionGuard>`.
4. **UI/UX Patterns Chuẩn**: Giao diện phải tuân thủ 100% các pattern UI đã chuẩn hóa (xem Bước 0).

## ⚠️ BƯỚC 0 — BẮT BUỘC: Đọc Quy Chuẩn UI/UX

**TRƯỚC KHI viết bất kỳ dòng code nào**, bạn PHẢI đọc file:
```
.agents/skills/create-new-feature/ui-patterns.md
```

File này chứa TẤT CẢ các quy chuẩn UI/UX đã được chuẩn hóa trong dự án, bao gồm:
- ✅ Mobile Toolbar Toggle (nút Settings2 ẩn/hiện filter)
- ✅ **Toolbar Gradient**: Nền chuyển màu dọc `from-primary/3 to-primary/8`
- ✅ Sort trên tiêu đề bảng (ArrowUpDown/ArrowUp/ArrowDown)
- ✅ Table Header & Row Styling (bg-primary/10, tracking-widest)
- ✅ **Toggle List/Card View** (mobile chọn dạng bảng hoặc thẻ)
- ✅ ColumnToggleButton (ẩn/hiện cột)
- ✅ Modal & Form Styling (label không uppercase, viết hoa chữ đầu)
- ✅ Mobile Action Dropdown (DropdownMenu + MoreHorizontal)
- ✅ Filter qua URL (useSearchParams, KHÔNG useState)
- ✅ **Stat Cards đa màu** (Multi-Color System: Indigo, Emerald, Amber, Violet, Red — inline style)
- ✅ **Loading Skeleton** (`loading.tsx` bắt buộc cho mỗi trang)
- ✅ **Label viết hoa chữ đầu** (Ngày hiệu lực, KHÔNG ngày hiệu lực)
- ✅ **Format tiền tệ** (dấu phân cách hàng nghìn, type="text" + inputMode="numeric")
- ✅ **Pagination + Global PageSize** (dùng `getRowsPerPage()` + cookie, dropdown chọn 10/20/50/100)

**Nếu bỏ qua bước này, giao diện sẽ KHÔNG đạt chuẩn.**

## QUY TRÌNH THỰC HIỆN TRỌN GÓI (7 BƯỚC)

Bất cứ khi nào tạo tính năng mới (VD: "Quản lý Đơn Hàng" `dat-hang`), hãy làm ĐÚNG thứ tự sau:

### Bước 1: Khai báo Module (Phân Quyền)
Mở file `src/lib/permissions.ts` và THÊM tính năng đó vào mảng `MODULES`:
```typescript
{ key: 'dat-hang', label: 'Đặt mua hàng', group: 'Hàng hóa & Kho' }
```
*(Hành động này giúp màn hình Phân Quyền tự động có công tắc bật/tắt quyền cho module này)*

### Bước 2: Dựng kho Feature
Tạo thư mục `src/features/[tên-tính-năng]` và chia file:
- `schema.ts`: Khai báo Zod Model (Nếu form phức tạp) hoặc Types.
- `action.ts`: Đặt `"use server"` lên trên cùng. Code Prisma thao tác DB. Nhớ thêm `revalidatePath('/[tên-tính-năng]')` ở cuối mỗi hàm tạo/sửa/xóa. **BẮT BUỘC dùng XÓA CỨNG** (`prisma.[model].delete()`) — KHÔNG dùng xóa mềm (DELETED_AT). **BẮT BUỘC áp dụng Data Isolation** (xem Bước 2.5).
- `components/[Tên]PageClient.tsx`: Component chính chứa toolbar (search + filter + column toggle).
- `components/[Tên]List.tsx`: Bảng desktop + mobile cards + sort logic.
- `components/ColumnToggleButton.tsx`: Nút ẩn/hiện cột.

**Khi model có cột tham chiếu bảng khác (Relation) — PHẢI ĐỌC:**
> Xem hướng dẫn đầy đủ tại: `.agents/docs/huong-dan-relation.md`

Tóm tắt quy tắc bắt buộc:
- **Lưu MÃ** (code) trong DB, không lưu text → dùng `@relation` trong schema Prisma.
- Cột khóa ngoại đặt tên `MA_XXX` (VD: `MA_NHOM_HH`, `MA_PHAN_LOAI`).
- Khi query phải dùng `include` để lấy tên hiển thị: `include: { NHOM: { select: { TEN_NHOM: true } } }`.
- Dropdown trong form: `value` của `<option>` phải là **MÃ** (không phải tên).
- Hiển thị UI: `item.NHOM?.TEN_NHOM || item.MA_NHOM_HH` (fallback về mã nếu null).
- Chạy `npx prisma generate` sau khi sửa schema (KHÔNG cần `db push` nếu chỉ thêm `@relation` với MongoDB).
- Checklist đầy đủ: xem cuối file `.agents/docs/huong-dan-relation.md`.

### Bước 2.5: Data Isolation — Phân quyền dữ liệu Server-Side (BẮT BUỘC)

Mọi hàm trong `action.ts` mà **trả về danh sách, thống kê, hoặc dropdown search** đều PHẢI filter theo STAFF.

**Import bắt buộc:**
```typescript
import { getCurrentUser } from '@/lib/auth';
```

**Pattern cho `getList()` và `getStats()`:**
```typescript
const user = await getCurrentUser();
const baseWhere: any = {};
if (user?.ROLE === 'STAFF') {
    const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
    if (staff?.MA_NV) {
        baseWhere.OR = [
            { NGUOI_TAO: staff.MA_NV },           // Dữ liệu do mình tạo
            { KH_REL: { SALES_PT: staff.MA_NV } }, // KH mình phụ trách (relation name tùy bảng)
        ];
    } else {
        baseWhere.NGUOI_TAO = 'NONE'; // Không tìm thấy NV → trả 0 kết quả
    }
}
// Dùng baseWhere cho count(), findMany(), aggregate()
```
> **LƯU Ý**: Tên relation (`KH_REL`, `KHTN_REL`, `HD_REL`...) phải khớp với schema Prisma. Kiểm tra `prisma/schema.prisma` trước khi code.

**Pattern cho `searchKhachHangFor[Module]()` (dropdown chọn KH khi tạo mới):**
```typescript
export async function searchKhachHangForXXX(query?: string) {
    const where: any = {};
    const andConditions: any[] = [];

    // ── STAFF: chỉ KH mình phụ trách ──
    const user = await getCurrentUser();
    if (user?.ROLE === 'STAFF') {
        const staff = await prisma.dSNV.findUnique({ where: { ID: user.userId }, select: { MA_NV: true } });
        if (staff?.MA_NV) andConditions.push({ SALES_PT: staff.MA_NV });
        else andConditions.push({ MA_KH: 'NONE' });
    }

    if (query?.trim()) {
        andConditions.push({
            OR: [
                { TEN_KH: { contains: query, mode: 'insensitive' } },
                { MA_KH: { contains: query, mode: 'insensitive' } },
            ],
        });
    }

    if (andConditions.length > 0) where.AND = andConditions;
    return prisma.kHTN.findMany({ where, take: 20, orderBy: { TEN_KH: 'asc' } });
}
```

**Pattern cho `searchHopDongFor[Module]()` (dropdown chọn HĐ khi tạo mới):**
```typescript
// STAFF chỉ thấy HĐ mình tạo hoặc HĐ thuộc KH mình phụ trách
if (user?.ROLE === 'STAFF') {
    where.AND = [{
        OR: [
            { NGUOI_TAO: staff.MA_NV },
            { KHTN_REL: { SALES_PT: staff.MA_NV } },
        ]
    }];
}
```

**⚠️ Cross-table Stats:** Nếu hàm `getStats()` query **bảng khác** (VD: Cơ hội tổng hợp từ HOP_DONG, Hợp đồng tổng hợp từ THANH_TOAN), thì bảng đó cũng PHẢI filter theo STAFF qua relation ngược.

**Checklist Data Isolation:**
- [ ] `getList()` có `baseWhere` filter STAFF
- [ ] `getStats()` có `baseWhere` filter STAFF (bao gồm cross-table queries)
- [ ] `searchKhachHangFor[Module]()` có filter `SALES_PT`
- [ ] `searchHopDongFor[Module]()` có filter `NGUOI_TAO / KHTN_REL.SALES_PT` (nếu có)
- [ ] Các hàm `getXXXByKH(maKH)` KHÔNG cần sửa (vì KH dropdown đã filter)

### Bước 3: Xây dựng UI theo Quy Chuẩn (GHI NHỚ UI-PATTERNS!)
Khi code `[Tên]PageClient.tsx` và `[Tên]List.tsx`:

**PageClient** phải có đủ:
- `showFilters` state + nút `Settings2` toggle cho mobile
- `viewMode` state (`"list" | "card"`) + nút `LayoutList`/`LayoutGrid` toggle cho mobile
- Desktop toolbar (`hidden lg:flex`) hiển thị filter + ColumnToggle + Download
- Mobile expanded filters panel (`lg:hidden`) với animation `animate-in slide-in-from-top-2`
- **Toolbar gradient**: `bg-linear-to-b from-primary/3 to-primary/8`, border `border-primary/10`

**List** phải có đủ:
- `sortConfig` state + `sortedData` (useMemo) + `handleSort` + `SortIcon`
- Nhận prop `viewMode?: "list" | "card"`
- **Card view** (khi `viewMode === "card"`): hiện `lg:hidden`, đầy đủ nút hành động
- **Table view**: `viewMode === "card" ? "hidden lg:block" : ""`
- Mobile action dropdown (`MoreHorizontal` + `DropdownMenu`) trong table view
- Desktop action buttons (hiện riêng lẻ khi hover group)

**Toast thông báo (BẮT BUỘC):**
- Import `import { toast } from 'sonner';` trong MỌI component có thao tác CRUD.
- Khi thành công: `toast.success("Thêm ... thành công!")`, `toast.success("Cập nhật thành công!")`, `toast.success("Đã xóa ...")`.
- Khi lỗi: `toast.error(result.message || "Có lỗi xảy ra")`.
- Áp dụng cho: Thêm, Sửa, Xóa, Thêm hàng loạt — tất cả phải có toast.

**Modal (BẮT BUỘC dùng component `Modal` chung):**
- Import `import Modal from '@/components/Modal';`
- **KHÔNG** tự viết `div.fixed.inset-0` hoặc bất kỳ modal overlay custom nào.
- Nút Hủy + Submit phải ở **`footer` prop** — **CẤM** để `flex-1` trong body/form.
- Mỗi modal **BẮT BUỘC** có `icon` prop (lucide-react icon).
- Form bên trong modal phải có `id="form-xxx"`, nút submit dùng `requestSubmit()`.
- Code mẫu:
  ```tsx
  <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Thêm [tên]"
      icon={IconComponent}
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
          ...
      </form>
  </Modal>
  ```
- Xem chi tiết đầy đủ tại: `.agents/skills/create-new-feature/ui-patterns.md` mục 6.

**Modal xác nhận xóa (BẮT BUỘC dùng component chung):**
- Import `import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';`
- **KHÔNG** tự viết DeleteConfirmModal riêng trong feature. Dùng component chung:
  ```tsx
  <DeleteConfirmDialog
      isOpen={!!deleteItem}
      onClose={() => setDeleteItem(null)}
      onConfirm={async () => {
          const result = await deleteAction(deleteItem.ID);
          if (result.success) toast.success('Đã xóa!');
          else toast.error(result.message);
          handleSuccess();
          return result;
      }}
      title="Xác nhận xóa [tên]"
      itemName={deleteItem?.TEN}
      itemDetail={`Mã: ${deleteItem?.MA}`}
      confirmText="Xóa [tên]"
  />
  ```

**Stat Cards** (giữa Header và Table Card) phải có:
- **BẮT BUỘC** tách thành Client Component riêng (VD: `StatCards.tsx`) dùng `useTransition` + `router.replace`
- **KHÔNG ĐƯỢC** dùng `<Link>` cho stat cards — gây delay khi click do full server re-render
- Grid `grid-cols-2 md:grid-cols-4 gap-4` — luôn đủ **4 cards**
- Mỗi card: icon (w-10 h-10 rounded-lg) + label `text-sm` ở **trên** + số `text-xl font-bold` ở **dưới**
- 4–5 màu cố định (inline style): Indigo `#6366f1`, Emerald `#10b981`, Amber `#f59e0b`, Violet `#8b5cf6`, Red `#ef4444`
- Khi đang loading: hiển thị `Loader2 animate-spin` trên card đang active
- **KHÔNG** dùng `truncate` cho label — cho phép xuống dòng
- **KHÔNG** dùng màu theme-dependent (`bg-primary/10`) cho cards — dùng màu cố định inline style

**Loading Skeleton** (`loading.tsx`) bắt buộc:
- Mỗi trang **PHẢI** có file `loading.tsx` trong thư mục route để Next.js hiển thị skeleton ngay khi URL thay đổi
- Skeleton phải bao gồm: header, stat cards, toolbar, table rows — tất cả dùng `animate-pulse`

**Xem chi tiết code mẫu tại:** `.agents/skills/create-new-feature/ui-patterns.md`

**Pagination (BẮT BUỘC dùng component `Pagination` chung + Global PageSize):**
- Import `import Pagination from '@/components/Pagination';`
- Import `import { getRowsPerPage } from '@/lib/getRowsPerPage';` trong server page.
- Trong `page.tsx` (server), đọc pageSize: `const pageSize = await getRowsPerPage(params.pageSize);`
  - `getRowsPerPage()` ưu tiên: URL `?pageSize=X` → Cookie `pnsolar-rows-per-page` → default value.
  - Truyền `limit: pageSize` vào hàm fetch data.
- Trong Client Component, truyền `pageSize` prop vào `<Pagination>`:
  ```tsx
  <Pagination
      totalPages={pagination.totalPages}
      currentPage={page}
      total={pagination.total}
      pageSize={pageSize}
  />
  ```
- **LUÔN hiển thị** Pagination (không check `totalPages > 1`) để user luôn thấy dropdown chọn số dòng.
- Pagination tích hợp sẵn dropdown chọn 10/20/50/100 dòng/trang.
- Khi đổi pageSize, tự động sync vào cookie + localStorage (cho PreferencesPopover).

### Bước 4: Áp dụng khiên bảo vệ (Guard) ở Client Component
Trong giao diện Client (`/components/`), bạn cần sử dụng Guard:
- **Bọc nút Thao Tác (Button):**
  ```tsx
  <PermissionGuard moduleKey="[tên-tính-năng]" level="add"> {/* Dùng "add", "edit", "delete", "manage" tuỳ mức thao tác */}
      <button>Thêm Mới</button>
  </PermissionGuard>
  ```
- Nếu cần Check logic JS, import hook: `const { canManage, canAdd, canEdit, canDelete } = usePermissions(); canAdd('[tên-tính-năng]')`.

### Bước 5: Tạo App Route
Tạo `src/app/(dashboard)/[tên-tính-năng]/page.tsx` (Chỉ dùng Server Component):
- Import và gọi các hàm fetch Data từ `action.ts`.
- Render `<StatCards>` (Client Component) và `<[Tên]PageClient />` ra ở đây.
- Bọc toàn bộ trang bằng Quyền View để cấm truy cập thẳng từ Link:
  ```tsx
  <PermissionGuard moduleKey="[tên-tính-năng]" level="view" showNoAccess>
       <StatCards stats={stats} />
       <[Tên]PageClient data={data} />
  </PermissionGuard>
  ```

**BẮT BUỘC** tạo thêm file `src/app/(dashboard)/[tên-tính-năng]/loading.tsx`:
- Hiển thị skeleton cho header, stat cards, toolbar và table rows
- Dùng `animate-pulse` cho mọi phần tử skeleton
- Xem code mẫu tại `ui-patterns.md` section 12

### Bước 6: Cập nhật Thanh Điều Hướng (Sidebar)
Mở `src/components/AppSidebar.tsx` và gắn vào mảng Nav:
```typescript
{ name: "Tên tính năng", href: "/[tên-tính-năng]", icon: IconComponent, moduleKey: "[tên-tính-năng]" }
```
*(Tuyệt đối không quên property `moduleKey` vì nó dùng để chạy thuật toán ẩn quyền cho Staff)*

### Bước 7: Cập nhật Trang Chủ (Dashboard Grid)
Mở `src/app/(dashboard)/dashboard/page.tsx` và sửa lại/thêm Data vào `moduleGroups`:
Khớp tên `moduleKey` và cho `available: true`.
```typescript
{
    name: "Tên tính năng",
    description: "Mô tả...",
    href: "/[tên-tính-năng]",
    icon: IconComponent,
    color: "...", bgColor: "...",
    available: true,
    moduleKey: "[tên-tính-năng]",
}
```

---

**Cấm Kị Tuyệt Đối Khi Làm Feature Mới:**
- CẤM tạo thư mục phân mảnh như `src/components/[tên-tính-năng]` (Trừ thẻ dùng chung).
- CẤM bỏ quên `<PermissionGuard>` ra khỏi dự án.
- CẤM lưu data từ Prisma trả về vào file Client dưới dạng Props rồi đem đi Sửa trực tiếp, hãy dùng Action truyền FormData.
- CẤM bỏ qua Bước 0 (đọc ui-patterns.md) — giao diện thiếu mobile filter toggle hoặc sort = THẤT BẠI.
- CẤM dùng `useState` cho filter — phải dùng URL params qua `useSearchParams`.
- CẤM dùng `uppercase` cho label trong modal/form.
- CẤM viết label chữ thường (phải viết hoa chữ đầu: "Ngày hiệu lực" không phải "ngày hiệu lực").
- CẤM dùng gradient card hoặc màu theme-dependent cho stat cards — phải dùng **màu cố định inline style** (Indigo, Emerald, Amber, Violet, Red).
- CẤM dùng `truncate` cho label stat cards — cho phép xuống dòng.
- CẤM dùng `<Link>` cho stat cards — phải dùng Client Component + `useTransition` + `router.replace` để tránh delay.
- CẤM toolbar không có gradient — phải dùng `bg-linear-to-b from-primary/3 to-primary/8`.
- CẤM tạo trang mà KHÔNG có `loading.tsx` — mỗi route PHẢI có file loading skeleton.
- CẤM card view mobile thiếu nút hành động — phải có ĐẦY ĐỦ các nút giống bảng.
- CẤM dùng gradient **ngang** cho table header — bị lỗi trên mobile khi scroll ngang.
- CẤM dùng `type="number"` cho trường tiền tệ — phải dùng `type="text"` + format dấu phân cách.
- CẤM dùng **xóa mềm** (Soft Delete / `DELETED_AT`) — toàn bộ dự án đã chuyển sang **xóa cứng** (`prisma.[model].delete()`). KHÔNG thêm field `DELETED_AT` vào schema, KHÔNG dùng `update({ data: { DELETED_AT: new Date() } })`.
- CẤM bỏ sót **toast thông báo** — mọi thao tác Thêm/Sửa/Xóa **phải** có `toast.success()` khi thành công và `toast.error()` khi thất bại. Import từ `sonner`.
- CẤM tự viết **custom modal div** (`div.fixed.inset-0`, `z-50`, `bg-black/60`) — phải dùng component `Modal` chung tại `@/components/Modal`.
- CẤM để **nút Hủy/Submit** trong body form (`flex-1` hoặc `mt-auto`) — nút phải nằm trong `footer` prop của `Modal`, compact và align-right.
- CẤM tạo modal **thiếu `icon` prop** — mỗi modal bắt buộc có icon lucide-react phù hợp.
- CẤM dùng `totalPages > 1` làm điều kiện hiển thị Pagination — phải **luôn hiển thị** Pagination để user chọn số dòng/trang.
- CẤM hardcode `limit` trong server page — PHẢI dùng `getRowsPerPage()` từ `@/lib/getRowsPerPage` để đọc giá trị global từ cookie.
- CẤM tạo component LimitSelect/PageSizeSelect riêng — Pagination đã tích hợp sẵn dropdown chọn số dòng.
- CẤM viết `getList()`, `getStats()` hoặc `searchKhachHang*()` mà **KHÔNG có Data Isolation** — PHẢI filter theo STAFF (xem Bước 2.5). Nếu bỏ qua, nhân viên sẽ thấy data của người khác.
- CẤM query cross-table trong `getStats()` mà không filter — nếu stats query bảng THANH_TOAN, HOP_DONG... từ module khác, bảng đó cũng PHẢI được filter theo STAFF.

