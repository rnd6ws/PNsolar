"use client"
import { X, Phone, Mail, MapPin, Building2, Briefcase, Shield, Calendar, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ChiTietNhanVienProps {
    emp: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChiTietNhanVien({ emp, isOpen, onClose }: ChiTietNhanVienProps) {
    if (!isOpen || !emp) return null;

    const roleLabel = emp.ROLE === 'ADMIN' ? 'Quản trị viên' : emp.ROLE === 'MANAGER' ? 'Quản lý' : 'Nhân viên';
    const roleColor = emp.ROLE === 'ADMIN'
        ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : emp.ROLE === 'MANAGER'
            ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

    const infoRows = [
        { icon: User, label: 'Mã NV', value: emp.MA_NV },
        { icon: User, label: 'Username', value: emp.USER_NAME },
        { icon: Briefcase, label: 'Chức vụ', value: emp.CHUC_VU || '—' },
        { icon: Building2, label: 'Phòng ban', value: emp.PHONG_BAN || '—' },
        { icon: Phone, label: 'Số điện thoại', value: emp.SO_DIEN_THOAI || '—' },
        { icon: Mail, label: 'Email', value: emp.EMAIL || '—' },
        { icon: MapPin, label: 'Địa chỉ', value: emp.DIA_CHI || '—' },
        { icon: Shield, label: 'Vai trò', value: roleLabel, badge: true },
        { icon: Calendar, label: 'Ngày tạo', value: emp.CREATED_AT ? new Date(emp.CREATED_AT).toLocaleDateString('vi-VN') : '—' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Slide Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <h2 className="text-base font-bold text-foreground">Chi tiết nhân viên</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Profile Card */}
                    <div className="p-6 flex flex-col items-center text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
                        {emp.HINH_CA_NHAN ? (
                            <Image
                                src={emp.HINH_CA_NHAN}
                                alt={emp.HO_TEN}
                                width={88}
                                height={88}
                                className="rounded-full object-cover border-4 border-background shadow-lg"
                                style={{ width: 88, height: 88 }}
                                unoptimized
                            />
                        ) : (
                            <div
                                className="rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center text-primary font-bold"
                                style={{ width: 88, height: 88, fontSize: 32 }}
                            >
                                {emp.HO_TEN?.charAt(0)}
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground mt-3">{emp.HO_TEN}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {emp.CHUC_VU}{emp.PHONG_BAN ? ` · ${emp.PHONG_BAN}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide", roleColor)}>
                                {roleLabel}
                            </span>
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
                                emp.IS_ACTIVE
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", emp.IS_ACTIVE ? "bg-emerald-500" : "bg-slate-400")} />
                                {emp.IS_ACTIVE ? 'Đang hoạt động' : 'Tạm nghỉ'}
                            </span>
                        </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="p-5 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Thông tin chi tiết</p>
                        {infoRows.map((row, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                    <row.icon className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{row.label}</p>
                                    {row.badge ? (
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5", roleColor)}>
                                            {row.value}
                                        </span>
                                    ) : (
                                        <p className="text-sm text-foreground font-medium truncate">{row.value}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
