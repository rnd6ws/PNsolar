"use client";

import { useState, useRef } from "react";
import { Plus, Search, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import Modal from "@/components/Modal";
import { createKhachHang, lookupCompanyByTaxCode, getCoordinatesFromAddress } from "@/features/khach-hang/action";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface Props {
    phanLoais: { ID: string; PL_KH: string }[];
    nguons: { ID: string; NGUON: string }[];
    nhoms: { ID: string; NHOM: string }[];
}

export default function AddKhachHangButton({ phanLoais, nguons, nhoms }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hinhAnh, setHinhAnh] = useState("");
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [coordinateLoading, setCoordinateLoading] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(false);

    const fetchCoordinates = async (address: string) => {
        if (!address || address.trim() === '') return false;
        setCoordinateLoading(true);
        try {
            const res = await getCoordinatesFromAddress(address);

            if (res.success && res.data) {
                const { lat, lon } = res.data;
                if (formRef.current) {
                    const latEl = formRef.current.elements.namedItem("LAT") as HTMLInputElement;
                    const longEl = formRef.current.elements.namedItem("LONG") as HTMLInputElement;
                    if (latEl) latEl.value = lat;
                    if (longEl) longEl.value = lon;
                }
                setShowCoordinates(true);
                toast.success('Đã lấy tọa độ thành công!');
                setCoordinateLoading(false);
                return true;
            } else {
                toast.error(res.message || 'Không tìm thấy tọa độ cho địa chỉ này');
            }
        } catch (error) {
            console.error('Lỗi khi lấy tọa độ:', error);
            toast.error('Không thể lấy tọa độ từ địa chỉ này');
        }
        setCoordinateLoading(false);
        return false;
    };

    const handleManualGetCoordinates = async () => {
        if (formRef.current) {
            const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;
            const address = diaChiEl?.value;
            if (!address || address.trim() === '') {
                toast.warning('Vui lòng nhập địa chỉ trước khi lấy tọa độ');
                return;
            }
            await fetchCoordinates(address);
        }
    };

    const handleLookup = async () => {
        const taxCodeElement = formRef.current?.elements.namedItem("MST") as HTMLInputElement;
        const taxCode = taxCodeElement?.value;
        if (!taxCode || taxCode.trim() === '') {
            toast.warning('Vui lòng nhập mã số thuế trước khi tra cứu');
            return;
        }

        setLookupLoading(true);
        const res = await lookupCompanyByTaxCode(taxCode);
        if (res.success && res.data) {
            if (formRef.current) {
                const tenKhEl = formRef.current.elements.namedItem("TEN_KH") as HTMLInputElement;
                const tenVtEl = formRef.current.elements.namedItem("TEN_VT") as HTMLInputElement;
                const diaChiEl = formRef.current.elements.namedItem("DIA_CHI") as HTMLTextAreaElement;

                if (tenKhEl) tenKhEl.value = res.data.name || tenKhEl.value;
                if (tenVtEl) tenVtEl.value = res.data.shortName || tenVtEl.value;
                if (diaChiEl) {
                    diaChiEl.value = res.data.address || diaChiEl.value;
                    diaChiEl.style.height = 'auto';
                    diaChiEl.style.height = `${diaChiEl.scrollHeight}px`;
                }
            }
            toast.success("Đã cập nhật thông tin công ty từ mã số thuế");

            if (res.data.address) {
                await fetchCoordinates(res.data.address);
            }
        } else {
            toast.error(res.message || "Không tìm thấy thông tin doanh nghiệp");
        }
        setLookupLoading(false);
    };

    const handleClose = () => { setIsOpen(false); setHinhAnh(""); setError(null); };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        const res = await createKhachHang({ ...data, HINH_ANH: hinhAnh });
        if (res.success) {
            toast.success("Đã thêm khách hàng mới");
            handleClose();
            (e.target as HTMLFormElement).reset();
        } else {
            const msg = (res as any).message || "Lỗi không xác định";
            setError(msg);
            toast.error(msg);
        }
        setLoading(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="btn-premium-primary text-sm font-medium shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                Thêm khách hàng
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Thêm khách hàng mới">
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-0">
                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold">{error}</div>
                    )}
                    <div className="flex justify-center space-y-0">
                        <ImageUpload value={hinhAnh} onChange={setHinhAnh} size={88} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tên khách hàng <span className="text-destructive">*</span></label>
                        <input name="TEN_KH" required className="input-modern" placeholder="Nhập tên khách hàng hoặc nhập mst để tra cứu" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tên viết tắt <span className="text-destructive">*</span></label>
                            <input name="TEN_VT" required className="input-modern" placeholder="Nhập tên viết tắt" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ngày ghi nhận</label>
                            <input name="NGAY_GHI_NHAN" type="date" className="input-modern" defaultValue={new Date().toISOString().split("T")[0]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Điện thoại</label>
                            <input name="DIEN_THOAI" className="input-modern" placeholder="09xxx..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                            <input name="EMAIL" type="email" className="input-modern" placeholder="email@gmail.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mã số thuế</label>
                            <div className="flex gap-2">
                                <input name="MST" className="input-modern" placeholder="0123456789" />
                                <button type="button" onClick={handleLookup} disabled={lookupLoading} className="btn-premium-primary flex items-center justify-center gap-1.5 px-3">
                                    {lookupLoading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Search className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Địa chỉ</label>
                            <button 
                                type="button" 
                                onClick={() => setShowCoordinates(!showCoordinates)} 
                                className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
                            >
                                Thiết lập tọa độ {showCoordinates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex gap-2 items-stretch">
                            <textarea
                                name="DIA_CHI"
                                className="input-modern resize-none overflow-hidden"
                                placeholder="Nhập địa chỉ"
                                rows={1}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleManualGetCoordinates}
                                disabled={coordinateLoading}
                                className="btn-premium-secondary shrink-0 flex items-center justify-center gap-1.5 w-12 h-auto"
                                title="Lấy tọa độ từ địa chỉ"
                            >
                                {coordinateLoading ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <MapPin className="w-6 h-6 text-primary" />}
                            </button>
                        </div>
                    </div>

                    {showCoordinates && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vĩ độ (LAT)</label>
                                <input name="LAT" className="input-modern" placeholder="Tọa độ Latitude" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kinh độ (LONG)</label>
                                <input name="LONG" className="input-modern" placeholder="Tọa độ Longitude" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nhóm KH</label>
                            <select name="NHOM_KH" className="input-modern">
                                <option value="">-- Chọn nhóm --</option>
                                {nhoms.map((n) => <option key={n.ID} value={n.NHOM}>{n.NHOM}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phân loại</label>
                            <select name="PHAN_LOAI" className="input-modern">
                                <option value="">-- Chọn phân loại --</option>
                                {phanLoais.map((p) => <option key={p.ID} value={p.PL_KH}>{p.PL_KH}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nguồn</label>
                            <select name="NGUON" className="input-modern">
                                <option value="">-- Chọn nguồn --</option>
                                {nguons.map((n) => <option key={n.ID} value={n.NGUON}>{n.NGUON}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sales phụ trách</label>
                            <input name="SALES_PT" className="input-modern" placeholder="Tên nhân viên sales" />
                        </div>
                    </div>

                    <div className="sticky -bottom-5 md:-bottom-6 -mx-5 md:-mx-6 -mb-5 md:-mb-6 mt-4 bg-card border-t py-3 px-5 md:px-6 flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <button type="button" onClick={handleClose} className="btn-premium-secondary flex-1">Hủy bỏ</button>
                        <button type="submit" disabled={loading} className="btn-premium-primary flex-1">
                            {loading ? "Đang lưu..." : "Lưu khách hàng"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
