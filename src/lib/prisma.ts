// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Prisma configuration with logging
const clientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
} as any;

export const prisma = globalForPrisma.prisma || new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type ExtendedPrismaClient = typeof prisma;
