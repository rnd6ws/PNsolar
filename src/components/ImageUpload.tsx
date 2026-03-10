"use client"
import { useState, useRef } from 'react';
import { Camera, X, User } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Image from 'next/image';

interface ImageUploadProps {
    /** URL ảnh hiện tại (khi edit) */
    value?: string;
    /** Callback khi upload xong, trả về URL */
    onChange: (url: string) => void;
    /** Kích thước avatar (px) */
    size?: number;
    /** Folder trong Cloudinary */
    folder?: string;
}

export default function ImageUpload({
    value,
    onChange,
    size = 88,
    folder = 'pnsolar/nhan-vien',
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { upload, uploading, error } = useFileUpload({
        folder,
        type: 'image',
        onSuccess: (file) => {
            setPreview(file.url);
            onChange(file.url);
        },
        onError: () => {
            setPreview(value || null);
            onChange('');
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview ngay lập tức (optimistic)
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        await upload(file);

        if (inputRef.current) inputRef.current.value = '';
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Avatar circle */}
            <div
                className="relative cursor-pointer group"
                style={{ width: size, height: size }}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                <div
                    className="w-full h-full rounded-full border-2 border-dashed border-border group-hover:border-primary/60 bg-muted/30 flex items-center justify-center overflow-hidden transition-all"
                    style={{ width: size, height: size }}
                >
                    {preview ? (
                        <Image
                            src={preview}
                            alt="Avatar"
                            width={size}
                            height={size}
                            className="w-full h-full object-cover rounded-full"
                            unoptimized
                        />
                    ) : (
                        <User className="text-muted-foreground/40" style={{ width: size * 0.4, height: size * 0.4 }} />
                    )}
                </div>

                {/* Overlay hover */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Camera className="w-5 h-5 text-white" />
                    )}
                </div>

                {/* Nút xóa */}
                {preview && !uploading && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors z-10"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />

            <p className="text-[11px] text-muted-foreground text-center">
                {uploading ? 'Đang tải lên...' : 'Nhấp để chọn ảnh'}
            </p>

            {error && (
                <p className="text-[11px] text-destructive text-center font-medium">{error}</p>
            )}
        </div>
    );
}
