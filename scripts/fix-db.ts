import { prisma } from '../src/lib/prisma';

async function fix() {
    console.log('Updating all users to have DELETED_AT: null Explicitly...');
    const result = await (prisma as any).dSNV.updateMany({
        where: {
            DELETED_AT: { not: null } // This might not work if it's missing
        },
        data: {
            DELETED_AT: null
        }
    });
    console.log('Update result:', result);

    // Fallback: update everyone
    const all = await prisma.dSNV.updateMany({
        data: {
            DELETED_AT: null
        }
    });
    console.log('Forced update all result:', all);
}

fix().catch(console.error);
