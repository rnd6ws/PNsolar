"use client"
import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, FileSpreadsheet, File, CheckCircle2, Loader2, ImageIcon } from 'lucide-react';
import { useFileUpload, formatFileSize, getFileTypeIcon, type UploadType, type UploadedFile } from '@/hooks/useFileUpload';
import Image from 'next/image';

interface FileUploadProps {
    /** Folder trong Cloudinary */
    folder?: string;
    /** Loại file chấp nhận */
    type?: UploadType;
    /** Callback khi upload xong */
    onChange?: (file: UploadedFile | null) => void;
    /** File hiện tại (khi edit) */
    value?: UploadedFile | null;
    /** Placeholder text */
    placeholder?: string;
    /** Cho phép clear file */
    clearable?: boolean;
    /** Custom accept string, vd: '.pdf,.xlsx' */
    accept?: string;
    /** Hiển thị compact */
    compact?: boolean;
}

const ACCEPT_MAP: Record<UploadType, string> = {
    image: 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
    document: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
    any: '*',
};

const TypeIcon = ({ format, className = '' }: { format: string; className?: string }) => {
    const t = getFileTypeIcon(format);
    if (t === 'pdf') return <FileText className={`text-red-500 ${className}`} />;
    if (t === 'excel') return <FileSpreadsheet className={`text-emerald-600 ${className}`} />;
    if (t === 'word') return <FileText className={`text-blue-600 ${className}`} />;
    if (t === 'image') return <ImageIcon className={`text-purple-500 ${className}`} />;
    return <File className={`text-slate-500 ${className}`} />;
};

export default function FileUpload({
    folder = 'pnsolar/uploads',
    type = 'any',
    onChange,
    value,
    placeholder,
    clearable = true,
    accept,
    compact = false,
}: FileUploadProps) {
    const [dragging, setDragging] = useState(false);
    const [currentFile, setCurrentFile] = useState<UploadedFile | null>(value ?? null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { upload, uploading, error, progress } = useFileUpload({
        folder,
        type,
        onSuccess: (f) => {
            setCurrentFile(f);
            onChange?.(f);
        },
        onError: () => {
            // error state is handled in hook
        },
    });

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        await upload(files[0]);
        if (inputRef.current) inputRef.current.value = '';
    }, [upload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentFile(null);
        onChange?.(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const acceptValue = accept ?? ACCEPT_MAP[type];
    const defaultPlaceholder = type === 'image'
        ? 'Kéo thả ảnh hoặc nhấp để chọn'
        : type === 'document'
            ? 'Kéo thả file (PDF, Word, Excel) hoặc nhấp để chọn'
            : 'Kéo thả file hoặc nhấp để chọn';

    // === Compact mode (inline, không có drop zone lớn) ===
    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptValue}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={uploading}
                />
                {currentFile ? (
                    <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg border border-border bg-muted/30">
                        <TypeIcon format={currentFile.format} className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate flex-1 text-foreground">{currentFile.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(currentFile.bytes)}</span>
                        {clearable && (
                            <button type="button" onClick={handleClear} className="p-0.5 hover:text-destructive text-muted-foreground transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors flex-1"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? `Đang tải... ${progress}%` : (placeholder ?? 'Tải file lên')}
                    </button>
                )}
            </div>
        );
    }

    // === Full drop zone ===
    return (
        <div className="space-y-2">
            <input
                ref={inputRef}
                type="file"
                accept={acceptValue}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
            />

            {/* Uploaded file preview */}
            {currentFile && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                    {/* Image preview */}
                    {getFileTypeIcon(currentFile.format) === 'image' ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            <Image src={currentFile.url} alt={currentFile.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <TypeIcon format={currentFile.format} className="w-6 h-6" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{currentFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(currentFile.bytes)} · {currentFile.format.toUpperCase()}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {clearable && (
                        <button type="button" onClick={handleClear} className="p-1 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Drop zone */}
            {!currentFile && (
                <div
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={[
                        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer py-8 px-4',
                        dragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30',
                        uploading ? 'cursor-wait pointer-events-none' : '',
                    ].join(' ')}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm font-medium text-foreground">Đang tải lên... {progress}%</p>
                            {/* Progress bar */}
                            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">{placeholder ?? defaultPlaceholder}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {type === 'image' ? 'JPG, PNG, WebP, GIF · Tối đa 20MB' :
                                        type === 'document' ? 'PDF, Word, Excel, CSV · Tối đa 20MB' :
                                            'Tối đa 20MB'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Show change button when file exists */}
            {currentFile && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="w-full text-xs text-muted-foreground hover:text-primary py-1 transition-colors"
                >
                    Chọn file khác
                </button>
            )}

            {/* Error */}
            {error && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <X className="w-3 h-3" /> {error}
                </p>
            )}
        </div>
    );
}
