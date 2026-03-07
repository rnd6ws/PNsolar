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
            where: { username: 'admin' },
            update: {},
            create: {
                ma_nv: 'NV001',
                username: 'admin',
                password: hashedPassword,
                ho_ten: 'Quản trị viên',
                chuc_vu: 'QUẢN TRỊ',
                role: 'ADMIN',
                isActive: true,
                deletedAt: null,
            },
        });

        console.log('Seed success:', admin.username);
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
