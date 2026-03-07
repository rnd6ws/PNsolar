import { prisma } from '../src/lib/prisma';

async function fix() {
    console.log('Updating all users to have deletedAt: null Explicitly...');
    const result = await (prisma as any).dSNV.updateMany({
        where: {
            deletedAt: { not: null } // This might not work if it's missing
        },
        data: {
            deletedAt: null
        }
    });
    console.log('Update result:', result);

    // Fallback: update everyone
    const all = await prisma.dSNV.updateMany({
        data: {
            deletedAt: null
        }
    });
    console.log('Forced update all result:', all);
}

fix().catch(console.error);
