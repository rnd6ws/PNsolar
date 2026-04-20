'use client';
// src/features/phan-quyen/components/PhanQuyenClient.tsx

import { useState, useTransition, useCallback } from 'react';
import {
    Shield, Eye, EyeOff, Pencil, Check, X, ChevronDown, ChevronUp,
    Copy, Search, User, Users, Loader2, ShieldCheck, ShieldOff, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES, type UserPermissions } from '@/lib/permissions';
import { updatePermissionsAction, copyPermissionsAction } from '@/features/phan-quyen/action';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Employee {
    ID: string;
    MA_NV: string;
    HO_TEN: string;
    CHUC_VU: string;
    PHONG_BAN: string | null;
    ROLE: string;
    IS_ACTIVE: boolean;
    HINH_CA_NHAN: string | null;
    PHAN_QUYEN: { MODULE: string; CAN_VIEW: boolean; CAN_ADD: boolean; CAN_EDIT: boolean; CAN_DELETE: boolean; CAN_MANAGE: boolean }[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildPermsFromEmployee(emp: Employee): UserPermissions {
    const perms: UserPermissions = {};
    for (const mod of MODULES) {
        perms[mod.key] = { canView: false, canAdd: false, canEdit: false, canDelete: false, canManage: false };
    }
    for (const pq of emp.PHAN_QUYEN) {
        perms[pq.MODULE] = {
            canView: pq.CAN_VIEW,
            canAdd: pq.CAN_ADD,
            canEdit: pq.CAN_EDIT,
            canDelete: pq.CAN_DELETE,
            canManage: pq.CAN_MANAGE
        };
    }
    return perms;
}

function getRoleBadge(role: string) {
    if (role === 'MANAGER') return { label: 'Quản lý', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (role === 'STAFF') return { label: 'Nhân viên', cls: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    return { label: role, cls: 'bg-muted text-muted-foreground border-border' };
}

// ─────────────────────────────────────────────
// Badge tóm tắt quyền
// ─────────────────────────────────────────────
function PermSummaryBadge({ emp }: { emp: Employee }) {
    const viewCount = emp.PHAN_QUYEN.filter((p) => p.CAN_VIEW).length;
    const manageCount = emp.PHAN_QUYEN.filter((p) => p.CAN_MANAGE).length;
    const total = MODULES.length;

    if (viewCount === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800">
                <ShieldOff className="w-3 h-3" /> Chưa cấp quyền
            </span>
        );
    }
    if (viewCount === total) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" /> Toàn quyền xem ({manageCount}/{total} quản lý)
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <Shield className="w-3 h-3" /> Xem {viewCount}/{total} · Quản lý {manageCount}/{total}
        </span>
    );
}

// ─────────────────────────────────────────────
// Row phân quyền cho từng nhân viên
// ─────────────────────────────────────────────
function EmployeePermRow({
    emp,
    allEmployees,
}: {
    emp: Employee;
    allEmployees: Employee[];
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [perms, setPerms] = useState<UserPermissions>(() => buildPermsFromEmployee(emp));
    const [isDirty, setIsDirty] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [copyFrom, setCopyFrom] = useState('');

    const toggle = (moduleKey: string, field: keyof UserPermissions[string], value: boolean) => {
        setPerms((prev) => {
            const current = prev[moduleKey] ?? { canView: false, canAdd: false, canEdit: false, canDelete: false, canManage: false };
            const next = { ...current, [field]: value };

            if (field === 'canManage') {
                if (value) {
                    // Cấp toàn quyền -> bật hết
                    next.canView = next.canAdd = next.canEdit = next.canDelete = true;
                } else {
                    next.canView = next.canAdd = next.canEdit = next.canDelete = false;
                }
            } else {
                // Tắt 1 quyền phụ -> tắt luôn toàn quyền
                if (!value) next.canManage = false;

                // Mở Thêm/Sửa/Xóa -> bắt buộc phải mở Xem
                if (value && ['canAdd', 'canEdit', 'canDelete'].includes(field)) {
                    next.canView = true;
                }

                // Tắt Xem -> tắt hết
                if (field === 'canView' && !value) {
                    next.canAdd = next.canEdit = next.canDelete = false;
                }

                // Nếu thủ công tick đủ 4 cái -> bật toàn quyền luôn
                if (next.canView && next.canAdd && next.canEdit && next.canDelete) {
                    next.canManage = true;
                }
            }

            return { ...prev, [moduleKey]: next };
        });
        setIsDirty(true);
    };

    const toggleAll = (type: 'viewAll' | 'manageAll' | 'removeAll') => {
        setPerms((prev) => {
            const next = { ...prev };
            for (const mod of MODULES) {
                if (type === 'viewAll') {
                    next[mod.key] = { ...next[mod.key], canView: true };
                } else if (type === 'manageAll') {
                    next[mod.key] = { canView: true, canAdd: true, canEdit: true, canDelete: true, canManage: true };
                } else if (type === 'removeAll') {
                    next[mod.key] = { canView: false, canAdd: false, canEdit: false, canDelete: false, canManage: false };
                }
            }
            return next;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updatePermissionsAction(emp.ID, perms);
            if (result.success) {
                toast.success(result.message);
                setIsDirty(false);
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleDiscard = () => {
        setPerms(buildPermsFromEmployee(emp));
        setIsDirty(false);
    };

    const handleCopy = () => {
        if (!copyFrom) return;
        const src = allEmployees.find((e) => e.ID === copyFrom);
        if (!src) return;
        setPerms(buildPermsFromEmployee(src));
        setIsDirty(true);
        toast.info(`Đã sao chép quyền từ "${src.HO_TEN}"`);
    };

    const roleBadge = getRoleBadge(emp.ROLE);
    const mainMods = MODULES.filter((m) => m.group === 'main');
    const sysMods = MODULES.filter((m) => m.group === 'system');

    return (
        <div className={cn(
            "border border-border rounded-xl overflow-hidden transition-all",
            isExpanded && "shadow-md ring-1 ring-primary/10"
        )}>
            {/* Row Header */}
            <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
            >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {emp.HINH_CA_NHAN
                        ? <img src={emp.HINH_CA_NHAN} alt={emp.HO_TEN} className="w-full h-full object-cover rounded-lg" />
                        : emp.HO_TEN.charAt(0).toUpperCase()
                    }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm truncate">{emp.HO_TEN}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", roleBadge.cls)}>
                            {roleBadge.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground font-mono">{emp.MA_NV}</span>
                        {emp.PHONG_BAN && (
                            <span className="text-[11px] text-muted-foreground">· {emp.PHONG_BAN}</span>
                        )}
                    </div>
                </div>

                {/* Perm Summary */}
                <div className="hidden sm:block">
                    <PermSummaryBadge emp={emp} />
                </div>

                {/* Chevron */}
                <div className="ml-2 shrink-0">
                    {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                </div>
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="border-t border-border bg-background">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border bg-muted/20">
                        {/* Quick toggles */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium whitespace-nowrap">Chọn nhanh:</span>
                            <button
                                onClick={() => toggleAll('viewAll')}
                                className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md hover:bg-sky-100 transition-colors"
                            >
                                Xem tất cả
                            </button>
                            <button
                                onClick={() => toggleAll('manageAll')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                            >
                                Quản lý tất cả
                            </button>
                            <button
                                onClick={() => toggleAll('removeAll')}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                            >
                                Thu hồi tất cả
                            </button>
                        </div>

                        {/* Copy from */}
                        <div className="flex items-center gap-2 ml-auto">
                            <select
                                value={copyFrom}
                                onChange={(e) => setCopyFrom(e.target.value)}
                                className="h-7 text-xs px-2 border border-input bg-background rounded-md focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Sao chép từ...</option>
                                {allEmployees
                                    .filter((e) => e.ID !== emp.ID)
                                    .map((e) => (
                                        <option key={e.ID} value={e.ID}>{e.HO_TEN}</option>
                                    ))
                                }
                            </select>
                            <button
                                onClick={handleCopy}
                                disabled={!copyFrom}
                                className="h-7 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium border border-input bg-background hover:bg-muted rounded-md disabled:opacity-40 transition-colors"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Sao chép
                            </button>
                        </div>
                    </div>

                    {/* Permission Table Layout */}
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-[11px] uppercase font-bold text-muted-foreground bg-muted/30 border-b tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Module hệ thống</th>
                                    <th className="px-4 py-4 text-center">Xem</th>
                                    <th className="px-4 py-4 text-center">Thêm</th>
                                    <th className="px-4 py-4 text-center">Sửa</th>
                                    <th className="px-4 py-4 text-center">Xóa</th>
                                    <th className="px-6 py-4 text-center">Toàn quyền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {MODULES.map((mod) => {
                                    const p = perms[mod.key] ?? { canView: false, canAdd: false, canEdit: false, canDelete: false, canManage: false };
                                    return (
                                        <tr key={mod.key} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-foreground">{mod.label}</td>

                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.canView}
                                                    onChange={(e) => toggle(mod.key, 'canView', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.canAdd}
                                                    onChange={(e) => toggle(mod.key, 'canAdd', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.canEdit}
                                                    onChange={(e) => toggle(mod.key, 'canEdit', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.canDelete}
                                                    onChange={(e) => toggle(mod.key, 'canDelete', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={p.canManage}
                                                    onChange={(e) => toggle(mod.key, 'canManage', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary shadow-sm cursor-pointer accent-primary"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Save / Discard Footer */}
                    {isDirty && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-amber-50/50 dark:bg-amber-900/10">
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>Có thay đổi chưa lưu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDiscard}
                                    disabled={isPending}
                                    className="h-8 px-3 text-xs font-medium border border-input bg-background hover:bg-muted rounded-md transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="h-8 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {isPending
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                                        : <><Check className="w-3.5 h-3.5" /> Lưu quyền</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function PhanQuyenClient({ employees }: { employees: Employee[] }) {
    const [search, setSearch] = useState('');

    const filtered = employees.filter((e) =>
        e.HO_TEN.toLowerCase().includes(search.toLowerCase()) ||
        e.MA_NV.toLowerCase().includes(search.toLowerCase()) ||
        (e.PHONG_BAN ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const totalWithPerms = employees.filter((e) => e.PHAN_QUYEN.some((p) => p.CAN_VIEW)).length;

    return (
        <div className="space-y-6">
            {/* Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng nhân viên', value: employees.length, icon: Users, color: 'text-primary bg-primary/10' },
                    { label: 'Đã cấp quyền', value: totalWithPerms, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Chưa cấp', value: employees.length - totalWithPerms, icon: ShieldOff, color: 'text-rose-600 bg-rose-500/10' },
                    { label: 'Tổng module', value: MODULES.length, icon: Shield, color: 'text-purple-600 bg-purple-500/10' },
                ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground leading-none">{s.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Bạn có thể tick nhanh:</span>
                <span className="flex items-center gap-1.5">
                    <strong className="text-foreground">Toàn quyền:</strong> Tự động mở quyền Xem, Thêm, Sửa, Xóa.
                </span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    className="w-full h-10 pl-9 pr-4 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tìm nhân viên theo tên, mã NV, phòng ban..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Employee List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <User className="w-12 h-12 mx-auto opacity-20 mb-3" />
                        <p className="font-medium">Không tìm thấy nhân viên</p>
                    </div>
                ) : (
                    filtered.map((emp) => (
                        <EmployeePermRow key={emp.ID} emp={emp} allEmployees={employees} />
                    ))
                )}
            </div>
        </div>
    );
}
