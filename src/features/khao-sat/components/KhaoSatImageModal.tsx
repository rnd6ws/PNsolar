"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/Modal";
import { Trash2, Camera, Loader2, Image as ImageIcon, GripVertical } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useMultipleFileUpload } from "@/hooks/useFileUpload";
import { updateKhaoSatImages } from "../action";

interface ImageItem {
    STT: number;
    TEN_HINH: string;
    URL_HINH: string;
}

interface UploadItem {
    id: string;
    file?: File;
    TEN_HINH: string;
    URL_HINH: string;
    isNew: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: { ID: string; MA_KHAO_SAT: string; HINH_ANH: ImageItem[] } | null;
}

export default function KhaoSatImageModal({ isOpen, onClose, item }: Props) {
    const [images, setImages] = useState<UploadItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Drag state
    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (item?.HINH_ANH) {
            setImages(
                item.HINH_ANH.map((img) => ({
                    id: Math.random().toString(36).substring(2),
                    TEN_HINH: img.TEN_HINH || "Anh-khong-ten",
                    URL_HINH: img.URL_HINH,
                    isNew: false,
                }))
            );
        }
    }, [item]);

    const { uploadMultiple, uploading } = useMultipleFileUpload({ folder: "pnsolar/khao-sat", type: "image", onError: (msg) => toast.error(msg) });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        const filesArray = Array.from(fileList);

        setImages((prev) => {
            const existingNames = new Set(prev.map((img) => (img.TEN_HINH || "").toLowerCase()));

            const newItems: UploadItem[] = filesArray.map((file) => {
                const baseName = file.name.split(".").slice(0, -1).join(".") || file.name;
                let finalName = baseName;
                let counter = 1;

                while (existingNames.has(finalName.toLowerCase())) {
                    finalName = `${baseName} (${counter})`;
                    counter++;
                }
                existingNames.add(finalName.toLowerCase());

                return {
                    id: Math.random().toString(36).substring(2),
                    file: file,
                    TEN_HINH: finalName,
                    URL_HINH: URL.createObjectURL(file),
                    isNew: true,
                };
            });

            return [...prev, ...newItems];
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleNameChange = (id: string, newName: string) => {
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, TEN_HINH: newName } : img)));
    };

    const handleRemove = (id: string) => {
        const removedItem = images.find(img => img.id === id);
        if (removedItem?.isNew) URL.revokeObjectURL(removedItem.URL_HINH);
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    // ── Drag & Drop ──────────────────────────────
    const handleDragStart = (index: number) => {
        dragIndexRef.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = dragIndexRef.current;
        if (dragIndex === null || dragIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }
        setImages((prev) => {
            const updated = [...prev];
            const [dragged] = updated.splice(dragIndex, 1);
            updated.splice(dropIndex, 0, dragged);
            return updated;
        });
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };
    // ─────────────────────────────────────────────

    const handleSave = async () => {
        if (!item) return;
        setIsSaving(true);
        try {
            const newImageItems = images.filter((img) => img.isNew && img.file);
            const itemsToUpload = newImageItems.map((img) => ({
                file: img.file as File,
                customName: `${(img.TEN_HINH || "Anh").replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            }));

            const uploadedFiles = itemsToUpload.length > 0 ? await uploadMultiple(itemsToUpload) : [];

            let uploadIndex = 0;
            const finalImages: ImageItem[] = images.map((img, idx) => {
                if (img.isNew && img.file) {
                    const uploadedData = uploadedFiles[uploadIndex++];
                    if (!uploadedData) throw new Error(`Xảy ra lỗi map ảnh với máy chủ: ${img.TEN_HINH}`);
                    return { STT: idx + 1, TEN_HINH: img.TEN_HINH, URL_HINH: uploadedData.url };
                } else {
                    return { STT: idx + 1, TEN_HINH: img.TEN_HINH, URL_HINH: img.URL_HINH };
                }
            });

            const res = await updateKhaoSatImages(item.ID, finalImages);
            if (res.success) {
                toast.success("Đã lưu danh sách ảnh khảo sát");
                onClose();
            } else {
                throw new Error(res.message);
            }
        } catch (e: any) {
            toast.error(e.message || "Đã xảy ra lỗi khi lưu ảnh");
        } finally {
            setIsSaving(false);
        }
    };

    if (!item) return null;

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                disabled={isSaving || uploading}
            >
                Hủy
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving || uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
                {(isSaving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Đang tải ảnh lên..." : isSaving ? "Đang lưu..." : "Lưu danh sách ảnh"}
            </button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ảnh khảo sát ${item.MA_KHAO_SAT}`} size="lg" footer={footer}>
            <div className="space-y-4">

                {/* Upload Zone */}
                <div
                    onClick={() => !(isSaving || uploading) && fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer py-6 px-4 ${isSaving || uploading
                        ? "border-primary/20 bg-primary/5 pointer-events-none"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                        }`}
                >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Nhấp vào đây để thêm ảnh</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Hỗ trợ chọn nhiều ảnh (JPG, PNG, WebP)</p>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSaving || uploading}
                />

                {/* Danh sách ảnh */}
                {images.length > 0 ? (
                    <>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <GripVertical className="w-3 h-3" />
                            Kéo thả để thay đổi thứ tự ảnh
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    draggable={!isSaving && !uploading}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex flex-col gap-2 p-2 border rounded-xl bg-muted/10 transition-all select-none ${dragOverIndex === index && dragIndexRef.current !== index
                                        ? "border-primary border-2 scale-[1.02] bg-primary/5 shadow-md"
                                        : "border-border"
                                        } ${!isSaving && !uploading ? "cursor-grab active:cursor-grabbing" : ""}`}
                                >
                                    <div className="relative group rounded-lg overflow-hidden aspect-video bg-muted/30 border border-border">
                                        <Image
                                            src={img.URL_HINH}
                                            alt={img.TEN_HINH || "Ảnh"}
                                            fill
                                            className="object-cover pointer-events-none"
                                            unoptimized
                                        />

                                        {/* Số thứ tự */}
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                            {index + 1}
                                        </div>

                                        {/* Badge ảnh mới */}
                                        {img.isNew && (
                                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold tracking-wider shadow">
                                                MỚI
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <GripVertical className="w-5 h-5 text-white/70" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRemove(img.id); }}
                                                className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors"
                                                title="Xóa ảnh"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-1 pb-1">
                                        <input
                                            type="text"
                                            value={img.TEN_HINH}
                                            onChange={(e) => handleNameChange(img.id, e.target.value)}
                                            placeholder="Nhập tên ảnh..."
                                            disabled={isSaving || uploading}
                                            className="w-full text-xs box-border px-2 py-1.5 rounded-md border text-foreground bg-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/5">
                        <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
                        <span className="text-sm">Chưa có ảnh nào được thêm.</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
