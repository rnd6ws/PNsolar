---
name: create-new-feature
description: Kỹ năng tạo module/tính năng mới theo chuẩn Feature-based và Phân quyền của dự án.
---

# Kỹ Năng / AI Skill: create-new-feature

Bạn được trang bị kỹ năng này để đảm bảo mỗi khi User yêu cầu "Tạo chức năng/module quản lý [Tên]", bạn sẽ tuân thủ tuyệt đối cấu trúc thư mục của dự án thay vì tự ý code theo kiểu Next.js truyền thống.

## MỤC TIÊU CỐT LÕI
1. **Kiến trúc Feature-Based**: Mọi dòng code liên quan đến một tính năng phải được gom vào 1 folder duy nhất trong `src/features/[tên-tính-năng]/`.
2. **Server Actions First**: Không dùng API Route (`/api/`). Database Fetch / Mutate phải làm bằng `Server Actions` kết hợp Prisma.
3. **Authorization Guard**: Toàn bộ UI (Trang và Nút) bắt buộc phải bọc bằng `<PermissionGuard>`.

## QUY TRÌNH THỰC HIỆN TRỌN GÓI (6 BƯỚC)

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
- `action.ts`: Đặt `"use server"` lên trên cùng. Code Prisma thao tác DB. Nhớ thêm `revalidatePath('/[tên-tính-năng]')` ở cuối mỗi hàm tạo/sửa/xóa.
- `components/[Tên]Client.tsx`: Giao diện Client chính (Table List, Dialog Forms).

### Bước 3: Áp dụng khiên bảo vệ (Guard) ở Client Component
Trong giao diện Client (`/components/`), bạn cần sử dụng Guard:
- **Bọc nút Thao Tác (Button):**
  ```tsx
  <PermissionGuard moduleKey="[tên-tính-năng]" level="add"> {/* Dùng "add", "edit", "delete", "manage" tuỳ mức thao tác */}
      <button>Thêm Mới</button>
  </PermissionGuard>
  ```
- Nếu cần Check logic JS, import hook: `const { canManage, canAdd, canEdit, canDelete } = usePermissions(); canAdd('[tên-tính-năng]')`.

### Bước 4: Tạo App Route
Tạo `src/app/(dashboard)/[tên-tính-năng]/page.tsx` (Chỉ dùng Server Component):
- Import và gọi các hàm fetch Data từ `action.ts`.
- Render `<[Tên]Client />` ra ở đây.
- Bọc toàn bộ trang bằng Quyền View để cấm truy cập thẳng từ Link:
  ```tsx
  <PermissionGuard moduleKey="[tên-tính-năng]" level="view" showNoAccess>
       <[Tên]Client data={data} />
  </PermissionGuard>
  ```

### Bước 5: Cập nhật Thanh Điều Hướng (Sidebar)
Mở `src/components/AppSidebar.tsx` và gắn vào mảng Nav:
```typescript
{ name: "Tên tính năng", href: "/[tên-tính-năng]", icon: IconComponent, moduleKey: "[tên-tính-năng]" }
```
*(Tuyệt đối không quên property `moduleKey` vì nó dùng để chạy thuật toán ẩn quyền cho Staff)*

### Bước 6: Cập nhật Trang Chủ (Dashboard Grid)
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
