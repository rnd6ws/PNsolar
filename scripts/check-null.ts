import { prisma } from '../src/lib/prisma';

async function test() {
    const all = await prisma.dSNV.findMany();
    const withNull = await prisma.dSNV.findMany({ where: { deletedAt: null } });

    console.log('--- DB SUMMARY ---');
    console.log('Total records:', all.length);
    console.log('Records with deletedAt=null:', withNull.length);
    if (all.length > 0) {
        console.log('First record deletedAt value:', all[0].deletedAt);
        console.log('First record deletedAt type:', typeof all[0].deletedAt);
    }
}

test().catch(console.error);
