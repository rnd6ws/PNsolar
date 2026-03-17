import { prisma } from '../src/lib/prisma';

async function test() {
    const all = await prisma.dSNV.findMany();

    console.log('--- DB SUMMARY ---');
    console.log('Total records:', all.length);
    if (all.length > 0) {
        console.log('First record:', all[0]);
    }
}

test().catch(console.error);
