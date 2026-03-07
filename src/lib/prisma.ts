// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Prisma configuration with logging
const clientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
} as any;

const basePrisma = globalForPrisma.prisma || new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

// ===== Soft Delete Extension =====
export const prisma = basePrisma.$extends({
    name: 'softDelete',
    query: {
        dSNV: {
            async delete({ args, query }) {
                return (basePrisma as any).dSNV.update({
                    ...args,
                    data: { deletedAt: new Date() },
                });
            },
            async deleteMany({ args, query }) {
                return (basePrisma as any).dSNV.updateMany({
                    ...args,
                    data: { deletedAt: new Date() },
                });
            },
        },
        dMHH: {
            async delete({ args, query }) {
                return (basePrisma as any).dMHH.update({
                    ...args,
                    data: { deletedAt: new Date() },
                });
            },
            async deleteMany({ args, query }) {
                return (basePrisma as any).dMHH.updateMany({
                    ...args,
                    data: { deletedAt: new Date() },
                });
            },
        },
    },
});

export type ExtendedPrismaClient = typeof prisma;
