import { prisma } from '../src/lib/prisma';
import { getEmployees } from '../src/services/nhan-vien.service';

async function test() {
    const all = await prisma.dSNV.findMany();
    console.log('All Users count:', all.length);

    const filtered = await prisma.dSNV.findMany({
        where: { deletedAt: null }
    });
    console.log('Users with deletedAt: null count:', filtered.length);

    const service = await getEmployees();
    console.log('Service returned count:', service.data?.length);
}

test()
    .catch(console.error)
    .finally(() => (prisma as any).$disconnect?.());
