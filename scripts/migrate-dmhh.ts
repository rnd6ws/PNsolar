/**
 * Script migrate DMHH: Chuyển PHAN_LOAI (text) → MA_PHAN_LOAI, DONG_HANG (text) → MA_DONG_HANG
 *
 * DỮ LIỆU CŨ:
 *   PHAN_LOAI: "BIẾN TẦN"         (text)
 *   DONG_HANG: "BIẾN TẦN INVERTER DEYE" (text)
 *
 * DỮ LIỆU MỚI:
 *   MA_PHAN_LOAI: "BTN"  (mã, @relation → PHANLOAI_HH)
 *   MA_DONG_HANG: "SUN"  (mã, @relation → DONG_HH)
 *
 * CHẠY: npx tsx scripts/migrate-dmhh.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu migrate DMHH: PHAN_LOAI/DONG_HANG text → MA codes...\n');

    // 1. Load lookup tables
    const phanLoaiList = await prisma.pHANLOAI_HH.findMany({
        select: { MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true }
    });
    const tenToMaPhanLoai = new Map(phanLoaiList.map(p => [p.TEN_PHAN_LOAI.trim().toLowerCase(), p.MA_PHAN_LOAI]));
    console.log(`📋 Phân loại: ${phanLoaiList.length} bản ghi`);
    phanLoaiList.forEach(p => console.log(`   "${p.TEN_PHAN_LOAI}" → "${p.MA_PHAN_LOAI}"`));

    const dongHangList = await prisma.dONG_HH.findMany({
        select: { MA_DONG_HANG: true, TEN_DONG_HANG: true, MA_PHAN_LOAI: true }
    });
    const tenToMaDongHang = new Map(dongHangList.map(d => [d.TEN_DONG_HANG.trim().toLowerCase(), d.MA_DONG_HANG]));
    console.log(`\n📋 Dòng hàng: ${dongHangList.length} bản ghi`);
    dongHangList.forEach(d => console.log(`   "${d.TEN_DONG_HANG}" → "${d.MA_DONG_HANG}"`));

    // 2. Lấy tất cả DMHH qua raw query
    console.log('\n🔍 Đang đọc dữ liệu DMHH...');
    const rawResult = await prisma.$runCommandRaw({ find: 'DMHH', filter: {} }) as any;
    const documents = rawResult.cursor?.firstBatch || [];
    console.log(`📦 Tìm thấy ${documents.length} bản ghi DMHH\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const doc of documents) {
        const maHH = doc.MA_HH || '?';

        // Đã có đầy đủ field mới → skip
        if (doc.MA_PHAN_LOAI && doc.MA_DONG_HANG) {
            skipped++;
            continue;
        }

        // Resolve MA_PHAN_LOAI
        let maPhanLoai: string | null = doc.MA_PHAN_LOAI || null;
        if (!maPhanLoai && doc.PHAN_LOAI) {
            maPhanLoai = tenToMaPhanLoai.get(doc.PHAN_LOAI.trim().toLowerCase()) || null;
        }

        // Resolve MA_DONG_HANG
        let maDongHang: string | null = doc.MA_DONG_HANG || null;
        if (!maDongHang && doc.DONG_HANG) {
            maDongHang = tenToMaDongHang.get(doc.DONG_HANG.trim().toLowerCase()) || null;
        }

        // Validate
        const errs: string[] = [];
        if (!maPhanLoai) errs.push(`PHAN_LOAI="${doc.PHAN_LOAI}" → không tìm thấy mã`);
        if (!maDongHang) errs.push(`DONG_HANG="${doc.DONG_HANG}" → không tìm thấy mã`);

        if (errs.length > 0) {
            const msg = `❌ MA_HH=${maHH}: ${errs.join('; ')}`;
            console.log(`   ${msg}`);
            errorDetails.push(msg);
            errors++;
            continue;
        }

        // Validate: MA_DONG_HANG phải thuộc đúng MA_PHAN_LOAI
        const dhInfo = dongHangList.find(d => d.MA_DONG_HANG === maDongHang);
        if (dhInfo && maPhanLoai && dhInfo.MA_PHAN_LOAI !== maPhanLoai) {
            console.log(`   ⚠️  MA_HH=${maHH}: DONG_HANG="${maDongHang}" thuộc PL="${dhInfo.MA_PHAN_LOAI}" ≠ PL được chỉ định "${maPhanLoai}" → dùng PL từ DONG_HANG`);
            maPhanLoai = dhInfo.MA_PHAN_LOAI;
        }

        // Update
        const setFields: Record<string, any> = {
            MA_PHAN_LOAI: maPhanLoai,
            MA_DONG_HANG: maDongHang,
        };

        const unsetFields: Record<string, string> = {};
        if (doc.PHAN_LOAI !== undefined) unsetFields['PHAN_LOAI'] = '';
        if (doc.DONG_HANG !== undefined) unsetFields['DONG_HANG'] = '';

        const updateOp: any = { $set: setFields };
        if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

        await prisma.$runCommandRaw({
            update: 'DMHH',
            updates: [{ q: { _id: doc._id }, u: updateOp }]
        });

        console.log(`   ✅ MA_HH=${maHH}: "${doc.PHAN_LOAI}"→"${maPhanLoai}" | "${doc.DONG_HANG}"→"${maDongHang}"`);
        updated++;
    }

    console.log('\n' + '═'.repeat(55));
    console.log('🎉 MIGRATE DMHH HOÀN TẤT!');
    console.log('═'.repeat(55));
    console.log(`   ✅ Đã migrate:  ${updated}`);
    console.log(`   ⏭️  Đã skip:     ${skipped}`);
    console.log(`   ❌ Lỗi:         ${errors}`);

    if (errors > 0) {
        console.log('\n⚠️  Các bản ghi lỗi:');
        errorDetails.forEach(e => console.log(`   ${e}`));
        console.log('\n💡 Kiểm tra lại tên PHAN_LOAI/DONG_HANG trong DB có khớp với bảng PHANLOAI_HH/DONG_HH không.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
