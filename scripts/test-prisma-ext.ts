import { prisma } from '../src/lib/prisma';

async function test() {
    console.log('Fetching all DSNV via extended prisma...');
    const users = await prisma.dSNV.findMany();
    console.log('Total:', users.length);
    console.log('Users:', JSON.stringify(users, null, 2));
}

test()
    .catch(console.error)
    .finally(() => (prisma as any).$disconnect?.());
