import { prisma } from '../src/lib/prisma';

const OLD = 'rnd6pnsolar';
const NEW = 'rnd6';

function replaceUrl(url: string | null) {
    if (!url) return url;
    return url.replace(`res.cloudinary.com/${OLD}/`, `res.cloudinary.com/${NEW}/`);
}

async function migrate() {
    let total = 0;

    // 1. KHAO_SAT - HINH_ANH array of { URL_HINH, STT, TEN_HINH }
    const khaoSats = await prisma.kHAO_SAT.findMany({
        where: { HINH_ANH: { isEmpty: false } },
        select: { ID: true, HINH_ANH: true },
    });
    let ksCount = 0;
    for (const ks of khaoSats) {
        if (!ks.HINH_ANH || !Array.isArray(ks.HINH_ANH)) continue;
        const updated = ks.HINH_ANH.map(h => ({
            ...h,
            URL_HINH: h.URL_HINH && h.URL_HINH.includes(OLD) ? replaceUrl(h.URL_HINH) as string : h.URL_HINH,
        }));
        const changed = updated.some((h, i) => h.URL_HINH !== ks.HINH_ANH[i]?.URL_HINH);
        if (changed) {
            await prisma.kHAO_SAT.update({ where: { ID: ks.ID }, data: { HINH_ANH: updated } });
            ksCount++;
            total++;
        }
    }
    console.log(`KHAO_SAT updated: ${ksCount}`);

    // Helper for simple String fields
    async function migrateStringField(model: any, field: string, modelName: string) {
        const records = await model.findMany({
            where: { [field]: { contains: OLD } },
            select: { ID: true, [field]: true },
        });
        let count = 0;
        for (const record of records) {
            if (record[field] && typeof record[field] === 'string') {
                await model.update({
                    where: { ID: record.ID },
                    data: { [field]: replaceUrl(record[field]) },
                });
                count++;
                total++;
            }
        }
        console.log(`${modelName} updated: ${count}`);
    }

    await migrateStringField(prisma.tHANH_TOAN, 'HINH_ANH', 'THANH_TOAN');
    await migrateStringField(prisma.nCC, 'HINH_ANH', 'NCC');
    await migrateStringField(prisma.dMHH, 'HINH_ANH', 'DMHH');
    await migrateStringField(prisma.dSNV, 'HINH_CA_NHAN', 'DSNV');
    await migrateStringField(prisma.kHTN, 'HINH_ANH', 'KHTN');
    await migrateStringField(prisma.kEHOACH_CSKH, 'HINH_ANH', 'KEHOACH_CSKH (HINH_ANH)');
    await migrateStringField(prisma.kEHOACH_CSKH, 'FILE', 'KEHOACH_CSKH (FILE)');

    // BAO_GIA - TEP_DINH_KEM (String[])
    const allBaogias = await prisma.bAO_GIA.findMany({
        where: { NOT: { TEP_DINH_KEM: { isEmpty: true } } },
        select: { ID: true, TEP_DINH_KEM: true },
    });
    let bgCount = 0;
    for (const bg of allBaogias) {
        if (!bg.TEP_DINH_KEM || !Array.isArray(bg.TEP_DINH_KEM)) continue;
        const updated = bg.TEP_DINH_KEM.map(u => typeof u === 'string' && u.includes(OLD) ? replaceUrl(u) as string : u);
        const changed = updated.some((u, i) => u !== bg.TEP_DINH_KEM[i]);
        if (changed) {
            await prisma.bAO_GIA.update({ where: { ID: bg.ID }, data: { TEP_DINH_KEM: updated } });
            bgCount++;
            total++;
        }
    }
    console.log(`BAO_GIA updated: ${bgCount}`);

    // Helper for JSON array of strings
    async function migrateJsonArrayField(model: any, field: string, modelName: string) {
        const records = await model.findMany({
            where: { NOT: { [field]: null } },
            select: { ID: true, [field]: true },
        });
        let count = 0;
        for (const record of records) {
            let dataArr: any = record[field];
            if (typeof dataArr === 'string') {
                try { dataArr = JSON.parse(dataArr); } catch(e) {}
            }
            if (Array.isArray(dataArr)) {
                let changed = false;
                const updated = dataArr.map((item: any) => {
                    if (typeof item === 'string' && item.includes(OLD)) {
                        changed = true;
                        return replaceUrl(item);
                    }
                    return item;
                });
                if (changed) {
                    await model.update({ where: { ID: record.ID }, data: { [field]: updated } });
                    count++;
                    total++;
                }
            }
        }
        console.log(`${modelName} updated: ${count}`);
    }

    await migrateJsonArrayField(prisma.hOP_DONG, 'TEP_DINH_KEM', 'HOP_DONG');
    await migrateJsonArrayField(prisma.bAN_GIAO_HD, 'FILE_DINH_KEM', 'BAN_GIAO_HD');

    console.log(`\nTổng records đã update: ${total}`);
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());