import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const raw = await prisma.$runCommandRaw({ find: 'GIA_NHAP', filter: {} }) as any;
    const docs = raw.cursor?.firstBatch || [];
    console.log('Records GIA_NHAP:');
    for (const doc of docs) {
        console.log(`MA_HH=${doc.MA_HH} | MA_NCC=${doc.MA_NCC} | MA_DONG_HANG=${doc.MA_DONG_HANG || 'MISSING'} | MA_GOI_GIA=${doc.MA_GOI_GIA || 'MISSING'}`);
    }

    // Check DMHH lookup
    const allDMHH = await prisma.dMHH.findMany({ select: { MA_HH: true, MA_PHAN_LOAI: true, MA_DONG_HANG: true } });
    console.log('\nDMHH entries:');
    for (const h of allDMHH) {
        console.log(`  MA_HH=${h.MA_HH} | MA_PL=${h.MA_PHAN_LOAI} | MA_DH=${h.MA_DONG_HANG}`);
    }

    // Check GOI_GIA
    const allGG = await prisma.gOI_GIA.findMany({ select: { ID_GOI_GIA: true, MA_DONG_HANG: true, HIEU_LUC: true } });
    console.log('\nGOI_GIA entries:');
    for (const g of allGG) {
        console.log(`  ID=${g.ID_GOI_GIA} | DH=${g.MA_DONG_HANG} | HL=${g.HIEU_LUC}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
