/**
 * Script migrate: Đổi PHAN_LOAI_ID (ObjectId) => MA_PHAN_LOAI (String) trong collection DONG_HH
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Bắt đầu migrate DONG_HH: PHAN_LOAI_ID → MA_PHAN_LOAI...\n');

    // 1. Lấy tất cả phân loại để map ID → MA_PHAN_LOAI
    const phanLoais = await prisma.pHANLOAI_HH.findMany({
        select: { ID: true, MA_PHAN_LOAI: true, TEN_PHAN_LOAI: true }
    });

    console.log(`📋 Tìm thấy ${phanLoais.length} phân loại:`);
    phanLoais.forEach(pl => console.log(`   ${pl.ID} → ${pl.MA_PHAN_LOAI} (${pl.TEN_PHAN_LOAI})`));

    const idToMaPhanLoai = new Map(phanLoais.map(pl => [pl.ID, pl.MA_PHAN_LOAI]));

    // 2. Lấy tất cả dòng hàng - dùng raw query vì schema đã đổi
    const dongHHs = await prisma.$runCommandRaw({
        find: 'DONG_HH',
        filter: {},
    }) as any;

    const documents = dongHHs.cursor?.firstBatch || [];
    console.log(`\n📦 Tìm thấy ${documents.length} dòng hàng cần migrate:\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of documents) {
        // Xử lý PHAN_LOAI_ID - có thể là string hoặc ObjectId ({$oid: "..."})
        let oldId: string | undefined;
        if (doc.PHAN_LOAI_ID) {
            if (typeof doc.PHAN_LOAI_ID === 'string') {
                oldId = doc.PHAN_LOAI_ID;
            } else if (doc.PHAN_LOAI_ID.$oid) {
                oldId = doc.PHAN_LOAI_ID.$oid;
            }
        }

        const existingMaPL = doc.MA_PHAN_LOAI;
        const maDongHang = doc.MA_DONG_HANG || 'UNKNOWN';

        // Nếu đã có MA_PHAN_LOAI rồi thì skip
        if (existingMaPL && !oldId) {
            console.log(`   ⏭️  ${maDongHang}: Đã có MA_PHAN_LOAI = "${existingMaPL}", skip.`);
            skipped++;
            continue;
        }

        if (!oldId) {
            console.log(`   ❌ ${maDongHang}: Không tìm thấy PHAN_LOAI_ID! (raw: ${JSON.stringify(doc.PHAN_LOAI_ID)})`);
            errors++;
            continue;
        }

        const maPhanLoai = idToMaPhanLoai.get(oldId);
        if (!maPhanLoai) {
            console.log(`   ❌ ${maDongHang}: PHAN_LOAI_ID = "${oldId}" không khớp phân loại nào!`);
            errors++;
            continue;
        }

        // Update: thêm MA_PHAN_LOAI, xóa PHAN_LOAI_ID
        await prisma.$runCommandRaw({
            update: 'DONG_HH',
            updates: [{
                q: { _id: doc._id },
                u: {
                    $set: { MA_PHAN_LOAI: maPhanLoai },
                    $unset: { PHAN_LOAI_ID: '' }
                }
            }]
        });

        console.log(`   ✅ ${maDongHang}: ${oldId} → "${maPhanLoai}"`);
        updated++;
    }

    console.log(`\n🎉 Hoàn tất!`);
    console.log(`   ✅ Đã migrate: ${updated}`);
    console.log(`   ⏭️  Đã skip: ${skipped}`);
    console.log(`   ❌ Lỗi: ${errors}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
