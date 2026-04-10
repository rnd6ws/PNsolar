export interface MapKhachHang {
    ID: string;
    MA_KH: string;
    TEN_KH: string;
    TEN_VT: string | null;
    DIA_CHI: string | null;
    DIEN_THOAI: string | null;
    EMAIL: string | null;
    PHAN_LOAI: string | null;
    NGUON: string | null;
    SALES_PT: string | null;
    DANH_GIA: string | null;
    HINH_ANH: string | null;
    LAT: string | null;
    LONG: string | null;
    NGAY_GHI_NHAN: string | null;
    _count: {
        CO_HOI: number;
        HOP_DONG: number;
    };
}

export interface NguonKHMap {
    ID: string;
    NGUON: string | null;
}

export interface SalesMap {
    MA_NV: string;
    HO_TEN: string | null;
}

export interface MapFilters {
    nguon: string[];
    phanLoai: string[];
    danhGia: string[];
    sales: string[];
}

export interface MapStatistics {
    total: number;
    byPhanLoai: Record<string, number>;
    byNguon: Record<string, number>;
    bySales: Record<string, number>;
    byDanhGia: number[]; // index 0 = 1 sao, index 4 = 5 sao
    coHopDong: number;
}
