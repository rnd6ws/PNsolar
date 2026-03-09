import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// In Prisma 7, the constructor options have changed.
// DATABASE_URL is automatically read from the environment or prisma.config.ts
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
        const admin = await prisma.dSNV.upsert({
            where: { USER_NAME: 'admin' },
            update: {},
            create: {
                MA_NV: 'NV001',
                USER_NAME: 'admin',
                PASSWORD: hashedPassword,
                HO_TEN: 'Quản trị viên',
                CHUC_VU: 'QUẢN TRỊ',
                ROLE: 'ADMIN',
                IS_ACTIVE: true,
                DELETED_AT: null,
            },
        });

        console.log('Seed success:', admin.USER_NAME);
    } catch (error) {
        console.error('Seed execution error:', error);
    }
}

main()
    .catch((e) => {
        console.error('Application error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
