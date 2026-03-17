"use client"
import { useState, useRef } from 'react';
import { Camera, X, ImageIcon, Upload } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    folder?: string;
}

export default function ProductImageUpload({
    value,
    onChange,
    folder = 'pnsolar/hang-hoa',
}: ProductImageUploadProps) {
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
        <div className="space-y-2">
            <div
                className={cn(
                    "relative w-full h-40 border-2 border-dashed rounded-xl cursor-pointer group transition-all overflow-hidden",
                    preview ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/30"
                )}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <Image
                            src={preview}
                            alt="Hình sản phẩm"
                            fill
                            className="object-contain p-2"
                            unoptimized
                        />
                        {/* Overlay hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {uploading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2 text-white text-xs font-medium">
                                    <Camera className="w-4 h-4" />
                                    Đổi ảnh
                                </div>
                            )}
                        </div>
                        {/* Remove button */}
                        {!uploading && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        {uploading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-xs">Đang tải lên...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-muted-foreground/60" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">Nhấp để chọn hình ảnh</p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG, WEBP (tối đa 20MB)</p>
                                </div>
                            </>
                        )}
                    </div>
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

            {error && (
                <p className="text-[11px] text-destructive font-medium">{error}</p>
            )}
        </div>
    );
}
