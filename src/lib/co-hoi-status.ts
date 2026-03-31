// ─── Hệ thống Trạng thái Cơ hội (Computed / Virtual) ─────────────────────────
// Trạng thái được tính toán từ các bảng con, KHÔNG lưu vào DB (trừ "Đã đóng")
// Chỉ có TINH_TRANG = "Đang mở" | "Đã đóng" là lưu thật trong CO_HOI

export type WarningLevel = "warning" | "danger" | "critical" | "risk" | null;

export interface ComputedStatus {
  label: string;           // "Đang mở", "Đang tư vấn", "Đã gửi đề xuất", ...
  pct: number;             // 10 | 25 | 35 | 75 | 100 | 0
  pctChot: number;         // % Chốt đơn theo giai đoạn
  color: string;           // màu Tailwind cho badge
  ngayTt: Date | null;     // ngày trạng thái (ngày xảy ra sự kiện)
  isLocked: boolean;       // true = đã kết thúc (Thành công | Không TC | Đã đóng)
  shortLabel: string;      // nhãn ngắn hiển thị progress
}

// ─── Định nghĩa các bước pipeline ────────────────────────────────────────────
export const PIPELINE_STEPS = [
  { pct: 10,  label: "Đang mở",           shortLabel: "Bắt đầu",    color: "blue"   },
  { pct: 25,  label: "Đang tư vấn",        shortLabel: "Chăm sóc",   color: "cyan"   },
  { pct: 35,  label: "Đã gửi đề xuất",     shortLabel: "Đàm phán",   color: "indigo" },
  { pct: 75,  label: "Chờ quyết định",     shortLabel: "Gần chốt",   color: "orange" },
  { pct: 100, label: "Thành công",          shortLabel: "Win!",        color: "green"  },
  { pct: 0,   label: "Không thành công",   shortLabel: "Lost",        color: "red"    },
  { pct: 0,   label: "Đã đóng",            shortLabel: "Đóng",        color: "gray"   },
] as const;

// Các trạng thái kết thúc (không có cảnh báo)
export const LOCKED_STATUSES = ["Thành công", "Không thành công", "Đã đóng"] as const;

// Các trạng thái đang hoạt động (cần cảnh báo theo ngày)
export const ACTIVE_WARN_STATUSES = ["Đang mở", "Đang tư vấn", "Đã gửi đề xuất"] as const;

// ─── Hàm tính trạng thái ảo từ dữ liệu related ──────────────────────────────
export function computeCoHoiStatus(coHoi: {
  TINH_TRANG: string;
  NGAY_TAO: Date | string;
  NGAY_DONG?: Date | string | null;
  HOP_DONG?: Array<{
    DUYET?: string | null;
    NGAY_HD: Date | string;
    NGAY_DUYET?: Date | string | null;
  }> | null;
  BAO_GIAS?: Array<{ NGAY_BAO_GIA: Date | string }> | null;
  KEHOACH_CSKH?: Array<{
    TRANG_THAI: string;
    TG_DEN?: Date | string | null;
  }> | null;
}): ComputedStatus {

  // Helper chuyển sang Date
  const toDate = (v: Date | string | null | undefined): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1. Đã đóng (lưu thật trong DB)
  if (coHoi.TINH_TRANG === "Đã đóng") {
    return {
      label: "Đã đóng", pct: 0, pctChot: 0, color: "gray", shortLabel: "Đóng",
      ngayTt: toDate(coHoi.NGAY_DONG),
      isLocked: true,
    };
  }

  const hds = coHoi.HOP_DONG ?? [];

  // 2. Thành công: HĐ có DUYET = "Đã duyệt"
  const hdDaDuyet = hds.find(h => h.DUYET === "Đã duyệt");
  if (hdDaDuyet) {
    return {
      label: "Thành công", pct: 100, pctChot: 100, color: "green", shortLabel: "Win!",
      ngayTt: toDate(hdDaDuyet.NGAY_DUYET),
      isLocked: true,
    };
  }

  // 3. Không thành công: HĐ có DUYET = "Không duyệt"
  const hdKhongDuyet = hds.find(h => h.DUYET === "Không duyệt");
  if (hdKhongDuyet) {
    return {
      label: "Không thành công", pct: 0, pctChot: 0, color: "red", shortLabel: "Lost",
      // Dùng NGAY_DUYET (ngày ghi nhận kết quả duyệt)
      ngayTt: toDate(hdKhongDuyet.NGAY_DUYET),
      isLocked: true,
    };
  }

  // 4. Chờ quyết định: HĐ tồn tại (Chờ duyệt hoặc chưa có trạng thái duyệt)
  const hdChoDuyet = hds.find(h => !h.DUYET || h.DUYET === "Chờ duyệt");
  if (hdChoDuyet) {
    return {
      label: "Chờ quyết định", pct: 75, pctChot: 75, color: "orange", shortLabel: "Gần chốt",
      ngayTt: toDate(hdChoDuyet.NGAY_HD),
      isLocked: false,
    };
  }

  // 5. Đã gửi đề xuất: Có Báo giá gắn MA_CH
  const bgs = coHoi.BAO_GIAS ?? [];
  if (bgs.length > 0) {
    // Lấy báo giá đầu tiên (sớm nhất)
    const bgFirst = bgs.reduce((a, b) =>
      new Date(a.NGAY_BAO_GIA) <= new Date(b.NGAY_BAO_GIA) ? a : b
    );
    return {
      label: "Đã gửi đề xuất", pct: 35, pctChot: 35, color: "indigo", shortLabel: "Đàm phán",
      ngayTt: toDate(bgFirst.NGAY_BAO_GIA),
      isLocked: false,
    };
  }

  // 6. Đang tư vấn: Có KẾ HOẠCH CSKH gắn MA_CH và TRANG_THAI = "Đã báo cáo" (chỉ cần 1)
  const cskhs = coHoi.KEHOACH_CSKH ?? [];
  const cskhDaBaoCao = cskhs.find(k => k.TRANG_THAI === "Đã báo cáo");
  if (cskhDaBaoCao) {
    return {
      label: "Đang tư vấn", pct: 25, pctChot: 25, color: "cyan", shortLabel: "Chăm sóc",
      ngayTt: toDate(cskhDaBaoCao.TG_DEN),
      isLocked: false,
    };
  }

  // 7. Đang mở (default — lưu thật trong DB)
  return {
    label: "Đang mở", pct: 10, pctChot: 10, color: "blue", shortLabel: "Bắt đầu",
    ngayTt: toDate(coHoi.NGAY_TAO),
    isLocked: false,
  };
}

// ─── Hàm tính mức cảnh báo theo ngày ────────────────────────────────────────
export function getWarningLevel(status: ComputedStatus): WarningLevel {
  if (!status.ngayTt || status.isLocked) return null;

  const days = Math.floor((Date.now() - new Date(status.ngayTt).getTime()) / 86_400_000);

  // Chờ quyết định: > 30 ngày → Cơ hội rủi ro
  if (status.label === "Chờ quyết định") {
    return days > 30 ? "risk" : null;
  }

  // Các trạng thái đang hoạt động
  const isActive = (ACTIVE_WARN_STATUSES as readonly string[]).includes(status.label);
  if (!isActive) return null;

  if (days > 90) return "critical"; // Đề xuất đóng
  if (days > 60) return "danger";   // Đề xuất nuôi dưỡng
  if (days > 30) return "warning";  // Cần liên hệ
  return null;
}

// ─── Metadata cảnh báo ───────────────────────────────────────────────────────
export function getWarningMeta(level: WarningLevel): {
  label: string;
  title: string;
  message: (khName: string, status: string) => string;
} | null {
  switch (level) {
    case "warning":
      return {
        label: "Cần liên hệ",
        title: "⚠️ Cơ hội cần chú ý",
        message: (kh, st) => `${kh} - ${st} đã 30+ ngày, Sale cần liên hệ ngay`,
      };
    case "danger":
      return {
        label: "Nuôi dưỡng",
        title: "🔴 Cơ hội nguy hiểm",
        message: (kh, st) => `${kh} - ${st} đã 60+ ngày, đề xuất chuyển nuôi dưỡng dài hạn`,
      };
    case "critical":
      return {
        label: "Đề xuất đóng",
        title: "💀 Cơ hội trì hoãn quá lâu",
        message: (kh, st) => `${kh} - ${st} đã hơn 90 ngày, cân nhắc đóng cơ hội`,
      };
    case "risk":
      return {
        label: "Cơ hội rủi ro",
        title: "🚨 Hợp đồng chờ duyệt lâu",
        message: (kh, _st) => `${kh} - Hợp đồng đang chờ phê duyệt hơn 30 ngày`,
      };
    default:
      return null;
  }
}
