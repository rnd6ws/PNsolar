"use client";

import { Activity, AlertTriangle, TrendingUp, TrendingDown, Users, Zap, BarChart2, Star } from "lucide-react";

interface KetLuanProps {
    stats: {
        totalContracts: number;
        totalRevenue: number;
        totalCollected: number;
        remainingAmount: number;
    };
    chartData: { label: string; revenue: number }[];
    customerChartData: { label: string; count: number }[];
    marketingChartData: { name: string; value: number }[];
    productChartData: { name: string; revenue: number }[];
    conversionChartData: { label: string; dataCount: number; hdCount: number; rate: number }[];
    cskhVsDoanhSoChartData: { label: string; meetings: number; revenue: number }[];
    salesList: { label: string; value: string }[];
}

function formatCurrency(val: number) {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
    if (val >= 1_000_000) return `${Math.round(val / 1_000_000).toLocaleString("vi-VN")} triệu`;
    return `${Math.round(val / 1_000).toLocaleString("vi-VN")} nghìn`;
}

function formatCurrencyFull(val: number) {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
}

type InsightItem = {
    id: string;
    icon: React.ElementType;
    color: "indigo" | "emerald" | "red" | "amber" | "purple" | "blue";
    title: string;
    content: React.ReactNode;
};

const COLOR_STYLES: Record<
    string,
    { bg: string; border: string; iconBg: string; iconColor: string; dot: string; titleColor: string; textColor: string }
> = {
    indigo: {
        bg: "rgba(99,102,241,0.05)",
        border: "rgba(99,102,241,0.2)",
        iconBg: "rgba(99,102,241,0.12)",
        iconColor: "#6366f1",
        dot: "#6366f1",
        titleColor: "#6366f1",
        textColor: "var(--foreground)",
    },
    emerald: {
        bg: "rgba(16,185,129,0.05)",
        border: "rgba(16,185,129,0.2)",
        iconBg: "rgba(16,185,129,0.12)",
        iconColor: "#10b981",
        dot: "#10b981",
        titleColor: "#10b981",
        textColor: "var(--foreground)",
    },
    red: {
        bg: "rgba(239,68,68,0.05)",
        border: "rgba(239,68,68,0.2)",
        iconBg: "rgba(239,68,68,0.12)",
        iconColor: "#ef4444",
        dot: "#ef4444",
        titleColor: "#ef4444",
        textColor: "var(--foreground)",
    },
    amber: {
        bg: "rgba(245,158,11,0.05)",
        border: "rgba(245,158,11,0.2)",
        iconBg: "rgba(245,158,11,0.12)",
        iconColor: "#f59e0b",
        dot: "#f59e0b",
        titleColor: "#d97706",
        textColor: "var(--foreground)",
    },
    purple: {
        bg: "rgba(139,92,246,0.05)",
        border: "rgba(139,92,246,0.2)",
        iconBg: "rgba(139,92,246,0.12)",
        iconColor: "#8b5cf6",
        dot: "#8b5cf6",
        titleColor: "#8b5cf6",
        textColor: "var(--foreground)",
    },
    blue: {
        bg: "rgba(59,130,246,0.05)",
        border: "rgba(59,130,246,0.2)",
        iconBg: "rgba(59,130,246,0.12)",
        iconColor: "#3b82f6",
        dot: "#3b82f6",
        titleColor: "#3b82f6",
        textColor: "var(--foreground)",
    },
};

export default function KetLuanSection({
    stats,
    chartData,
    customerChartData,
    marketingChartData,
    productChartData,
    conversionChartData,
    cskhVsDoanhSoChartData,
    salesList,
}: KetLuanProps) {

    // ── 1. Sales mạnh nhất (doanh thu theo SALES đại diện trong conversionChartData tích luỹ)
    // Dùng cskhVsDoanhSo để tìm tuần nhiều cuộc gặp nhất
    const sortedMeetingWeeks = [...cskhVsDoanhSoChartData].sort((a, b) => b.meetings - a.meetings);
    const topMeetingWeek = sortedMeetingWeeks[0];
    const topMeetingWeekRevenue = topMeetingWeek?.revenue ?? 0;

    // ── 2. Kênh marketing đóng góp nhiều nhất
    const topMarketing = marketingChartData[0] ?? null;
    const totalMarketingRevenue = marketingChartData.reduce((s, d) => s + d.value, 0);
    const topMarketingPercent = totalMarketingRevenue > 0 && topMarketing
        ? Math.round((topMarketing.value / totalMarketingRevenue) * 100)
        : 0;
    const secondMarketing = marketingChartData[1] ?? null;

    // ── 3. Tuần "đốt" data (data nhiều nhưng chốt ít) → cảnh báo
    const hotDataWeeks = conversionChartData.filter(w => w.dataCount >= 3 && w.rate < 30);

    // ── 4. Tỷ lệ chốt cao nhất
    const sortedConversion = [...conversionChartData].filter(w => w.dataCount > 0 && w.rate > 0).sort((a, b) => b.rate - a.rate);
    const topConversionWeek = sortedConversion.length > 0 ? sortedConversion[0] : null;

    // ── 5. Tuần doanh thu đỉnh
    const sortedRevenue = [...chartData].sort((a, b) => b.revenue - a.revenue);
    const peakWeek = sortedRevenue[0] ?? null;

    // ── 6. Tuần doanh thu thấp nhất (có hợp đồng)
    const nonZeroRevenue = chartData.filter(d => d.revenue > 0);
    const lowestWeek = nonZeroRevenue.length > 0
        ? [...nonZeroRevenue].sort((a, b) => a.revenue - b.revenue)[0]
        : null;

    // ── 7. Sản phẩm dẫn đầu
    const topProduct = productChartData[0] ?? null;
    const totalProductRevenue = productChartData.reduce((s, d) => s + d.revenue, 0);
    const topProductPercent = totalProductRevenue > 0 && topProduct
        ? Math.round((topProduct.revenue / totalProductRevenue) * 100)
        : 0;

    // ── 8. Tỷ lệ thu hồi
    const collectRate = stats.totalRevenue > 0
        ? Math.round((stats.totalCollected / stats.totalRevenue) * 100)
        : 0;

    // ── 9. Trung bình doanh thu/HĐ
    const avgRevPerContract = stats.totalContracts > 0
        ? Math.round(stats.totalRevenue / stats.totalContracts)
        : 0;

    // ── 10. Total data (KHTN)
    const totalData = customerChartData.reduce((s, d) => s + d.count, 0);
    const totalHD = stats.totalContracts;
    const overallConvRate = totalData > 0
        ? Math.round((totalHD / totalData) * 100 * 10) / 10
        : totalHD > 0 ? 100 : 0;

    // ── Build insights list ──────────────────────────────────────────────────
    const insights: InsightItem[] = [];

    // #1 Kênh marketing
    if (topMarketing && topMarketing.value > 0) {
        insights.push({
            id: "marketing",
            icon: TrendingUp,
            color: "emerald",
            title: "Hiệu quả kênh Marketing:",
            content: (
                <span>
                    Nên tập trung vào{" "}
                    <strong style={{ color: "#10b981" }}>{topMarketing.name}</strong>{" "}
                    (đóng góp {topMarketingPercent}% doanh thu
                    {topMarketing.value > 0 && ` — ${formatCurrencyFull(topMarketing.value)}`}).
                    {secondMarketing && secondMarketing.name !== topMarketing.name && (
                        <> Cân nhắc tối ưu lại kênh{" "}
                            <strong>{secondMarketing.name}</strong>{" "}
                            để khai thác thêm.
                        </>
                    )}
                </span>
            ),
        });
    }

    // #2 Cảnh báo "đốt" data
    if (hotDataWeeks.length > 0) {
        insights.push({
            id: "hot-data",
            icon: AlertTriangle,
            color: "red",
            title: "Cảnh báo \"đốt\" Data:",
            content: (
                <span>
                    Cần xem lại các tuần{" "}
                    <strong style={{ color: "#ef4444" }}>
                        {hotDataWeeks.map(w => w.label).join(", ")}
                    </strong>{" "}
                    (nhiều data nhưng chốt thấp).
                </span>
            ),
        });
    }

    // #3 Tuần chuyển đổi cao nhất / Hiệu quả CSKH
    const isValidMeeting = topMeetingWeek && topMeetingWeek.meetings > 0;
    
    if (topConversionWeek || isValidMeeting) {
        insights.push({
            id: "top-conversion",
            icon: Zap,
            color: "purple",
            title: "Hiệu quả chăm sóc khách hàng:",
            content: (
                <span>
                    {topConversionWeek ? (
                        <>
                            Tuần <strong style={{ color: "#8b5cf6" }}>{topConversionWeek.label}</strong> có tỷ lệ chốt cao nhất ({topConversionWeek.rate}%).
                        </>
                    ) : (
                        <>Chưa ghi nhận tuần nào chốt thành công. </>
                    )}
                    {isValidMeeting && (
                        <> Tuần nhiều lịch chăm sóc/tương tác nhất là <strong style={{ color: "#8b5cf6" }}>{topMeetingWeek.label}</strong> ({topMeetingWeek.meetings} lượt{topMeetingWeekRevenue > 0 && `, doanh thu ${formatCurrency(topMeetingWeekRevenue)}`}).</>
                    )}
                </span>
            ),
        });
    } else {
        // Cả rate tỷ lệ chốt đều 0 và không có cuộc gặp nào
        insights.push({
            id: "no-cskh",
            icon: AlertTriangle,
            color: "amber",
            title: "Chăm sóc khách hàng:",
            content: (
                <span>
                    Hiện tại <strong>chưa có dữ liệu chăm sóc khách hàng</strong> hoặc <strong>chưa chốt được hợp đồng (0%)</strong> trong thời gian này. Hệ thống khuyến nghị cần đẩy mạnh tương tác với Khách hàng tiềm năng.
                </span>
            ),
        });
    }

    // #4 Sản phẩm dẫn đầu
    if (topProduct && topProduct.revenue > 0) {
        insights.push({
            id: "top-product",
            icon: BarChart2,
            color: "blue",
            title: "Sản phẩm dẫn đầu:",
            content: (
                <span>
                    <strong style={{ color: "#3b82f6" }}>{topProduct.name}</strong>{" "}
                    chiếm {topProductPercent}% tổng doanh thu sản phẩm
                    {" "}({formatCurrencyFull(topProduct.revenue)}).
                    {productChartData.length > 1 && (
                        <> Các dòng còn lại chiếm {100 - topProductPercent}% — nên xem xét upsell để cân bằng danh mục.</>
                    )}
                </span>
            ),
        });
    }

    // #5 Tỷ lệ thu hồi công nợ
    if (stats.totalRevenue > 0) {
        insights.push({
            id: "collect-rate",
            icon: collectRate >= 80 ? TrendingUp : collectRate >= 50 ? Activity : TrendingDown,
            color: collectRate >= 80 ? "emerald" : collectRate >= 50 ? "amber" : "red",
            title: "Tỷ lệ thu hồi công nợ:",
            content: (
                <span>
                    Đã thu{" "}
                    <strong style={{ color: collectRate >= 80 ? "#10b981" : collectRate >= 50 ? "#f59e0b" : "#ef4444" }}>
                        {collectRate}%
                    </strong>{" "}
                    tổng doanh thu ({formatCurrencyFull(stats.totalCollected)} / {formatCurrencyFull(stats.totalRevenue)}).
                    {stats.remainingAmount > 0 && (
                        <> Còn <strong>{formatCurrencyFull(stats.remainingAmount)}</strong> chưa thu.{" "}
                            {collectRate < 70 && "Cần đẩy mạnh thu hồi công nợ."}
                        </>
                    )}
                </span>
            ),
        });
    }

    // #6 Đánh giá tổng quan
    insights.push({
        id: "overall",
        icon: Star,
        color: "indigo",
        title: "Đánh giá chung:",
        content: (
            <span>
                Tổng{" "}
                <strong style={{ color: "#6366f1" }}>{stats.totalContracts} hợp đồng</strong>{" "}
                — doanh thu{" "}
                <strong style={{ color: "#6366f1" }}>{formatCurrencyFull(stats.totalRevenue)}</strong>.
                {" "}Trung bình mỗi hợp đồng mang về{" "}
                <strong>{formatCurrencyFull(avgRevPerContract)}</strong>.
                {totalData > 0 && (
                    <> Tỷ lệ chuyển đổi tổng thể{" "}
                        <strong>{overallConvRate}%</strong>{" "}
                        ({totalHD}/{totalData} data).
                    </>
                )}
            </span>
        ),
    });

    // ── Render ────────────────────────────────────────────────────────────────
    if (insights.length === 0 && stats.totalContracts === 0 && totalData === 0) {
        return null; // Không có bất kỳ dữ liệu nào để hiển thị kết luận
    }

    // Split into 2 columns
    const left = insights.filter((_, i) => i % 2 === 0);
    const right = insights.filter((_, i) => i % 2 === 1);

    return (
        <div
            style={{
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--card)",
                padding: "20px 24px 24px",
                marginTop: 8,
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Activity size={18} style={{ color: "#6366f1", flexShrink: 0 }} />
                <h2 style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: "var(--foreground)",
                    margin: 0,
                }}>
                    KẾT LUẬN QUẢN TRỊ <span style={{ color: "#6366f1" }}>(TỰ ĐỘNG)</span>
                </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 20, paddingLeft: 26 }}>
                Dựa trên dữ liệu hiện tại, hệ thống đưa ra các nhận định sau:
            </p>

            {/* 2-column grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 24px",
            }}
                className="ket-luan-grid"
            >
                {[left, right].map((col, ci) => (
                    <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {col.map((item) => {
                            const cs = COLOR_STYLES[item.color];
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "flex-start",
                                        background: cs.bg,
                                        border: `1px solid ${cs.border}`,
                                        borderRadius: 10,
                                        padding: "10px 14px",
                                    }}
                                >
                                    {/* Dot indicator */}
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: cs.dot,
                                        flexShrink: 0,
                                        marginTop: 5,
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: cs.titleColor,
                                            marginBottom: 3,
                                        }}>
                                            {item.title}
                                        </p>
                                        <p style={{
                                            fontSize: 12.5,
                                            color: "var(--muted-foreground)",
                                            lineHeight: 1.55,
                                            margin: 0,
                                        }}>
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Responsive for mobile */}
            <style>{`
                @media (max-width: 768px) {
                    .ket-luan-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
