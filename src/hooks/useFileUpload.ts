import { useState, useCallback } from 'react';

export type UploadType = 'image' | 'document' | 'any';

export interface UploadedFile {
    url: string;
    public_id: string;
    format: string;
    bytes: number;
    resource_type: string;
    original_filename?: string;
    /** Tên hiển thị (original_filename hoặc lấy từ URL) */
    name: string;
}

export interface UseFileUploadOptions {
    /** Folder trong Cloudinary, vd: 'pnsolar/hop-dong' */
    folder?: string;
    /** Loại file: 'image' | 'document' | 'any' */
    type?: UploadType;
    /** Callback khi upload thành công */
    onSuccess?: (file: UploadedFile) => void;
    /** Callback khi upload thất bại */
    onError?: (message: string) => void;
}

export function useFileUpload({
    folder = 'pnsolar/uploads',
    type = 'any',
    onSuccess,
    onError,
}: UseFileUploadOptions = {}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const upload = useCallback(async (file: File): Promise<UploadedFile | null> => {
        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);
            formData.append('type', type);

            setProgress(30);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            setProgress(80);

            const data = await res.json();

            if (!res.ok || !data.success) {
                const msg = data.message || 'Upload thất bại';
                setError(msg);
                onError?.(msg);
                return null;
            }

            const uploaded: UploadedFile = {
                url: data.url,
                public_id: data.public_id,
                format: data.format,
                bytes: data.bytes,
                resource_type: data.resource_type,
                original_filename: data.original_filename,
                name: data.original_filename || file.name,
            };

            setProgress(100);
            onSuccess?.(uploaded);
            return uploaded;

        } catch (err: any) {
            const msg = 'Lỗi kết nối, vui lòng thử lại';
            setError(msg);
            onError?.(msg);
            return null;
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 600);
        }
    }, [folder, type, onSuccess, onError]);

    const reset = useCallback(() => {
        setError(null);
        setProgress(0);
    }, []);

    return { upload, uploading, error, progress, reset };
}

/**
 * Format bytes thành chuỗi dễ đọc
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lấy icon name dựa trên format/extension
 */
export function getFileTypeIcon(format: string): 'pdf' | 'excel' | 'word' | 'image' | 'file' {
    const f = format.toLowerCase();
    if (['pdf'].includes(f)) return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(f)) return 'excel';
    if (['doc', 'docx'].includes(f)) return 'word';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(f)) return 'image';
    return 'file';
}
