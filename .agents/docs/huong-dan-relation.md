# Hướng dẫn: Xử lý cột liên kết giữa các bảng (Prisma @relation)

> **Quy tắc chung**: Khi một bảng có cột tham chiếu (chọn từ) bảng khác → **lưu MÃ (code)** trong DB, khi hiển thị thì dùng `include` để lấy tên.

---

## Mục lục

1. [Tổng quan cách hoạt động](#1-tổng-quan)
2. [Bước 1: Khai báo schema](#2-bước-1-khai-báo-schema)
3. [Bước 2: Chạy generate](#3-bước-2-chạy-generate)
4. [Bước 3: Viết action (lưu/query)](#4-bước-3-viết-action)
5. [Bước 4: Hiển thị trong UI](#5-bước-4-hiển-thị-trong-ui)
6. [Bước 5: Form chọn (dropdown)](#6-bước-5-form-chọn-dropdown)
7. [Ví dụ thực tế: GIA_BAN ↔ NHOM_HH](#7-ví-dụ-thực-tế)
8. [Các trường hợp thường gặp](#8-các-trường-hợp-thường-gặp)
9. [Lưu ý quan trọng với MongoDB](#9-lưu-ý-mongodb)

---

## 1. Tổng quan

### ❌ Cách CŨ (Denormalize - lưu text)
```
GIA_BAN.NHOM_HH = "Tấm PU"    ← lưu text trực tiếp
                                ← Nếu đổi tên nhóm → dữ liệu cũ bị lệch
```

### ✅ Cách MỚI (@relation - lưu mã)
```
GIA_BAN.MA_NHOM_HH = "NH01"   ← lưu mã
NHOM_HH.MA_NHOM = "NH01"      ← bảng gốc chứa tên
                                ← Khi query, Prisma tự join lấy tên
                                ← Đổi tên nhóm → hiển thị luôn đúng
```

---

## 2. Bước 1: Khai báo Schema

### Mẫu chuẩn

Giả sử bảng `BANG_A` có cột liên kết đến bảng `BANG_B`:

```prisma
// ===== BẢNG B (bảng được tham chiếu) =====
model BANG_B {
  ID       String @id @default(auto()) @map("_id") @db.ObjectId
  MA_B     String @unique    // ← Cột unique dùng làm khóa liên kết
  TEN_B    String            // ← Tên hiển thị

  // Relation ngược (BẮT BUỘC phải khai báo)
  BANG_AS  BANG_A[]           // ← Prisma cần dòng này ở cả 2 phía

  CREATED_AT DateTime @default(now())
  UPDATED_AT DateTime @updatedAt

  @@map("BANG_B")
}

// ===== BẢNG A (bảng chứa cột liên kết) =====
model BANG_A {
  ID       String @id @default(auto()) @map("_id") @db.ObjectId

  // --- Cột liên kết ---
  MA_B     String                                       // ← Cột thực trong DB, lưu mã
  REL_B    BANG_B @relation(fields: [MA_B], references: [MA_B])
  //  ↑ tên relation (tùy đặt)    ↑ cột ở bảng A   ↑ cột ở bảng B
  // REL_B KHÔNG phải cột thực, chỉ là khai báo cho Prisma

  // --- Các cột khác ---
  TEN_A    String

  CREATED_AT DateTime @default(now())
  UPDATED_AT DateTime @updatedAt

  @@index([MA_B])              // ← Nên đánh index cho cột khóa ngoại
  @@map("BANG_A")
}
```

### Quy tắc đặt tên

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Cột lưu mã | `MA_` + tên bảng tham chiếu | `MA_NHOM_HH`, `MA_PHAN_LOAI` |
| Tên relation | Tên ngắn gọn, viết HOA | `NHOM`, `PHAN_LOAI`, `GOI_GIA_REL` |
| Relation ngược | Tên bảng + `S` (số nhiều) | `GIA_BANS`, `DONG_HHS` |

> [!IMPORTANT]
> Tên relation (VD: `NHOM`) **KHÔNG được trùng** với tên cột thực (VD: `MA_NHOM_HH`).
> Prisma sẽ báo lỗi nếu trùng tên.

---

## 3. Bước 2: Chạy Generate

Sau khi sửa schema, chạy:

```bash
npx prisma generate
```

> [!WARNING]
> **KHÔNG cần chạy `prisma db push`** nếu chỉ thêm `@relation`. Với MongoDB, relation chỉ tồn tại ở tầng Prisma, không ảnh hưởng DB.
> 
> Chỉ cần `db push` nếu bạn **đổi tên cột** (VD: `NHOM_HH` → `MA_NHOM_HH`).

---

## 4. Bước 3: Viết Action (Lưu / Query)

### 4.1. Khi TẠO mới (Create)

```typescript
// Cách 1: Gán trực tiếp mã (đơn giản)
await prisma.bANG_A.create({
    data: {
        MA_B: "B001",       // ← Lưu mã từ dropdown
        TEN_A: "Test",
    }
});

// Cách 2: Dùng connect (an toàn hơn - Prisma validate mã tồn tại)
await prisma.bANG_A.create({
    data: {
        REL_B: {
            connect: { MA_B: "B001" }   // ← Prisma kiểm tra B001 có tồn tại không
        },
        TEN_A: "Test",
    }
});
```

> [!TIP]
> **Khuyến nghị**: Dùng **Cách 1** (gán trực tiếp) cho đơn giản. Nếu muốn chặt chẽ hơn, dùng Cách 2.

### 4.2. Khi QUERY (Read) - Lấy tên hiển thị

```typescript
// KHÔNG include → chỉ có mã
const data = await prisma.bANG_A.findMany();
// → { MA_B: "B001", TEN_A: "Test" }   ← không có tên của B

// CÓ include → lấy luôn thông tin bảng B
const data = await prisma.bANG_A.findMany({
    include: {
        REL_B: true    // ← Thêm 1 dòng này
    }
});
// → {
//     MA_B: "B001",
//     REL_B: { ID: "...", MA_B: "B001", TEN_B: "Tên bảng B" },  ← Object đầy đủ
//     TEN_A: "Test"
//   }

// Chỉ lấy TEN (tiết kiệm data)
const data = await prisma.bANG_A.findMany({
    include: {
        REL_B: {
            select: { TEN_B: true }    // ← Chỉ lấy field cần thiết
        }
    }
});
// → { MA_B: "B001", REL_B: { TEN_B: "Tên bảng B" }, TEN_A: "Test" }
```

### 4.3. Khi CẬP NHẬT (Update)

```typescript
await prisma.bANG_A.update({
    where: { ID: id },
    data: {
        MA_B: "B002",       // ← Đổi mã liên kết
        TEN_A: "Test mới",
    }
});
```

### 4.4. Khi FILTER theo bảng liên kết

```typescript
// Lọc BANG_A theo field của BANG_B
const data = await prisma.bANG_A.findMany({
    where: {
        REL_B: {
            TEN_B: { contains: "Tấm", mode: "insensitive" }
        }
    },
    include: { REL_B: true }
});
```

---

## 5. Bước 4: Hiển thị trong UI

### Trong bảng (Table)

```tsx
// Hiển thị tên từ relation, fallback về mã nếu null
<td>{item.REL_B?.TEN_B || item.MA_B}</td>

// Hoặc hiển thị cả mã + tên
<td>{item.MA_B} - {item.REL_B?.TEN_B}</td>
```

### Trong card (Mobile)

```tsx
<p>
  <span className="font-medium">Nhóm HH:</span>{" "}
  {item.NHOM?.TEN_NHOM || item.MA_NHOM_HH}
</p>
```

---

## 6. Bước 5: Form Chọn (Dropdown)

### Lấy options

```typescript
// Server action: Lấy danh sách để hiển thị dropdown
export async function getBangBOptions() {
    return await prisma.bANG_B.findMany({
        select: { ID: true, MA_B: true, TEN_B: true },
        orderBy: { CREATED_AT: 'asc' },
    });
}
```

### Dropdown component

```tsx
// value = MÃ (lưu vào DB), hiển thị = MÃ + TÊN
<select
    value={selectedMaB}
    onChange={e => setSelectedMaB(e.target.value)}
    required
    className="input-modern"
>
    <option value="">-- Chọn --</option>
    {options.map(item => (
        <option key={item.ID} value={item.MA_B}>
            {item.MA_B} - {item.TEN_B}
        </option>
    ))}
</select>
```

> [!IMPORTANT]
> **`value` của `<option>` phải là MÃ** (VD: `item.MA_B`), không phải tên.
> Vì đây là giá trị sẽ được **lưu vào DB** khi submit form.

---

## 7. Ví dụ thực tế: GIA_BAN ↔ NHOM_HH

### Schema

```prisma
model NHOM_HH {
  ID       String @id @default(auto()) @map("_id") @db.ObjectId
  MA_NHOM  String @unique
  TEN_NHOM String

  GIA_BANS GIA_BAN[]        // ← Relation ngược

  CREATED_AT DateTime @default(now())
  UPDATED_AT DateTime @updatedAt
  @@map("NHOM_HH")
}

model GIA_BAN {
  ID             String   @id @default(auto()) @map("_id") @db.ObjectId
  NGAY_HIEU_LUC  DateTime
  MA_NHOM_HH     String                    // ← Lưu mã nhóm (trước đây là NHOM_HH lưu text)
  NHOM           NHOM_HH  @relation(fields: [MA_NHOM_HH], references: [MA_NHOM])
  GOI_GIA        String
  MA_HH          String
  TEN_HH         String
  DON_GIA        Float
  GHI_CHU        String?

  CREATED_AT DateTime @default(now())
  UPDATED_AT DateTime @updatedAt

  @@index([MA_NHOM_HH, MA_HH])
  @@map("GIA_BAN")
}
```

### Action

```typescript
// Tạo giá bán
export async function createGiaBan(data: {
    NGAY_HIEU_LUC: string;
    MA_NHOM_HH: string;     // ← Nhận MÃ từ form
    GOI_GIA: string;
    MA_HH: string;
    TEN_HH: string;
    DON_GIA: number;
    GHI_CHU?: string;
}) {
    await prisma.gIA_BAN.create({
        data: {
            NGAY_HIEU_LUC: new Date(data.NGAY_HIEU_LUC),
            MA_NHOM_HH: data.MA_NHOM_HH,    // ← Lưu mã
            GOI_GIA: data.GOI_GIA,
            MA_HH: data.MA_HH,
            TEN_HH: data.TEN_HH,
            DON_GIA: data.DON_GIA,
            GHI_CHU: data.GHI_CHU || null,
        }
    });
}

// Query + lấy tên
export async function getGiaBanList() {
    const data = await prisma.gIA_BAN.findMany({
        include: {
            NHOM: {
                select: { TEN_NHOM: true }   // ← Prisma auto-join
            }
        },
        orderBy: { NGAY_HIEU_LUC: 'desc' },
    });
    return data;
}
```

### UI

```tsx
// Desktop table
<td>{item.NHOM?.TEN_NHOM || item.MA_NHOM_HH}</td>

// Form dropdown - value là MÃ
<select value={maNhomHH} onChange={e => setMaNhomHH(e.target.value)}>
    <option value="">-- Chọn nhóm HH --</option>
    {nhomHhOptions.map(n => (
        <option key={n.ID} value={n.MA_NHOM}>
            {n.MA_NHOM} - {n.TEN_NHOM}
        </option>
    ))}
</select>
```

---

## 8. Các trường hợp thường gặp

### 8.1. Một bảng liên kết NHIỀU bảng khác

```prisma
model GIA_BAN {
  // Liên kết 1: Nhóm HH
  MA_NHOM_HH  String
  NHOM        NHOM_HH  @relation(fields: [MA_NHOM_HH], references: [MA_NHOM])

  // Liên kết 2: Hàng hóa
  MA_HH       String
  HANG_HOA    DMHH     @relation(fields: [MA_HH], references: [MA_HH])

  // ... các cột khác
}
```

Query:
```typescript
const data = await prisma.gIA_BAN.findMany({
    include: {
        NHOM: { select: { TEN_NHOM: true } },
        HANG_HOA: { select: { TEN_HH: true, MODEL: true } },
    }
});
```

### 8.2. Quan hệ cha-con (Self-relation kiểu phân cấp)

Ví dụ: Phân loại → Dòng hàng (đã có trong dự án)

```prisma
model PHANLOAI_HH {
  MA_PHAN_LOAI  String @unique
  DONG_HHS      DONG_HH[]       // ← Có nhiều dòng hàng con
}

model DONG_HH {
  MA_PHAN_LOAI  String
  PHAN_LOAI     PHANLOAI_HH @relation(fields: [MA_PHAN_LOAI], references: [MA_PHAN_LOAI])
}
```

### 8.3. Liên kết bằng ObjectId thay vì mã

```prisma
model KEHOACH_CSKH {
  ID_KH  String @db.ObjectId           // ← Dùng ObjectId
  KH     KHTN   @relation(fields: [ID_KH], references: [ID])
}
```

---

## 9. Lưu ý quan trọng với MongoDB

> [!CAUTION]
> MongoDB **KHÔNG có foreign key thật** ở tầng database. `@relation` trong Prisma + MongoDB chỉ hoạt động ở **tầng application**.

### Điều này có nghĩa là:

| Vấn đề | PostgreSQL | MongoDB |
|---|---|---|
| Validate FK khi insert | ✅ DB tự kiểm tra | ❌ DB không kiểm |
| Cascade delete | ✅ DB tự xóa con | ❌ Phải tự xử lý |
| Join | ✅ SQL JOIN thật | ⚠️ Prisma chạy 2 query |

### Cách xử lý:

1. **Validate trước khi lưu** — kiểm tra mã tồn tại:
```typescript
const nhom = await prisma.nHOM_HH.findUnique({ where: { MA_NHOM: data.MA_NHOM_HH } });
if (!nhom) return { success: false, message: "Nhóm HH không tồn tại" };
```

2. **Cascade delete thủ công** — xóa bản ghi con trước:
```typescript
// Trước khi xóa NHOM_HH, phải xóa/cập nhật GIA_BAN liên quan
await prisma.gIA_BAN.deleteMany({ where: { MA_NHOM_HH: maNhom } });
await prisma.nHOM_HH.delete({ where: { MA_NHOM: maNhom } });
```

3. **Hoặc dùng `connect`** — Prisma tự validate:
```typescript
await prisma.gIA_BAN.create({
    data: {
        NHOM: { connect: { MA_NHOM: "NH01" } },  // ← Prisma sẽ báo lỗi nếu NH01 không tồn tại
    }
});
```

---

## Checklist khi thêm relation mới

- [ ] Thêm cột mã vào bảng con: `MA_XXX String`
- [ ] Thêm dòng `@relation`: `REL_XXX BANG_XXX @relation(fields: [...], references: [...])`
- [ ] Thêm relation ngược vào bảng cha: `BANG_CON_S BANG_CON[]`
- [ ] Thêm `@@index([MA_XXX])` cho cột khóa ngoại
- [ ] Chạy `npx prisma generate`
- [ ] Cập nhật action: thêm `include` khi query
- [ ] Cập nhật form: dropdown `value` = mã, hiển thị = mã + tên
- [ ] Cập nhật UI: hiển thị `item.REL_XXX?.TEN_XXX`
- [ ] Validate mã tồn tại trước khi lưu (nếu cần)
