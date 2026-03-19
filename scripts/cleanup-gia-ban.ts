/**
 * Script cleanup: Xóa các field rác cũ khỏi collection GIA_BAN
 * 
 * Field cần xóa:
 *   - NHOM_KH   : field cũ từ phiên bản cũ (nhóm khách hàng)
 *   - NHOM_HH   : field text cũ (đã thay bằng MA_NHOM_HH + @relation)
 *   - GOI_GIA   : field text cũ (đã thay bằng MA_GOI_GIA + @relation)
 *   - TEN_HH    : field text cũ (nay lấy từ DMHH qua @relation)
 *
 * CHẠY: npx tsx scripts/cleanup-gia-ban.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Bắt đầu cleanup GIA_BAN: xóa các field rác cũ...\n');

    // Lấy tất cả documents
    const rawResult = await prisma.$runCommandRaw({
        find: 'GIA_BAN',
        filter: {},
    }) as any;

    const documents = rawResult.cursor?.firstBatch || [];
    console.log(`📦 Tìm thấy ${documents.length} bản ghi GIA_BAN\n`);

    let cleaned = 0;
    let alreadyClean = 0;

    for (const doc of documents) {
        const maHH = doc.MA_HH || '?';

        // Kiểm tra có field rác không
        const hasNhomKH  = doc.NHOM_KH !== undefined;
        const hasNhomHH  = doc.NHOM_HH !== undefined;
        const hasGoiGia  = doc.GOI_GIA !== undefined;
        const hasTenHH   = doc.TEN_HH  !== undefined;

        const hasStaleFields = hasNhomKH || hasNhomHH || hasGoiGia || hasTenHH;

        if (!hasStaleFields) {
            alreadyClean++;
            continue;
        }

        // Xây dựng $unset chỉ với field thực sự tồn tại
        const unsetFields: Record<string, string> = {};
        if (hasNhomKH)  unsetFields['NHOM_KH']  = '';
        if (hasNhomHH)  unsetFields['NHOM_HH']  = '';
        if (hasGoiGia)  unsetFields['GOI_GIA']  = '';
        if (hasTenHH)   unsetFields['TEN_HH']   = '';

        const fieldNames = Object.keys(unsetFields).join(', ');
        console.log(`   🗑️  MA_HH=${maHH}: xóa [${fieldNames}]`);

        await prisma.$runCommandRaw({
            update: 'GIA_BAN',
            updates: [{
                q: { _id: doc._id },
                u: { $unset: unsetFields }
            }]
        });

        cleaned++;
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ CLEANUP HOÀN TẤT!');
    console.log('═'.repeat(50));
    console.log(`   🗑️  Đã xóa field rác:  ${cleaned} bản ghi`);
    console.log(`   ✨ Đã sạch sẵn:        ${alreadyClean} bản ghi`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
