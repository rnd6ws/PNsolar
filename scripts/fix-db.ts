import { prisma } from '../src/lib/prisma';

async function fix() {
    console.log('Checking all DSNV records...');
    const all = await prisma.dSNV.findMany();
    console.log('Total records:', all.length);
}

fix().catch(console.error);
