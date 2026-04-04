---
description: Hướng dẫn chi tiết tạo và tích hợp một Feature (Tính năng/Bảng mới) chuẩn kiến trúc Feature-Based.
---

# Quy trình chuẩn thêm mới Tính năng (Feature)

Dự án này tuân thủ cấu trúc **Feature-Based Architecture**. Bất cứ khi nào bạn được giao nhiệm vụ tạo mới một CRUD/Màn hình cho bảng CSDL mới, hãy thực hiện ĐÚNG các bước sau:

## 0. ⚠️ BẮT BUỘC: Đọc Quy Chuẩn UI/UX
**TRƯỚC KHI bắt đầu**, đọc file `.agents/skills/create-new-feature/ui-patterns.md` để nắm TẤT CẢ các pattern UI đã chuẩn hóa:
- Toolbar gradient (`from-primary/3 to-primary/8`), Toggle List/Card View, Sort trên header bảng
- Stat Cards đa màu (Indigo, Emerald, Amber, Violet, Red — inline style)
- Card view mobile phải có đầy đủ nút hành động giống bảng
- **Không đọc = Giao diện thiếu chuẩn = THẤT BẠI.**

## 1. Cập nhật Database & Prisma Schema
- Mở `prisma/schema.prisma` và thêm Model (`SNAKE_CASE_UPPER` đối với tên bảng, enum và tên trường. Ví dụ `KHACH_HANG`, `MA_KH`).
- **Nếu model có cột tham chiếu bảng khác (Foreign Key):** Phải khai báo `@relation` đúng chuẩn. Xem hướng dẫn đầy đủ tại `.agents/docs/huong-dan-relation.md`.
  - Lưu **MÃ** (code) trong DB, không lưu text trực tiếp.
  - Đặt tên cột khóa ngoại: `MA_XXX` (VD: `MA_NHOM_HH`).
  - Khai báo `@relation(fields: [MA_XXX], references: [MA_XXX])` + relation ngược ở bảng cha.
  - Thêm `@@index([MA_XXX])` cho cột khóa ngoại.
- Chạy command để đồng bộ Prisma Type (hoặc chờ user đồng bộ):
  ```bash
  npx prisma generate
  # npx prisma db push (chỉ cần nếu đổi tên cột thực trong DB — KHÔNG cần khi chỉ thêm @relation với MongoDB)
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
- **Data Isolation (BẮT BUỘC)**: Xem mục 4.5 bên dưới.

## 4.5. Data Isolation — Phân quyền dữ liệu Server-Side (BẮT BUỘC)

Mọi module CRM **PHẢI** áp dụng data isolation ở tầng server để STAFF chỉ thấy dữ liệu của mình.

### Quy tắc:
- `getCurrentUser()` → kiểm tra `ROLE`
- Nếu `STAFF` → tra `MA_NV` từ bảng `DSNV` → inject vào `where` clause
- Admin/Manager → không filter, thấy hết

### Phải filter ở 3 nơi:

| Nơi | Pattern | Mục đích |
|------|---------|----------|
| `getList()` | `baseWhere.OR = [{ NGUOI_TAO: maNv }, { KH_REL: { SALES_PT: maNv } }]` | Danh sách chỉ hiện record của STAFF |
| `getStats()` | Dùng `baseWhere` cho count/aggregate, **kể cả cross-table queries** | Stats cards chỉ tính data của STAFF |
| `searchKhachHang*()` | `andConditions.push({ SALES_PT: maNv })` | Dropdown tạo mới chỉ hiện KH của STAFF |
| `searchHopDong*()` | `where.AND = [{ OR: [{ NGUOI_TAO }, { KHTN_REL.SALES_PT }] }]` | Dropdown chọn HĐ chỉ hiện HĐ của STAFF |

### ⚠️ Cross-table Stats:
Nếu `getStats()` query **bảng khác** (VD: Cơ hội tổng từ HOP_DONG, Hợp đồng tổng từ THANH_TOAN), bảng đó cũng PHẢI filter theo STAFF qua relation ngược.

### Code mẫu chuẩn:
Xem `.agents/skills/create-new-feature/SKILL.md` → Bước 2.5.

### Checklist:
- [ ] `getList()` có `baseWhere` filter STAFF
- [ ] `getStats()` có `baseWhere` filter STAFF (bao gồm cross-table)
- [ ] `searchKhachHangFor[Module]()` có filter `SALES_PT`
- [ ] `searchHopDongFor[Module]()` có filter (nếu có)
- [ ] Các hàm `getXXXByKH(maKH)` KHÔNG cần sửa (KH dropdown đã filter)

## 5. Tạo Các UI Đặc thù (components/) — THEO QUY CHUẨN
Bên trong `src/features/[tên-tính-năng]/components/`:
- Component thường là `"use client"` dùng để tương tác (Form nộp dữ liệu, Bảng hiển thị, Filter).
- Gọi các hàm mutation (Server Actions) từ `action.ts`.
- **LƯU Ý QUAN TRỌNG VỀ FILTER:** Không sử dụng state cục bộ (`useState`) để lọc hay Search. Phải gắn filter param vào **URL** thông qua hook `useSearchParams` và đẩy Route `router.replace(?)`.

### Checklist UI bắt buộc cho `[Tên]PageClient.tsx`:
- [ ] `showFilters` state + nút `Settings2` toggle cho mobile
- [ ] `viewMode` state (`"list" | "card"`) + nút `LayoutList`/`LayoutGrid` toggle cho mobile
- [ ] Desktop toolbar (`hidden lg:flex`) hiển thị filter + ColumnToggle + Download
- [ ] Mobile expanded filters (`lg:hidden`) với animation `animate-in slide-in-from-top-2`
- [ ] **Toolbar gradient**: `bg-linear-to-b from-primary/3 to-primary/8`, border `border-primary/10`
- [ ] Truyền `viewMode` prop xuống List component
- [ ] Sử dụng `<SearchInput>` và `<FilterSelect>` (đã có sẵn)

### Checklist UI bắt buộc cho `[Tên]List.tsx`:
- [ ] `sortConfig` state + `sortedData` (useMemo) + `handleSort` + `SortIcon`
- [ ] Nhận prop `viewMode?: "list" | "card"`
- [ ] Desktop table header sortable (click → ASC → DESC, icon ArrowUpDown/Up/Down)
- [ ] **Card view** (`viewMode === "card"`): `lg:hidden`, đầy đủ nút hành động
- [ ] **Table view**: `viewMode === "card" ? "hidden lg:block" : ""`
- [ ] Cả desktop và mobile dùng cùng `sortedData`
- [ ] Mobile action dropdown (MoreHorizontal + DropdownMenu) trong table view
- [ ] Label trong modal/form: `text-sm font-semibold` (KHÔNG uppercase)
- [ ] Table header: `bg-primary/10`, `font-bold text-muted-foreground tracking-widest text-[12px]`

### Checklist Toast thông báo (BẮT BUỘC):
- [ ] Import `import { toast } from 'sonner';` trong mọi component có thao tác CRUD
- [ ] **Thêm**: `toast.success("Thêm ... thành công!")` / `toast.error(result.message)`
- [ ] **Sửa**: `toast.success("Cập nhật thành công!")` / `toast.error(result.message)`
- [ ] **Xóa**: `toast.success("Đã xóa ...!")` / `toast.error(result.message)`
- [ ] **Thêm hàng loạt** (nếu có): `toast.success(result.message)` / `toast.error(result.message)`

### Checklist Modal (BẮT BUỘC dùng `Modal` chung):
- [ ] Import `Modal` từ `@/components/Modal` — **KHÔNG** tạo custom div modal
- [ ] Mỗi modal phải có `icon` prop (lucide-react icon phù hợp)
- [ ] Nút Hủy + Submit nằm trong `footer` prop — **KHÔNG** trong body form
- [ ] Footer pattern: `<span />` + `<div className="flex gap-3">Hủy + Submit</div>`
- [ ] Form bên trong modal có `id="form-xxx"`, nút submit dùng `requestSubmit()`
- [ ] Modal nhiều nội dung: dùng `fullHeight` + `size="lg"` trở lên
- [ ] Dùng `DeleteConfirmDialog` chung cho modal xóa — **KHÔNG** viết riêng
- [ ] Xem code mẫu chi tiết tại: `.agents/skills/create-new-feature/ui-patterns.md` mục 6

### Checklist Pagination (BẮT BUỘC):
- [ ] Import `Pagination` từ `@/components/Pagination`
- [ ] Luôn hiển thị Pagination (KHÔNG check `totalPages > 1`)
- [ ] Truyền `pageSize` prop vào `<Pagination>` component
- [ ] Client component nhận `pageSize` prop từ server page

## 6. Lắp ghép vào Giao diện (App Route)
Tạo trang ở `src/app/(dashboard)/[tên-tính-năng]/page.tsx`:
- Đây là một **Server Component** (Tuyệt đối không có `"use client"`).
- Fetch data trực tiếp qua hàm `get...` được lấy từ `action.ts`.
- Đọc `searchParams` để xác định filter người dùng muốn. Truyền data vào Client Component dọn sẵn ở Bước 5.
- **Pagination + Global PageSize**: 
  - Import `import { getRowsPerPage } from '@/lib/getRowsPerPage';`
  - Đọc: `const pageSize = await getRowsPerPage(params.pageSize);`
  - Truyền `limit: pageSize` vào hàm fetch + `pageSize={pageSize}` vào Client Component.
  - **KHÔNG** hardcode `limit: 10` hay `limit: 15`.

## 7. Khai báo & Phân Quyền Tính năng mới (BẮT BUỘC)
Sau khi tạo xong giao diện và logic, bạn **phải** cho tính năng này vào mạng lưới quản trị phân quyền:
1. **Đăng ký danh tính:** Mở `src/lib/permissions.ts` và khai báo object tính năng mới vào mảng `MODULES`. VD: `{ key: '[tên-tính-năng]', label: '...', group: '...' }`
2. **Bảo vệ Trang:** Trong file Page Client (thuộc `components/`), bọc toàn bộ mã HTML rễ bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="view" showNoAccess>` để tự chặn truy cập trái phép.
3. **Bảo vệ Nút thao tác:** Bọc các nút tạo mới, chỉnh sửa, xóa bằng `<PermissionGuard moduleKey="[tên-tính-năng]" level="add">`, `level="edit"`, `level="delete"`, hoặc `level="manage"` tương ứng với hành động.
4. **Gắn Menu Trái (Sidebar):** Mở `src/components/AppSidebar.tsx` và thêm menu mới kèm `moduleKey: '[tên-tính-năng]'` (nó sẽ tự động bị giấu đi nếu nhân viên không có quyền).
5. **Gắn Dashboard:** Mở `src/app/(dashboard)/dashboard/page.tsx`, thêm thông tin tính năng vào mảng `moduleGroups` dưới dạng card và gắn biến `moduleKey`. Thẻ card sẽ tự động ẩn đi đối với staff thiếu quyền.

