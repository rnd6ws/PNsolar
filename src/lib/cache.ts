// src/lib/cache.ts
// Cache helper cho các danh mục ít thay đổi
// Giảm số lượng DB query trên mỗi page load khi deploy Vercel

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ===== Cache thời gian (giây) =====
const CACHE_5_MIN = 300;
const CACHE_10_MIN = 600;

// =====================================
// KHÁCH HÀNG - Catalog caches
// =====================================

/** Phân loại khách hàng (PHANLOAI_KH) */
export const getCachedPhanLoaiKH = unstable_cache(
    async () => {
        const data = await prisma.pHANLOAI_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["phan-loai-kh"],
    { revalidate: CACHE_5_MIN, tags: ["phan-loai-kh"] }
);

/** Nguồn khách hàng (NGUON_KH) */
export const getCachedNguonKH = unstable_cache(
    async () => {
        const data = await prisma.nGUON_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["nguon-kh"],
    { revalidate: CACHE_5_MIN, tags: ["nguon-kh"] }
);

/** Nhóm khách hàng (NHOM_KH) */
export const getCachedNhomKH = unstable_cache(
    async () => {
        const data = await prisma.nHOM_KH.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["nhom-kh"],
    { revalidate: CACHE_5_MIN, tags: ["nhom-kh"] }
);

/** Danh sách nhân viên (DSNV - active only, basic info) */
export const getCachedNVList = unstable_cache(
    async () => {
        const data = await prisma.dSNV.findMany({
            where: { IS_ACTIVE: true },
            select: { MA_NV: true, HO_TEN: true, ID: true },
            orderBy: { HO_TEN: "asc" },
        });
        const mapped = data.map((d) => ({
            ID: d.MA_NV,
            HO_TEN: d.HO_TEN,
            USER_ID: d.ID,
        }));
        return { success: true, data: mapped };
    },
    ["nv-list"],
    { revalidate: CACHE_10_MIN, tags: ["nv-list"] }
);

/** Người giới thiệu (NGUOI_GIOI_THIEU) */
export const getCachedNguoiGioiThieu = unstable_cache(
    async () => {
        const data = await prisma.nGUOI_GIOI_THIEU.findMany({
            orderBy: { TEN_NGT: "asc" },
        });
        const mapped = data.map((d) => ({
            ID: d.MA_NGT,
            TEN_NGT: d.TEN_NGT,
            SO_DT_NGT: d.SO_DT_NGT,
        }));
        return { success: true, data: mapped };
    },
    ["nguoi-gioi-thieu"],
    { revalidate: CACHE_5_MIN, tags: ["nguoi-gioi-thieu"] }
);

/** Lý do từ chối (LY_DO_TU_CHOI) */
export const getCachedLyDoTuChoi = unstable_cache(
    async () => {
        const data = await prisma.lY_DO_TU_CHOI.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["ly-do-tu-choi"],
    { revalidate: CACHE_5_MIN, tags: ["ly-do-tu-choi"] }
);

// =====================================
// HÀNG HÓA - Catalog caches
// =====================================

/** Nhóm hàng hóa (NHOM_HH) */
export const getCachedNhomHH = unstable_cache(
    async () => {
        const data = await prisma.nHOM_HH.findMany({
            orderBy: { CREATED_AT: "desc" },
        });
        return { success: true, data };
    },
    ["nhom-hh"],
    { revalidate: CACHE_5_MIN, tags: ["nhom-hh"] }
);

/** Phân loại hàng hóa + Dòng hàng (PHANLOAI_HH with DONG_HHS) */
export const getCachedPhanLoaiHHTable = unstable_cache(
    async () => {
        const data = await prisma.pHANLOAI_HH.findMany({
            include: {
                DONG_HHS: {
                    orderBy: { CREATED_AT: "asc" },
                },
            },
            orderBy: { CREATED_AT: "desc" },
        });
        return { success: true, data };
    },
    ["phan-loai-hh-table"],
    { revalidate: CACHE_5_MIN, tags: ["phan-loai-hh"] }
);

/** Dòng hàng options cho dropdown (DONG_HH) */
export const getCachedDongHangOptions = unstable_cache(
    async () => {
        const data = await prisma.dONG_HH.findMany({
            select: {
                ID: true,
                MA_DONG_HANG: true,
                TEN_DONG_HANG: true,
            },
            orderBy: { CREATED_AT: "asc" },
        });
        return data;
    },
    ["dong-hang-options"],
    { revalidate: CACHE_5_MIN, tags: ["dong-hang-options"] }
);

// =====================================
// CƠ HỘI - Catalog caches
// =====================================

/** Danh mục dịch vụ (DM_DICH_VU) */
export const getCachedDmDichVu = unstable_cache(
    async () => {
        const data = await prisma.dM_DICH_VU.findMany({
            orderBy: { NHOM_DV: "asc" },
        });
        const mapped = data.map(d => ({ ...d, ID: d.MA_DV }));
        return { success: true, data: mapped };
    },
    ["dm-dich-vu"],
    { revalidate: CACHE_10_MIN, tags: ["dm-dich-vu"] }
);

// =====================================
// KẾ HOẠCH CS - Catalog caches
// =====================================

/** Loại chăm sóc (LOAI_CHAM_SOC) */
export const getCachedLoaiCS = unstable_cache(
    async () => {
        const data = await prisma.lOAI_CHAM_SOC.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["loai-cs"],
    { revalidate: CACHE_5_MIN, tags: ["loai-cs"] }
);

/** Kết quả chăm sóc (KET_QUA_CS) */
export const getCachedKetQuaCS = unstable_cache(
    async () => {
        const data = await prisma.kET_QUA_CS.findMany({
            orderBy: { CREATED_AT: "asc" },
        });
        return { success: true, data };
    },
    ["ket-qua-cs"],
    { revalidate: CACHE_5_MIN, tags: ["ket-qua-cs"] }
);
