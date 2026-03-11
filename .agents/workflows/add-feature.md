---
description: Hướng dẫn chi tiết tạo và tích hợp một Feature (Tính năng/Bảng mới) chuẩn kiến trúc Feature-Based.
---

# Quy trình chuẩn thêm mới Tính năng (Feature)

Dự án này tuân thủ cấu trúc **Feature-Based Architecture**. Bất cứ khi nào bạn được giao nhiệm vụ tạo mới một CRUD/Màn hình cho bảng CSDL mới, hãy thực hiện ĐÚNG các bước sau:

## 1. Cập nhật Database & Prisma Schema
- Mở `prisma/schema.prisma` và thêm Model (`SNAKE_CASE_UPPER` đối với tên bảng, enum và tên trường. Ví dụ `KHACH_HANG`, `MA_KH`).
- Chạy command để đồng bộ Prisma Type (hoặc chờ user đồng bộ):
  ```bash
  npx prisma generate
  # npx prisma db push (nếu cần sync DB)
  ```

## 2. Tạo Thư mục Tính năng (Feature Folder)
Tạo thư mục `src/features/[tên-tính-năng]` (Sử dụng `kebab-case` chữ thường, VD: `khach-hang`).
Toàn bộ logic sẽ được nhốt tại đây. Cấu trúc bên trong gồm:
```
src/features/[tên-tính-năng]/
├── action.ts
├── schema.ts
└── components/
    ├── List.tsx
    ├── AddForm.tsx
    └── ...
```

## 3. Khai báo Schema (schema.ts)
Bên trong `src/features/[tên-tính-năng]/schema.ts`:
- Sử dụng thư viện `zod` để định dạng Schema Validation.
- Export interface type từ inferred schema.

## 4. Xây dựng Logic Dữ liệu (action.ts)
Bên trong `src/features/[tên-tính-năng]/action.ts`:
- **BẮT BUỘC** ghi chú `"use server"` ở dòng đầu tiên.
- Không chia nhỏ làm actions hay services nữa. Toàn bộ logic tạo/xóa/sửa/lấy list (CRUD) viết luôn tại đây.
- Các Mutations (Thêm, Xóa, Sửa) **BẮT BUỘC** gọi `revalidatePath('/dashboard/[tên-tính-năng]')` để Next.js làm mới giao diện ngay lập tức mà không cần F5.

## 5. Tạo Các UI Đặc thù (components/)
Bên trong `src/features/[tên-tính-năng]/components/`:
- Component thường là `"use client"` dùng để tương tác (Form nộp dữ liệu, Bảng hiển thị, Filter).
- Gọi các hàm mutation (Server Actions) từ `action.ts`.
- **LƯU Ý QUAN TRỌNG VỀ FILTER:** Không sử dụng state cục bộ (`useState`) để lọc hay Search. Phải gắn filter param vào **URL** thông qua hook `useSearchParams` và đẩy Route `router.replace(?)`.

## 6. Lắp ghép vào Giao diện (App Route)
Tạo trang ở `src/app/(dashboard)/[tên-tính-năng]/page.tsx`:
- Đây là một **Server Component** (Tuyệt đối không có `"use client"`).
- Fetch data trực tiếp qua hàm `get...` được lấy từ `action.ts`.
- Đọc `searchParams` để xác định filter người dùng muốn. Truyền data vào Client Component (như cái List, Table) dọn sẵn ở Bước 5.

## 7. Khai báo & Phân Quyền Tính năng mới (BẮT BUỘC)
Sau khi tạo xong giao diện và logic, bạn **phải** cho tính năng này vào mạng lưới quản trị phân quyền:
1. **Đăng ký danh tính:** Mở `src/lib/permissions.ts` và khai báo object tính năng mới vào mảng `MODULES`. VD: `{ key: '[tên-tính-năng]', label: '...', group: '...' }`
2. **Bảo vệ Trang:** Trong file Page Client (thuộc `components/`), bọc toàn bộ mã HTML rễ bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="view" showNoAccess>` để tự chặn truy cập trái phép.
3. **Bảo vệ Nút thao tác:** Bọc các nút tạo mới, chỉnh sửa, xóa bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="add">`, `level="edit"`, `level="delete"`, hoặc `level="manage"` tương ứng với hành động.
4. **Gắn Menu Trái (Sidebar):** Mở `src/components/AppSidebar.tsx` và thêm menu mới kèm `moduleKey: '[tên-tính-năng]'` (nó sẽ tự động bị giấu đi nếu nhân viên không có quyền).
5. **Gắn Dashboard:** Mở `src/app/(dashboard)/dashboard/page.tsx`, thêm thông tin tính năng vào mảng `moduleGroups` dưới dạng card và gắn biến `moduleKey`. Thẻ card sẽ tự động ẩn đi đối với staff thiếu quyền.
