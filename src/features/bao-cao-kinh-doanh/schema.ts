export type BaoCaoKinhDoanhItem = {
    ID: string;
    SO_HD: string;
    TEN_KH?: string;
    NGAY_HD: Date;
    TONG_TIEN: number;
    DA_THU: number;
    CON_LAI: number;
};

export type BaoCaoStats = {
    totalContracts: number;
    totalRevenue: number;
    totalCollected: number;
    remainingAmount: number;
};
