"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── CD_LOAI_CONG_TRINH ───────────────────────────────────────

export async function getCdLoaiCongTrinh() {
    try {
        const data = await prisma.cD_LOAI_CONG_TRINH.findMany({ orderBy: [{ STT: "asc" }, { CREATED_AT: "asc" }] });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createCdLoaiCongTrinh(loai: string, stt: number = 0) {
    try {
        if (!loai.trim()) return { success: false, message: "Vui lòng nhập loại công trình" };
        const exists = await prisma.cD_LOAI_CONG_TRINH.findFirst({
            where: { LOAI_CONG_TRINH: { equals: loai.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Loại "${loai.trim()}" đã tồn tại` };
        let finalStt = stt;
        if (finalStt === 0 || !finalStt) {
            const last = await prisma.cD_LOAI_CONG_TRINH.findFirst({
                orderBy: { STT: "desc" },
                select: { STT: true },
            });
            finalStt = (last?.STT || 0) + 1;
        }

        await prisma.cD_LOAI_CONG_TRINH.create({ data: { LOAI_CONG_TRINH: loai.trim(), STT: finalStt } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi khi thêm loại công trình" }; }
}

export async function deleteCdLoaiCongTrinh(id: string) {
    try {
        await prisma.cD_LOAI_CONG_TRINH.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi xóa loại công trình" }; }
}

// ─── CD_NHOM_KS ───────────────────────────────────────────────

export async function getCdNhomKS() {
    try {
        const data = await prisma.cD_NHOM_KS.findMany({ orderBy: [{ STT: "asc" }, { CREATED_AT: "asc" }] });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createCdNhomKS(nhom: string, stt: number = 0) {
    try {
        if (!nhom.trim()) return { success: false, message: "Vui lòng nhập tên nhóm KS" };
        const exists = await prisma.cD_NHOM_KS.findFirst({
            where: { NHOM_KS: { equals: nhom.trim(), mode: "insensitive" } }
        });
        if (exists) return { success: false, message: `Nhóm "${nhom.trim()}" đã tồn tại` };
        let finalStt = stt;
        if (finalStt === 0 || !finalStt) {
            const last = await prisma.cD_NHOM_KS.findFirst({
                orderBy: { STT: "desc" },
                select: { STT: true },
            });
            finalStt = (last?.STT || 0) + 1;
        }

        await prisma.cD_NHOM_KS.create({ data: { NHOM_KS: nhom.trim(), STT: finalStt } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi khi thêm nhóm KS" }; }
}

export async function deleteCdNhomKS(id: string) {
    try {
        await prisma.cD_NHOM_KS.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch { return { success: false, message: "Lỗi xóa nhóm KS" }; }
}

// ─── HANG_MUC_KS ──────────────────────────────────────────────

export async function getHangMucKS() {
    try {
        const data = await prisma.hANG_MUC_KS.findMany({
            orderBy: [{ LOAI_CONG_TRINH: "asc" }, { NHOM_KS: "asc" }, { STT: "asc" }, { HANG_MUC_KS: "asc" }]
        });
        return { success: true, data };
    } catch { return { success: false, data: [] }; }
}

export async function createHangMucKS(formData: FormData) {
    try {
        const LOAI_CONG_TRINH = formData.get("LOAI_CONG_TRINH")?.toString().trim();
        const NHOM_KS = formData.get("NHOM_KS")?.toString().trim();
        const HANG_MUC_KS = formData.get("HANG_MUC_KS")?.toString().trim();
        const HIEU_LUC = formData.get("HIEU_LUC") !== "false";

        if (!LOAI_CONG_TRINH || !NHOM_KS || !HANG_MUC_KS)
            return { success: false, message: "Vui lòng điền đầy đủ loại công trình, nhóm KS và tên hạng mục" };

        const existing = await prisma.hANG_MUC_KS.findFirst({
            where: {
                LOAI_CONG_TRINH,
                NHOM_KS,
                HANG_MUC_KS: { equals: HANG_MUC_KS, mode: 'insensitive' }
            }
        });
        if (existing) {
            return { success: false, message: `Hạng mục "${HANG_MUC_KS}" đã tồn tại trong nhóm khảo sát này` };
        }

        // Sinh MA_HMKS tự động: HMKS-YYMMDD-XXX
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `HMKS-${yy}${mm}${dd}-`;

        const last = await prisma.hANG_MUC_KS.findFirst({
            where: { MA_HMKS: { startsWith: prefix } },
            orderBy: { MA_HMKS: 'desc' },
            select: { MA_HMKS: true },
        });

        let nextNum = 1;
        if (last?.MA_HMKS) {
            const parts = last.MA_HMKS.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }

        // Tính toán STT tự động
        const lastSttRecord = await prisma.hANG_MUC_KS.findFirst({
            where: { LOAI_CONG_TRINH, NHOM_KS },
            orderBy: { STT: 'desc' },
            select: { STT: true },
        });
        const stt = (lastSttRecord?.STT || 0) + 1;

        let created = false;
        let attempts = 0;

        while (!created && attempts < 20) {
            const maHmks = `${prefix}${String(nextNum).padStart(3, '0')}`;
            try {
                await prisma.hANG_MUC_KS.create({
                    data: { MA_HMKS: maHmks, LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_KS, HIEU_LUC, STT: stt },
                });
                created = true;
            } catch (error: any) {
                if (error.code === 'P2002') {
                    nextNum++;
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        if (!created) {
            return { success: false, message: "Hệ thống bận, vui lòng thử lại sau." };
        }

        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}

export async function createMultipleHangMucKS(data: { LOAI_CONG_TRINH: string, NHOM_KS: string, HANG_MUC_LIST: string[], HIEU_LUC: boolean }) {
    try {
        const { LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_LIST, HIEU_LUC } = data;
        
        if (!LOAI_CONG_TRINH || !NHOM_KS || !HANG_MUC_LIST || HANG_MUC_LIST.length === 0)
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };

        const validList = HANG_MUC_LIST.filter(h => h.trim() !== "");
        if (validList.length === 0)
            return { success: false, message: "Vui lòng nhập ít nhất một hạng mục KS" };

        const allExisting = await prisma.hANG_MUC_KS.findMany({
            where: { LOAI_CONG_TRINH, NHOM_KS },
            select: { HANG_MUC_KS: true }
        });
        
        for (const hangMuc of validList) {
            const exists = allExisting.some(e => e.HANG_MUC_KS.toLowerCase() === hangMuc.trim().toLowerCase());
            if (exists) {
                return { success: false, message: `Hạng mục "${hangMuc.trim()}" đã tồn tại trong nhóm khảo sát này` };
            }
        }

        // Sinh MA_HMKS tự động: HMKS-YYMMDD-XXX
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `HMKS-${yy}${mm}${dd}-`;

        const last = await prisma.hANG_MUC_KS.findFirst({
            where: { MA_HMKS: { startsWith: prefix } },
            orderBy: { MA_HMKS: 'desc' },
            select: { MA_HMKS: true },
        });

        let nextNum = 1;
        if (last?.MA_HMKS) {
            const parts = last.MA_HMKS.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }

        // Tính toán STT tự động
        const lastSttRecord = await prisma.hANG_MUC_KS.findFirst({
            where: { LOAI_CONG_TRINH, NHOM_KS },
            orderBy: { STT: 'desc' },
            select: { STT: true },
        });
        let nextStt = (lastSttRecord?.STT || 0) + 1;

        const createData = validList.map((hangMuc, index) => {
            const maHmks = `${prefix}${String(nextNum + index).padStart(3, '0')}`;
            return {
                MA_HMKS: maHmks,
                LOAI_CONG_TRINH,
                NHOM_KS,
                HANG_MUC_KS: hangMuc.trim(),
                HIEU_LUC,
                STT: nextStt + index
            };
        });

        await prisma.hANG_MUC_KS.createMany({
            data: createData
        });

        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { 
        return { success: false, message: e.message || "Lỗi không xác định" }; 
    }
}

export async function createBulkHangMucKS(data: { LOAI_CONG_TRINH: string, ITEMS: { NHOM_KS: string, HANG_MUC_LIST: string[] }[], HIEU_LUC: boolean }) {
    try {
        const { LOAI_CONG_TRINH, ITEMS, HIEU_LUC } = data;
        
        if (!LOAI_CONG_TRINH || !ITEMS || ITEMS.length === 0)
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };

        let totalValidItems = 0;
        ITEMS.forEach(item => {
            const valid = item.HANG_MUC_LIST.filter(h => h.trim() !== "");
            totalValidItems += valid.length;
        });

        if (totalValidItems === 0) {
            return { success: false, message: "Vui lòng nhập ít nhất một hạng mục KS" };
        }

        const allExistingBulk = await prisma.hANG_MUC_KS.findMany({
            where: { LOAI_CONG_TRINH },
            select: { NHOM_KS: true, HANG_MUC_KS: true }
        });
        
        for (const group of ITEMS) {
            const validList = group.HANG_MUC_LIST.filter(h => h.trim() !== "");
            for (const hangMuc of validList) {
                const exists = allExistingBulk.some(e => e.NHOM_KS === group.NHOM_KS && e.HANG_MUC_KS.toLowerCase() === hangMuc.trim().toLowerCase());
                if (exists) {
                    return { success: false, message: `Hạng mục "${hangMuc.trim()}" đã tồn tại trong nhóm "${group.NHOM_KS}"` };
                }
            }
        }

        // Sinh MA_HMKS tự động: HMKS-YYMMDD-XXX
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `HMKS-${yy}${mm}${dd}-`;

        let inserted = false;
        let attempts = 0;

        while (!inserted && attempts < 10) {
            try {
                const all = await prisma.hANG_MUC_KS.findMany({
                    where: { MA_HMKS: { startsWith: prefix } },
                    select: { MA_HMKS: true },
                });

                let maxNum = 0;
                for (const item of all) {
                    const parts = item.MA_HMKS.split('-');
                    const num = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
                
                let nextNum = maxNum + 1;

                // Lấy STT hiện tại của từng nhóm để tự động tăng
                const sttTracker: Record<string, number> = {};
                for (const group of ITEMS) {
                    if (sttTracker[group.NHOM_KS] === undefined) {
                        const last = await prisma.hANG_MUC_KS.findFirst({
                            where: { LOAI_CONG_TRINH, NHOM_KS: group.NHOM_KS },
                            orderBy: { STT: 'desc' },
                            select: { STT: true },
                        });
                        sttTracker[group.NHOM_KS] = (last?.STT || 0) + 1;
                    }
                }

                const createData: any[] = [];
                let currentIndex = 0;

                for (const group of ITEMS) {
                    const validList = group.HANG_MUC_LIST.filter(h => h.trim() !== "");
                    for (const hangMuc of validList) {
                        const maHmks = `${prefix}${String(nextNum + currentIndex).padStart(3, '0')}`;
                        createData.push({
                            MA_HMKS: maHmks,
                            LOAI_CONG_TRINH,
                            NHOM_KS: group.NHOM_KS,
                            HANG_MUC_KS: hangMuc.trim(),
                            HIEU_LUC,
                            STT: sttTracker[group.NHOM_KS]++
                        });
                        currentIndex++;
                    }
                }

                await prisma.hANG_MUC_KS.createMany({
                    data: createData
                });
                inserted = true;
            } catch (error: any) {
                if (error.code === 'P2002') {
                    attempts++;
                    await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
                } else {
                    throw error;
                }
            }
        }

        if (!inserted) {
            return { success: false, message: "Hệ thống bận, không thể tạo mã tự động. Vui lòng thử lại sau" };
        }

        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { 
        return { success: false, message: e.message || "Lỗi không xác định" }; 
    }
}


export async function updateHangMucKS(id: string, data: any) {
    try {
        const LOAI_CONG_TRINH = data.LOAI_CONG_TRINH?.trim();
        const NHOM_KS = data.NHOM_KS?.trim();
        const HANG_MUC_KS = data.HANG_MUC_KS?.trim();
        const STT = Number(data.STT) || 0;
        if (!LOAI_CONG_TRINH || !NHOM_KS || !HANG_MUC_KS)
            return { success: false, message: "Vui lòng điền đầy đủ thông tin" };

        const existing = await prisma.hANG_MUC_KS.findFirst({
            where: {
                LOAI_CONG_TRINH,
                NHOM_KS,
                HANG_MUC_KS: { equals: HANG_MUC_KS, mode: 'insensitive' },
                ID: { not: id }
            }
        });
        if (existing) {
            return { success: false, message: `Hạng mục "${HANG_MUC_KS}" đã tồn tại trong nhóm khảo sát này` };
        }

        await prisma.hANG_MUC_KS.update({
            where: { ID: id },
            data: { LOAI_CONG_TRINH, NHOM_KS, HANG_MUC_KS, STT, HIEU_LUC: data.HIEU_LUC !== false }
        });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}

export async function toggleHangMucKSHieuLuc(id: string, hieuLuc: boolean) {
    try {
        await prisma.hANG_MUC_KS.update({
            where: { ID: id },
            data: { HIEU_LUC: hieuLuc }
        });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}

export async function updateHangMucKSOrder(updates: { id: string; stt: number }[]) {
    try {
        await prisma.$transaction(
            updates.map((item) =>
                prisma.hANG_MUC_KS.update({
                    where: { ID: item.id },
                    data: { STT: item.stt },
                })
            )
        );
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Lỗi không xác định" };
    }
}

export async function deleteHangMucKS(id: string) {
    try {
        await prisma.hANG_MUC_KS.delete({ where: { ID: id } });
        revalidatePath("/hang-muc-ks");
        return { success: true };
    } catch (e: any) { return { success: false, message: e.message || "Lỗi không xác định" }; }
}
