'use client';

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendManualNotificationAction } from '@/features/notifications/action';
import { cn } from '@/lib/utils';

type Employee = {
  ID: string;
  HO_TEN: string;
  MA_NV: string;
  CHUC_VU: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
}

export function SendNotificationModal({ open, onClose, employees }: Props) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    setLoading(true);
    try {
      const result = await sendManualNotificationAction({
        title: title.trim(),
        message: message.trim(),
        recipientId: recipientId || null,
        link: link.trim() || null,
      });
      if (result.success) {
        toast.success(recipientId ? 'Đã gửi thông báo' : 'Đã gửi thông báo đến tất cả nhân viên');
        setTitle('');
        setMessage('');
        setRecipientId('');
        setLink('');
        onClose();
      } else {
        toast.error('message' in result ? result.message : 'Gửi thông báo thất bại');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center h-full p-4 pointer-events-none">
      <div className="w-full max-w-md rounded-xl border bg-background shadow-xl max-h-[85vh] flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <h2 className="font-semibold text-base">Gửi thông báo</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Người nhận</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50'
              )}
            >
              <option value="">Tất cả nhân viên (Broadcast)</option>
              {employees.map((emp) => (
                <option key={emp.ID} value={emp.ID}>
                  {emp.HO_TEN} ({emp.MA_NV}) — {emp.CHUC_VU}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tiêu đề <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              maxLength={100}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground'
              )}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nội dung <span className="text-destructive">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={3}
              maxLength={500}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground'
              )}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>

          {/* Link (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Liên kết <span className="text-xs">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="VD: /bao-gia hoặc /khach-hang"
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
                'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
