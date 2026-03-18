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
- ✅ Sort trên tiêu đề bảng (ArrowUpDown/ArrowUp/ArrowDown)
- ✅ Table Header & Row Styling (bg-primary/10, uppercase tracking-widest)
- ✅ Desktop/Mobile Dual Layout (table + card list)
- ✅ ColumnToggleButton (ẩn/hiện cột)
- ✅ Modal & Form Styling (label không uppercase, viết hoa chữ đầu)
- ✅ Mobile Action Dropdown (DropdownMenu + MoreHorizontal)
- ✅ Filter qua URL (useSearchParams, KHÔNG useState)
- ✅ **Stat Cards** (Client Component + `useTransition`, KHÔNG dùng `<Link>`)
- ✅ **Loading Skeleton** (`loading.tsx` bắt buộc cho mỗi trang)
- ✅ **Label viết hoa chữ đầu** (Ngày hiệu lực, KHÔNG ngày hiệu lực)
- ✅ **Format tiền tệ** (dấu phân cách hàng nghìn, type="text" + inputMode="numeric")

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
- `action.ts`: Đặt `"use server"` lên trên cùng. Code Prisma thao tác DB. Nhớ thêm `revalidatePath('/[tên-tính-năng]')` ở cuối mỗi hàm tạo/sửa/xóa. **BẮT BUỘC dùng XÓA CỨNG** (`prisma.[model].delete()`) — KHÔNG dùng xóa mềm (DELETED_AT).
- `components/[Tên]PageClient.tsx`: Component chính chứa toolbar (search + filter + column toggle).
- `components/[Tên]List.tsx`: Bảng desktop + mobile cards + sort logic.
- `components/ColumnToggleButton.tsx`: Nút ẩn/hiện cột.

### Bước 3: Xây dựng UI theo Quy Chuẩn (GHI NHỚ UI-PATTERNS!)
Khi code `[Tên]PageClient.tsx` và `[Tên]List.tsx`:

**PageClient** phải có đủ:
- `showFilters` state + nút `Settings2` toggle cho mobile
- Desktop toolbar (`hidden lg:flex`) hiển thị filter + ColumnToggle + Download
- Mobile expanded filters panel (`lg:hidden`) với animation `animate-in slide-in-from-top-2`

**List** phải có đủ:
- `sortConfig` state + `sortedData` (useMemo) + `handleSort` + `SortIcon`
- Desktop table (`hidden lg:block`) với header sortable
- Mobile cards (`lg:hidden`) dùng cùng `sortedData`
- Mobile action dropdown (`MoreHorizontal` + `DropdownMenu`)
- Desktop action buttons (hiện riêng lẻ khi hover group)

**Toast thông báo (BẮT BUỘC):**
- Import `import { toast } from 'sonner';` trong MỌI component có thao tác CRUD.
- Khi thành công: `toast.success("Thêm ... thành công!")`, `toast.success("Cập nhật thành công!")`, `toast.success("Đã xóa ...")`.
- Khi lỗi: `toast.error(result.message || "Có lỗi xảy ra")`.
- Áp dụng cho: Thêm, Sửa, Xóa, Thêm hàng loạt — tất cả phải có toast.

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
- 4 màu chuẩn: primary, orange, green, purple
- Khi đang loading: hiển thị `Loader2 animate-spin` trên card đang active
- **KHÔNG gradient**, **KHÔNG padding-6**

**Loading Skeleton** (`loading.tsx`) bắt buộc:
- Mỗi trang **PHẢI** có file `loading.tsx` trong thư mục route để Next.js hiển thị skeleton ngay khi URL thay đổi
- Skeleton phải bao gồm: header, stat cards, toolbar, table rows — tất cả dùng `animate-pulse`

**Xem chi tiết code mẫu tại:** `.agents/skills/create-new-feature/ui-patterns.md`

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
- CẤM dùng gradient card hoặc card chỉ có 1-3 cái — phải đúng 4 stat cards kiểu chuẩn.
- CẤM dùng `<Link>` cho stat cards — phải dùng Client Component + `useTransition` + `router.replace` để tránh delay.
- CẤM tạo trang mà KHÔNG có `loading.tsx` — mỗi route PHẢI có file loading skeleton.
- CẤM dùng `type="number"` cho trường tiền tệ — phải dùng `type="text"` + format dấu phân cách.
- CẤM dùng **xóa mềm** (Soft Delete / `DELETED_AT`) — toàn bộ dự án đã chuyển sang **xóa cứng** (`prisma.[model].delete()`). KHÔNG thêm field `DELETED_AT` vào schema, KHÔNG dùng `update({ data: { DELETED_AT: new Date() } })`.
- CẤM bỏ sót **toast thông báo** — mọi thao tác Thêm/Sửa/Xóa **phải** có `toast.success()` khi thành công và `toast.error()` khi thất bại. Import từ `sonner`.

