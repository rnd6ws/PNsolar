import { cookies } from 'next/headers';

/**
 * Đọc số dòng mỗi trang từ:
 * 1. URL searchParams (pageSize) - ưu tiên cao nhất
 * 2. Cookie pnsolar-rows-per-page (từ ThemeProvider) - fallback
 * 3. Default value
 */
export async function getRowsPerPage(paramPageSize?: string, defaultValue = 10): Promise<number> {
    // Nếu có pageSize trong URL, ưu tiên dùng nó
    if (paramPageSize) {
        const val = Number(paramPageSize);
        if ([10, 20, 50, 100].includes(val)) return val;
    }

    // Đọc từ cookie (set bởi ThemeProvider)
    try {
        const cookieStore = await cookies();
        const cookieVal = cookieStore.get('pnsolar-rows-per-page')?.value;
        if (cookieVal) {
            const val = Number(cookieVal);
            if ([10, 20, 50, 100].includes(val)) return val;
        }
    } catch {
        // Ignore cookie read errors
    }

    return defaultValue;
}
