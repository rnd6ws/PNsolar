/**
 * Script migrate GIA_BAN: Chuyển đổi dữ liệu cũ sang cấu trúc relation mới
 *
 * DỮ LIỆU CŨ:
 *   NHOM_HH  : string (tên nhóm, VD: "Tấm pin")
 *   GOI_GIA  : string (tên gói giá, VD: "Giá sỉ")
 *   MA_HH    : string (mã hàng hóa)
 *   TEN_HH   : string (tên hàng hóa - sẽ bị xóa)
 *
 * DỮ LIỆU MỚI (sau migrate):
 *   MA_NHOM_HH   : string (mã nhóm - lookup từ NHOM_HH.TEN_NHOM)
 *   MA_PHAN_LOAI : string (mã phân loại - lookup từ DMHH.PHAN_LOAI)
 *   MA_DONG_HANG : string (mã dòng hàng - lookup từ DMHH.DONG_HANG)
 *   MA_GOI_GIA   : string (mã gói giá - lookup từ GOI_GIA.GOI_GIA)
 *   MA_HH        : string (giữ nguyên)
 *
 * CHẠY: npx ts-node --project tsconfig.scripts.json scripts/migrate-gia-ban.ts
 *   hoặc: npx tsx scripts/migrate-gia-ban.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu migrate GIA_BAN sang cấu trúc relation mới...\n');

    // ─── 1. Load lookup tables ──────────────────────────────────────────────

    // Nhóm HH: Map TEN_NHOM → MA_NHOM
    const nhomHHList = await prisma.nHOM_HH.findMany({
        select: { MA_NHOM: true, TEN_NHOM: true }
    });
    const tenNhomToMa = new Map(nhomHHList.map(n => [n.TEN_NHOM.trim(), n.MA_NHOM]));
    console.log(`📋 Nhóm HH: ${nhomHHList.length} bản ghi`);
    nhomHHList.forEach(n => console.log(`   "${n.TEN_NHOM}" → "${n.MA_NHOM}"`));

    // Gói giá: Map tên GOI_GIA → ID_GOI_GIA
    const goiGiaList = await prisma.gOI_GIA.findMany({
        select: { ID_GOI_GIA: true, GOI_GIA: true, MA_DONG_HANG: true }
    });
    const tenGoiGiaToId = new Map(goiGiaList.map(g => [g.GOI_GIA.trim(), g.ID_GOI_GIA]));
    console.log(`\n📋 Gói giá: ${goiGiaList.length} bản ghi`);
    goiGiaList.forEach(g => console.log(`   "${g.GOI_GIA}" → "${g.ID_GOI_GIA}"`));

    // Hàng hóa: Lấy raw (DMHH đã dùng MA_PHAN_LOAI/MA_DONG_HANG, dùng raw query để lấy field cũ nếu có)
    const hhRaw = await prisma.$runCommandRaw({ find: 'DMHH', filter: {} }) as any;
    const hhListRaw = hhRaw.cursor?.firstBatch || [];
    const hhMap = new Map(hhListRaw.map((h: any) => [h.MA_HH, h]));
    console.log(`\n📋 Hàng hóa: ${hhListRaw.length} bản ghi`);

    // Phân loại: Map tên TEN_PHAN_LOAI → MA_PHAN_LOAI
    const phanLoaiList = await prisma.pHANLOAI_HH.findMany({
        select: { MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true }
    });
    const tenPhanLoaiToMa = new Map(phanLoaiList.map(p => [p.TEN_PHAN_LOAI.trim(), p.MA_PHAN_LOAI]));

    // Dòng hàng: Map tên TEN_DONG_HANG → MA_DONG_HANG
    const dongHangList = await prisma.dONG_HH.findMany({
        select: { MA_DONG_HANG: true, TEN_DONG_HANG: true, MA_PHAN_LOAI: true }
    });
    const tenDongHangToMa = new Map(dongHangList.map(d => [d.TEN_DONG_HANG.trim(), d.MA_DONG_HANG]));


    // ─── 2. Lấy tất cả GIA_BAN cũ qua raw query ────────────────────────────
    console.log('\n\n🔍 Đang đọc dữ liệu GIA_BAN cũ...');

    const rawResult = await prisma.$runCommandRaw({
        find: 'GIA_BAN',
        filter: {},
    }) as any;

    const documents = rawResult.cursor?.firstBatch || [];
    console.log(`📦 Tìm thấy ${documents.length} bản ghi GIA_BAN cần migrate\n`);

    // ─── 3. Migrate từng bản ghi ────────────────────────────────────────────
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const doc of documents) {
        const docId = doc._id?.$oid || doc._id;
        const maHH = doc.MA_HH || '';

        // ── Kiểm tra đã migrate chưa ──────────────────────
        if (doc.MA_NHOM_HH && doc.MA_PHAN_LOAI && doc.MA_DONG_HANG && doc.MA_GOI_GIA) {
            // Đã có đầy đủ field mới → skip
            skipLog(`Đã migrate rồi (MA_HH: ${maHH})`);
            skipped++;
            continue;
        }

        // ── Resolve MA_NHOM_HH ────────────────────────────
        let maNhomHH: string | null = null;

        if (doc.MA_NHOM_HH) {
            // Đã có rồi
            maNhomHH = doc.MA_NHOM_HH;
        } else if (doc.NHOM_HH) {
            // Lookup từ tên nhóm
            maNhomHH = tenNhomToMa.get(doc.NHOM_HH.trim()) || null;
            if (!maNhomHH) {
                // Thử tìm kiếm case-insensitive
                for (const [ten, ma] of tenNhomToMa) {
                    if (ten.toLowerCase() === doc.NHOM_HH.toLowerCase()) {
                        maNhomHH = ma;
                        break;
                    }
                }
            }
        }

        // ── Resolve MA_HH → lấy PHAN_LOAI + DONG_HANG ───
        const hhInfo = hhMap.get(maHH) as any;

        let maPhanLoai: string | null = doc.MA_PHAN_LOAI || null;
        let maDongHang: string | null = doc.MA_DONG_HANG || null;

        if (!maPhanLoai && hhInfo) {
            // Lookup từ tên PHAN_LOAI trong DMHH
            maPhanLoai = tenPhanLoaiToMa.get(hhInfo.PHAN_LOAI?.trim() || '') || null;
            if (!maPhanLoai) {
                // Thử tìm kiếm case-insensitive
                for (const [ten, ma] of tenPhanLoaiToMa) {
                    if (ten.toLowerCase() === (hhInfo.PHAN_LOAI || '').toLowerCase()) {
                        maPhanLoai = ma;
                        break;
                    }
                }
            }
        }

        if (!maDongHang && hhInfo) {
            // Lookup từ tên DONG_HANG trong DMHH
            maDongHang = tenDongHangToMa.get(hhInfo.DONG_HANG?.trim() || '') || null;
            if (!maDongHang) {
                // Thử tìm kiếm case-insensitive
                for (const [ten, ma] of tenDongHangToMa) {
                    if (ten.toLowerCase() === (hhInfo.DONG_HANG || '').toLowerCase()) {
                        maDongHang = ma;
                        break;
                    }
                }
            }
        }

        // ── Resolve MA_GOI_GIA ────────────────────────────
        let maGoiGia: string | null = doc.MA_GOI_GIA || null;

        if (!maGoiGia && doc.GOI_GIA) {
            maGoiGia = tenGoiGiaToId.get(doc.GOI_GIA.trim()) || null;
            if (!maGoiGia) {
                // Thử tìm kiếm case-insensitive
                for (const [ten, id] of tenGoiGiaToId) {
                    if (ten.toLowerCase() === doc.GOI_GIA.toLowerCase()) {
                        maGoiGia = id;
                        break;
                    }
                }
            }
        }

        // ── Validate ──────────────────────────────────────
        const errs: string[] = [];
        if (!maNhomHH) errs.push(`NHOM_HH="${doc.NHOM_HH}" → không tìm thấy MA_NHOM_HH`);
        if (!maPhanLoai) errs.push(`PHAN_LOAI="${hhInfo?.PHAN_LOAI}" → không tìm thấy MA_PHAN_LOAI`);
        if (!maDongHang) errs.push(`DONG_HANG="${hhInfo?.DONG_HANG}" → không tìm thấy MA_DONG_HANG`);
        if (!maGoiGia) errs.push(`GOI_GIA="${doc.GOI_GIA}" → không tìm thấy MA_GOI_GIA`);
        if (!maHH) errs.push('MA_HH trống');

        if (errs.length > 0) {
            const msg = `❌ MA_HH=${maHH || '?'}: ${errs.join('; ')}`;
            console.log(`   ${msg}`);
            errorDetails.push(msg);
            errors++;
            continue;
        }

        // ── Update document ───────────────────────────────
        const setFields: Record<string, any> = {
            MA_NHOM_HH: maNhomHH,
            MA_PHAN_LOAI: maPhanLoai,
            MA_DONG_HANG: maDongHang,
            MA_GOI_GIA: maGoiGia,
        };

        const unsetFields: Record<string, string> = {};
        // Xóa các field cũ nếu tồn tại
        if (doc.NHOM_HH !== undefined) unsetFields['NHOM_HH'] = '';
        if (doc.GOI_GIA !== undefined) unsetFields['GOI_GIA'] = '';
        if (doc.TEN_HH !== undefined) unsetFields['TEN_HH'] = '';

        const updateOp: any = { $set: setFields };
        if (Object.keys(unsetFields).length > 0) {
            updateOp.$unset = unsetFields;
        }

        await prisma.$runCommandRaw({
            update: 'GIA_BAN',
            updates: [{
                q: { _id: doc._id },
                u: updateOp,
            }]
        });

        console.log(`   ✅ MA_HH=${maHH}: NHOM="${doc.NHOM_HH}"→"${maNhomHH}" | PL→"${maPhanLoai}" | DH→"${maDongHang}" | GG="${doc.GOI_GIA}"→"${maGoiGia}"`);
        updated++;
    }

    // ─── 4. Tổng kết ────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRATE HOÀN TẤT!');
    console.log('═'.repeat(60));
    console.log(`   ✅ Đã migrate:  ${updated}`);
    console.log(`   ⏭️  Đã skip:     ${skipped}`);
    console.log(`   ❌ Lỗi:         ${errors}`);

    if (errors > 0) {
        console.log('\n⚠️  Các bản ghi lỗi (cần xử lý thủ công):');
        errorDetails.forEach(e => console.log(`   ${e}`));
        console.log('\n💡 Gợi ý: Kiểm tra lại tên NHOM_HH/GOI_GIA trong DB có khớp với bảng gốc không.');
    }

    if (updated > 0) {
        console.log('\n📌 Bước tiếp theo: Kiểm tra dữ liệu đã migrate trên trang /gia-ban');
    }
}

function skipLog(msg: string) {
    // Comment out dòng này nếu không muốn log skip
    // console.log(`   ⏭️  ${msg}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
