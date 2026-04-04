/**
 * Follow redirect của link rút gọn Google Maps.
 * Phải chạy phía server (API Route / Server Action) vì browser bị CORS.
 */
export async function resolveShortUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PNsolarRND6/1.0)' },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return res.url;
    } catch {
        clearTimeout(timeout);
        return url; // fallback: trả nguyên link nếu resolve thất bại
    }
}
