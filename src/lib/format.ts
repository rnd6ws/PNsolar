/**
 * Định dạng tiền tệ chuẩn VND cho toàn bộ app.
 * Output: "80.000.000 ₫"
 */
const vndFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

export function formatCurrency(val: number | null | undefined): string {
    return vndFormatter.format(val ?? 0);
}
