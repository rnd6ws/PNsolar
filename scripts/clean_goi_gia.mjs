import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Xóa trường MA_GOI_GIA khỏi tất cả documents trong collection GIA_NHAP
    const result = await prisma.$runCommandRaw({
        update: 'GIA_NHAP',
        updates: [
            {
                q: {},
                u: { $unset: { MA_GOI_GIA: '' } },
                multi: true,
            },
        ],
    });
    console.log('Kết quả:', JSON.stringify(result, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
