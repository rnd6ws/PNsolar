import { prisma } from '../src/lib/prisma';

async function test() {
    const all = await prisma.dSNV.findMany();
    const withNull = await prisma.dSNV.findMany({ where: { DELETED_AT: null } });

    console.log('--- DB SUMMARY ---');
    console.log('Total records:', all.length);
    console.log('Records with DELETED_AT=null:', withNull.length);
    if (all.length > 0) {
        console.log('First record DELETED_AT value:', all[0].DELETED_AT);
        console.log('First record DELETED_AT type:', typeof all[0].DELETED_AT);
    }
}

test().catch(console.error);
