---
description: Hướng dẫn chi tiết tạo và tích hợp một Feature (Tính năng/Bảng mới) chuẩn kiến trúc Feature-Based.
---

# Quy trình chuẩn thêm mới Tính năng (Feature)

Dự án này tuân thủ cấu trúc **Feature-Based Architecture**. Bất cứ khi nào bạn được giao nhiệm vụ tạo mới một CRUD/Màn hình cho bảng CSDL mới, hãy thực hiện ĐÚNG các bước sau:

## 0. ⚠️ BẮT BUỘC: Đọc Quy Chuẩn UI/UX
**TRƯỚC KHI bắt đầu**, đọc file `.agents/skills/create-new-feature/ui-patterns.md` để nắm TẤT CẢ các pattern UI đã chuẩn hóa:
- Mobile toolbar toggle (Settings2), Sort trên header bảng, Desktop/Mobile dual layout, ColumnToggle, Modal styling, v.v.
- **Không đọc = Giao diện thiếu chuẩn = THẤT BẠI.**

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
    ├── [Tên]PageClient.tsx   ← Toolbar (search + filter toggle + column toggle)
    ├── [Tên]List.tsx          ← Table desktop + Cards mobile + Sort logic
    ├── ColumnToggleButton.tsx ← Ẩn/hiện cột
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
- **XÓA CỨNG**: Hàm xóa phải dùng `prisma.[model].delete()` — KHÔNG dùng xóa mềm (DELETED_AT). Nếu model có relation con, phải xóa con trước rồi xóa cha.

## 5. Tạo Các UI Đặc thù (components/) — THEO QUY CHUẨN
Bên trong `src/features/[tên-tính-năng]/components/`:
- Component thường là `"use client"` dùng để tương tác (Form nộp dữ liệu, Bảng hiển thị, Filter).
- Gọi các hàm mutation (Server Actions) từ `action.ts`.
- **LƯU Ý QUAN TRỌNG VỀ FILTER:** Không sử dụng state cục bộ (`useState`) để lọc hay Search. Phải gắn filter param vào **URL** thông qua hook `useSearchParams` và đẩy Route `router.replace(?)`.

### Checklist UI bắt buộc cho `[Tên]PageClient.tsx`:
- [ ] `showFilters` state + nút `Settings2` toggle cho mobile
- [ ] Desktop toolbar (`hidden lg:flex`) hiển thị filter + ColumnToggle + Download
- [ ] Mobile expanded filters (`lg:hidden`) với animation `animate-in slide-in-from-top-2`
- [ ] Sử dụng `<SearchInput>` và `<FilterSelect>` (đã có sẵn)

### Checklist UI bắt buộc cho `[Tên]List.tsx`:
- [ ] `sortConfig` state + `sortedData` (useMemo) + `handleSort` + `SortIcon`
- [ ] Desktop table header sortable (click → ASC → DESC, icon ArrowUpDown/Up/Down)
- [ ] Desktop table (`hidden lg:block`) + Mobile cards (`lg:hidden`)
- [ ] Cả desktop và mobile dùng cùng `sortedData`
- [ ] Mobile action dropdown (MoreHorizontal + DropdownMenu)
- [ ] Label trong modal/form: `text-sm font-semibold` (KHÔNG uppercase)
- [ ] Table header: `bg-primary/10`, `font-bold text-muted-foreground uppercase tracking-widest text-[11px]`

### Checklist Toast thông báo (BẮT BUỘC):
- [ ] Import `import { toast } from 'sonner';` trong mọi component có thao tác CRUD
- [ ] **Thêm**: `toast.success("Thêm ... thành công!")` / `toast.error(result.message)`
- [ ] **Sửa**: `toast.success("Cập nhật thành công!")` / `toast.error(result.message)`
- [ ] **Xóa**: `toast.success("Đã xóa ...!")` / `toast.error(result.message)`
- [ ] **Thêm hàng loạt** (nếu có): `toast.success(result.message)` / `toast.error(result.message)`

## 6. Lắp ghép vào Giao diện (App Route)
Tạo trang ở `src/app/(dashboard)/[tên-tính-năng]/page.tsx`:
- Đây là một **Server Component** (Tuyệt đối không có `"use client"`).
- Fetch data trực tiếp qua hàm `get...` được lấy từ `action.ts`.
- Đọc `searchParams` để xác định filter người dùng muốn. Truyền data vào Client Component dọn sẵn ở Bước 5.

## 7. Khai báo & Phân Quyền Tính năng mới (BẮT BUỘC)
Sau khi tạo xong giao diện và logic, bạn **phải** cho tính năng này vào mạng lưới quản trị phân quyền:
1. **Đăng ký danh tính:** Mở `src/lib/permissions.ts` và khai báo object tính năng mới vào mảng `MODULES`. VD: `{ key: '[tên-tính-năng]', label: '...', group: '...' }`
2. **Bảo vệ Trang:** Trong file Page Client (thuộc `components/`), bọc toàn bộ mã HTML rễ bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="view" showNoAccess>` để tự chặn truy cập trái phép.
3. **Bảo vệ Nút thao tác:** Bọc các nút tạo mới, chỉnh sửa, xóa bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="add">`, `level="edit"`, `level="delete"`, hoặc `level="manage"` tương ứng với hành động.
4. **Gắn Menu Trái (Sidebar):** Mở `src/components/AppSidebar.tsx` và thêm menu mới kèm `moduleKey: '[tên-tính-năng]'` (nó sẽ tự động bị giấu đi nếu nhân viên không có quyền).
5. **Gắn Dashboard:** Mở `src/app/(dashboard)/dashboard/page.tsx`, thêm thông tin tính năng vào mảng `moduleGroups` dưới dạng card và gắn biến `moduleKey`. Thẻ card sẽ tự động ẩn đi đối với staff thiếu quyền.

