/**
 * Script migrate GIA_NHAP: Thêm các cột mới từ MA_HH
 * ─────────────────────────────────────────────────────
 * DỮ LIỆU CŨ (5 records):
 *   MA_NCC, TEN_NCC, MA_HH, TEN_HH, DVT, DON_GIA
 *
 * DỮ LIỆU MỚI cần thêm:
 *   MA_NHOM_HH  → DMHH.MA_HH →  PHANLOAI_HH.MA_PHAN_LOAI → NHOM_HH (qua PHANLOAI_HH)
 *   MA_PHAN_LOAI → DMHH.MA_PHAN_LOAI
 *   MA_DONG_HANG → DMHH.MA_DONG_HANG
 *   MA_GOI_GIA   → GOI_GIA.ID_GOI_GIA (chọn gói giá đầu tiên active của DONG_HANG)
 *
 * CHẠY: npx tsx scripts/migrate-gia-nhap.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu migrate GIA_NHAP → thêm MA_NHOM_HH, MA_PHAN_LOAI, MA_DONG_HANG, MA_GOI_GIA\n');

    // 1. Load lookup tables
    const dmhhList = await prisma.dMHH.findMany({
        select: { MA_HH: true, MA_PHAN_LOAI: true, MA_DONG_HANG: true }
    });
    const hhMap = new Map(dmhhList.map(h => [h.MA_HH, h]));
    console.log(`📋 DMHH: ${dmhhList.length} bản ghi`);

    // PHANLOAI_HH để lấy NHOM_HH — cần model NHOM_HH
    // Hiện tại NHOM_HH lưu MA_NHOM, PHANLOAI_HH lưu MA_NHOM_HH
    // Prisma schema: PHANLOAI_HH có MA_NHOM_HH → NHOM_HH
    const phanLoaiList = await prisma.pHANLOAI_HH.findMany({
        select: { MA_PHAN_LOAI: true, NHOM: true }
    });
    // PHANLOAI_HH có field NHOM (text tên nhóm) → map sang MA_NHOM của NHOM_HH
    const nhomHHList = await prisma.nHOM_HH.findMany({
        select: { MA_NHOM: true, TEN_NHOM: true }
    });
    const tenToMaNhom = new Map(nhomHHList.map(n => [n.TEN_NHOM.trim().toLowerCase(), n.MA_NHOM]));
    // Map: MA_PHAN_LOAI → MA_NHOM
    const plToNhom = new Map(phanLoaiList.map(p => [
        p.MA_PHAN_LOAI,
        p.NHOM ? (tenToMaNhom.get(p.NHOM.trim().toLowerCase()) || '') : ''
    ]));
    console.log(`PHANLOAI_HH: ${phanLoaiList.length} ban ghi`);
    console.log(`NHOM_HH: ${nhomHHList.length} ban ghi`);


    const goiGiaList = await prisma.gOI_GIA.findMany({
        select: { ID_GOI_GIA: true, MA_DONG_HANG: true, HIEU_LUC: true },
        orderBy: { HIEU_LUC: 'desc' } // active trước
    });
    // Map: MA_DONG_HANG → ID_GOI_GIA đầu tiên (active → inactive)
    const dongHangToGoiGia = new Map<string, string>();
    for (const g of goiGiaList) {
        if (!dongHangToGoiGia.has(g.MA_DONG_HANG)) {
            dongHangToGoiGia.set(g.MA_DONG_HANG, g.ID_GOI_GIA);
        }
    }
    console.log(`GOI_GIA: ${goiGiaList.length} ban ghi`);


    // 2. Đọc GIA_NHAP cũ
    const raw = await prisma.$runCommandRaw({ find: 'GIA_NHAP', filter: {} }) as any;
    const docs = raw.cursor?.firstBatch || [];
    console.log(`\n📦 Tổng GIA_NHAP: ${docs.length} bản ghi\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of docs) {
        const id = doc._id;
        const maHH = doc.MA_HH;

        // Đã có đủ fields chính → skip
        if (doc.MA_NHOM_HH && doc.MA_PHAN_LOAI && doc.MA_DONG_HANG) {
            console.log(`   ⏭️  MA_HH=${maHH}: Đã có đủ dữ liệu → skip`);
            skipped++;
            continue;
        }

        // Lookup từ DMHH
        const hhInfo = hhMap.get(maHH);
        if (!hhInfo) {
            console.log(`   ❌ MA_HH=${maHH}: Không tìm thấy trong DMHH!`);
            errors++;
            continue;
        }

        const maPhanLoai = hhInfo.MA_PHAN_LOAI;
        const maDongHang = hhInfo.MA_DONG_HANG;

        if (!maPhanLoai || !maDongHang) {
            console.log(`   ❌ MA_HH=${maHH}: DMHH chưa có MA_PHAN_LOAI hoặc MA_DONG_HANG!`);
            errors++;
            continue;
        }

        // Lookup NHOM_HH từ PHANLOAI_HH
        const maNhomHH = plToNhom.get(maPhanLoai) || '';
        if (!maNhomHH) {
            console.log(`   ⚠️  MA_HH=${maHH}: PHANLOAI_HH ${maPhanLoai} không có MA_NHOM_HH, để rỗng`);
        }

        // Lookup GOI_GIA đầu tiên của dong hang
        const maGoiGia = dongHangToGoiGia.get(maDongHang) || '';
        if (!maGoiGia) {
            console.log(`   ⚠️  MA_HH=${maHH}: Dòng hàng ${maDongHang} chưa có gói giá → MA_GOI_GIA='', cần thêm sau`);
        }

        // Update record
        await prisma.$runCommandRaw({
            update: 'GIA_NHAP',
            updates: [{
                q: { _id: id },
                u: {
                    $set: {
                        MA_NHOM_HH: maNhomHH,
                        MA_PHAN_LOAI: maPhanLoai,
                        MA_DONG_HANG: maDongHang,
                        MA_GOI_GIA: maGoiGia,
                    },
                    $unset: {
                        TEN_NCC: '',
                        TEN_HH: '',
                        DVT: '',
                    }
                }
            }]
        });

        console.log(`   ✅ MA_HH=${maHH}: PL=${maPhanLoai}, DH=${maDongHang}, NhomHH=${maNhomHH}, GoiGia=${maGoiGia}`);
        updated++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRATE GIA_NHAP HOÀN TẤT!');
    console.log('═'.repeat(60));
    console.log(`   ✅ Đã migrate:  ${updated}`);
    console.log(`   ⏭️  Đã skip:     ${skipped}`);
    console.log(`   ❌ Lỗi:         ${errors}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
