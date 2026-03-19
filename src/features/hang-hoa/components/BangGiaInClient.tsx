'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProductsForBangGia, type BangGiaProduct } from '@/features/hang-hoa/action-bang-gia';
import { Printer, ArrowLeft, Settings2, X } from 'lucide-react';

// Format number as Vietnamese currency
function fmtVND(n: number | null | undefined) {
    if (n == null) return '—';
    return new Intl.NumberFormat('vi-VN').format(n);
}

export default function BangGiaInClient() {
    const [products, setProducts] = useState<BangGiaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [tieuDe, setTieuDe] = useState('BẢNG GIÁ INVERTER DEYE');
    const [ghiChu, setGhiChu] = useState('(Đã bao gồm VAT)');
    const [showSettings, setShowSettings] = useState(false);
    const [showChinhSachBH, setShowChinhSachBH] = useState(true);
    const [showGiaNhap, setShowGiaNhap] = useState(true);

    // Load selected products from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('bangGia_selectedProducts');
        if (stored) {
            const maHHList: string[] = JSON.parse(stored);
            loadProducts(maHHList);
        } else {
            setLoading(false);
        }
    }, []);

    const loadProducts = async (maHHList: string[]) => {
        setLoading(true);
        const data = await getProductsForBangGia(maHHList);
        setProducts(data);
        setLoading(false);
    };

    // Group products by PHAN_LOAI + DONG_HANG
    const groupedProducts = useMemo(() => {
        const groups: { phanLoai: string; dongHang: string; items: BangGiaProduct[] }[] = [];
        const groupMap = new Map<string, BangGiaProduct[]>();

        for (const p of products) {
            const key = `${p.PHAN_LOAI}|||${p.DONG_HANG}`;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(p);
        }

        for (const [key, items] of groupMap) {
            const [phanLoai, dongHang] = key.split('|||');
            groups.push({ phanLoai, dongHang, items });
        }

        return groups;
    }, [products]);

    // Helper: lấy danh sách gói giá riêng cho 1 nhóm sản phẩm
    const getGroupGoiGia = (items: BangGiaProduct[]) => {
        const set = new Set<string>();
        for (const p of items) {
            for (const gb of p.giaBanList) {
                set.add(gb.GOI_GIA);
            }
        }
        return Array.from(set);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Đang tải dữ liệu bảng giá...</p>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-gray-500">Chưa có sản phẩm nào được chọn.</p>
                    <button
                        onClick={() => { window.close(); window.location.href = '/hang-hoa'; }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Global STT counter
    let globalSTT = 0;

    return (
        <div className="bg-gray-100 min-h-screen" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            {/* Print Control Bar - Hidden when printing */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { window.close(); window.location.href = '/hang-hoa'; }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                        <span className="text-sm text-gray-400">|</span>
                        <span className="text-sm font-medium text-gray-700">Xem trước bảng giá ({products.length} sản phẩm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Settings2 className="w-4 h-4" />
                            Tùy chỉnh
                        </button>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            In bảng giá
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="border-t border-gray-200 bg-gray-50">
                        <div className="max-w-[1200px] mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tiêu đề bảng giá</label>
                                <input
                                    type="text"
                                    value={tieuDe}
                                    onChange={e => setTieuDe(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Ghi chú</label>
                                <input
                                    type="text"
                                    value={ghiChu}
                                    onChange={e => setGhiChu(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showChinhSachBH}
                                        onChange={e => setShowChinhSachBH(e.target.checked)}
                                        className="accent-blue-600 w-4 h-4"
                                    />
                                    Hiện Chính sách BH
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showGiaNhap}
                                        onChange={e => setShowGiaNhap(e.target.checked)}
                                        className="accent-blue-600 w-4 h-4"
                                    />
                                    Hiện Giá nhập (NHẬP)
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Print Content */}
            <div className="max-w-[1200px] mx-auto print:max-w-none bg-white print:shadow-none shadow-lg my-6 print:my-0">
                <div className="p-8 print:p-6">
                    {/* === HEADER === */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h1 className="text-[15px] font-bold text-gray-900 uppercase tracking-wide">
                                CÔNG TY TNHH PHÚC NGUYÊN SOLAR
                            </h1>
                            <div className="text-[10px] text-gray-600 mt-1 space-y-0.5 leading-relaxed">
                                <p>- Số 289 đường Nguyễn Đức Thuận, tổ 85, khu 6 - Phường Phú Lợi - Thành phố Thủ Dầu Một - Tỉnh Bình Dương</p>
                                <p>- Văn phòng: Số 91A1 Đường Hoàng Hoa Thám nối dài - KDC Hiệp Thành 3, Phường Phú Lợi - Thành phố Thủ Dầu Một - Tỉnh Bình Dương</p>
                                <p>- Kho hàng: 143 Nguyễn Thái Bình - Phường Phú Lợi - Thành phố Thủ Dầu Một - Tỉnh Bình Dương</p>
                            </div>
                        </div>
                        <div className="shrink-0 ml-6">
                            <img
                                src="/logoPN.jpg"
                                alt="PN Solar Logo"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* === TITLE === */}
                    <div className="text-center mb-6">
                        <h2 className="text-[18px] font-bold text-blue-800 uppercase tracking-wider">
                            {tieuDe}
                        </h2>
                        {ghiChu && (
                            <p className="text-[12px] text-gray-600 mt-1 font-medium">{ghiChu}</p>
                        )}
                    </div>

                    {/* === TABLE CONTENT - Grouped by PHAN_LOAI + DONG_HANG === */}
                    {groupedProducts.map((group, groupIdx) => {
                        // Lấy gói giá riêng cho nhóm này
                        const groupGoiGia = getGroupGoiGia(group.items);

                        return (
                            <div key={groupIdx} className="mb-6 last:mb-0">
                                {/* Group Header Row */}
                                <table className="w-full border-collapse text-[11px]">
                                    <thead>
                                        <tr className="bg-yellow-400/80">
                                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-[30px]">STT</th>
                                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 uppercase" colSpan={2}>
                                                {group.phanLoai} {group.dongHang ? `( ${group.dongHang} )` : ''}
                                            </th>
                                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900">Mã Hàng</th>
                                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900">Xuất Xứ</th>
                                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900">Bảo Hành</th>
                                            {showChinhSachBH && (
                                                <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900">Chính sách BH</th>
                                            )}

                                            {groupGoiGia.map(goiGia => (
                                                <th key={goiGia} className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900">{goiGia}</th>
                                            ))}
                                            {showGiaNhap && (
                                                <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-red-700 bg-red-100">NHẬP</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((prod, idx) => {
                                            globalSTT++;
                                            const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40';

                                            return (
                                                <tr key={prod.ID} className={`${rowBg} hover:bg-blue-50/60 transition-colors`}>
                                                    <td className="border border-gray-300 px-2 py-1.5 text-center font-medium text-gray-700">{globalSTT}</td>
                                                    <td className="border border-gray-300 px-2 py-1.5 text-left text-gray-900 font-medium" colSpan={2}>
                                                        {prod.TEN_HH}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600 font-mono text-[10px]">
                                                        {prod.MODEL}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">
                                                        {prod.XUAT_XU || '—'}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">
                                                        {prod.BAO_HANH || '—'}
                                                    </td>
                                                    {showChinhSachBH && idx === 0 && (
                                                        <td className="border border-gray-300 px-2 py-1.5 text-left text-[10px] text-gray-600" rowSpan={group.items.length}>
                                                            <div className="space-y-0.5">
                                                                <p>- Bảo hành 5 năm</p>
                                                                <p>  thay thế board</p>
                                                                <p>  mạch mới 100%.</p>
                                                                <p>- Thay thế 1 đổi 1</p>
                                                                <p>  trong vòng 48h sau</p>
                                                                <p>  lắp đặt và vận hành</p>
                                                                <p>  lần đầu</p>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {groupGoiGia.map(goiGia => {
                                                        const giaBan = prod.giaBanList.find(g => g.GOI_GIA === goiGia);
                                                        return (
                                                            <td key={goiGia} className="border border-gray-300 px-2 py-1.5 text-right font-medium text-gray-800">
                                                                {fmtVND(giaBan?.DON_GIA)}
                                                            </td>
                                                        );
                                                    })}
                                                    {showGiaNhap && (
                                                        <td className="border border-gray-300 px-2 py-1.5 text-right font-bold text-red-600 bg-red-50">
                                                            {fmtVND(prod.giaNhap)}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {/* Footer Notes */}
                    <div className="mt-6 text-[10px] text-gray-500 space-y-1">
                        <p><strong>Ghi chú:</strong></p>
                        <p>- Giá trên đã bao gồm VAT.</p>
                        <p>- Giá có thể thay đổi theo thời điểm, vui lòng liên hệ để xác nhận giá mới nhất.</p>
                        <p>- Chính sách bảo hành áp dụng theo quy định của nhà sản xuất và điều kiện lắp đặt tiêu chuẩn.</p>
                    </div>

                    {/* Signature area */}
                    <div className="mt-8 flex justify-between px-8">
                        <div className="text-center">
                            <p className="text-[11px] font-bold text-gray-700 uppercase">Người lập</p>
                            <p className="text-[10px] text-gray-400 mt-1 italic">(Ký, ghi rõ họ tên)</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold text-gray-700 uppercase">Giám đốc</p>
                            <p className="text-[10px] text-gray-400 mt-1 italic">(Ký, ghi rõ họ tên)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 8mm;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:max-w-none {
                        max-width: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:my-0 {
                        margin-top: 0 !important;
                        margin-bottom: 0 !important;
                    }
                    .print\\:p-6 {
                        padding: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
