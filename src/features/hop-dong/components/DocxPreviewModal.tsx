"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Loader2, FileText } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** Blob của file docx đã được render bởi docxtemplater */
    docxBlob: Blob | null;
    title?: string;
    subtitle?: string;
}

// CSS inject một lần
const PREVIEW_CSS = `
.docx-preview-wrap {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: flex; flex-direction: column;
    overflow: hidden;
}
.docx-preview-toolbar {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    background: #0f172a; color: #f1f5f9;
    padding: 10px 20px; gap: 12px;
    border-bottom: 1px solid #1e293b;
}
.docx-preview-body {
    flex: 1; overflow-y: auto;
    background: #1e293b;
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 16px 40px;
}
/* Override docx-preview styles */
.docx-preview-body .docx-wrapper {
    background: transparent !important;
    padding: 0 !important;
}
.docx-preview-body .docx-wrapper > section.docx {
    box-shadow: 0 8px 40px rgba(0,0,0,0.5) !important;
    margin: 8px auto !important;
}
.btn-docx-print {
    display: flex; align-items: center; gap: 6px;
    background: #16a34a; color: #fff;
    border: none; border-radius: 8px;
    padding: 8px 20px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
    white-space: nowrap;
}
.btn-docx-print:hover { background: #15803d; }
.btn-docx-print:disabled { background: #4b7a5e; cursor: not-allowed; }
.btn-docx-close {
    display: flex; align-items: center; gap: 4px;
    background: transparent; color: #94a3b8;
    border: 1px solid #334155; border-radius: 8px;
    padding: 8px 14px; font-size: 13px;
    cursor: pointer; transition: all 0.15s;
}
.btn-docx-close:hover { background: #1e293b; color: #f1f5f9; border-color: #64748b; }

@media print {
    body > * { display: none !important; }
    body > #docx-print-target {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
        background: #fff !important;
        overflow: visible !important;
        padding: 0 !important;
    }
    #docx-print-target .docx-wrapper {
        background: #fff !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    #docx-print-target section.docx {
        box-shadow: none !important;
        margin: 0 auto !important;
        break-after: page;
        page-break-after: always;
    }
    #docx-print-target section.docx:last-child {
        break-after: auto;
        page-break-after: auto;
    }
}
#docx-print-target { display: none; }
`;

export default function DocxPreviewModal({ isOpen, onClose, docxBlob, title, subtitle }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const printTargetRef = useRef<HTMLDivElement>(null);
    const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const styleInjected = useRef(false);

    // Inject CSS
    useEffect(() => {
        if (styleInjected.current) return;
        const el = document.createElement("style");
        el.id = "docx-preview-modal-styles";
        el.textContent = PREVIEW_CSS;
        document.head.appendChild(el);
        styleInjected.current = true;
    }, []);

    // Tạo node print target trực tiếp dưới body để CSS print ổn định
    useEffect(() => {
        if (typeof document === "undefined") return;
        setPrintRoot(document.body);
    }, []);

    // Ngăn body scroll khi mở
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // ESC để đóng
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Render docx vào container khi blob thay đổi
    useEffect(() => {
        if (!isOpen || !docxBlob || !containerRef.current) return;

        setLoading(true);
        setError(null);
        containerRef.current.innerHTML = "";
        if (printTargetRef.current) printTargetRef.current.innerHTML = "";

        // Dynamic import để tránh SSR issues
        import("docx-preview").then(({ renderAsync }) => {
            const previewOptions = {
                className: "docx-rendered",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                useBase64URL: true,
                renderChanges: false,
                renderHeaders: true,
                renderFooters: true,
                renderFootnotes: true,
                renderEndnotes: true,
                experimental: true,
            };
            const printOptions = {
                ...previewOptions,
                inWrapper: false,
            };

            // Render vào preview container
            Promise.all([
                renderAsync(docxBlob, containerRef.current!, undefined, previewOptions),
                printTargetRef.current
                    ? renderAsync(docxBlob.slice(0), printTargetRef.current!, undefined, printOptions)
                    : Promise.resolve(),
            ])
                .then(() => setLoading(false))
                .catch(err => {
                    console.error("docx-preview error:", err);
                    setError("Không thể hiển thị preview. Vui lòng thử lại.");
                    setLoading(false);
                });
        }).catch(() => {
            setError("Không thể tải thư viện preview.");
            setLoading(false);
        });
    }, [isOpen, docxBlob, printRoot]);

    const handlePrint = () => {
        const printTarget = document.getElementById("docx-print-target");
        if (!printTarget || loading || error) return;

        const cleanup = () => { printTarget.style.display = "none"; };
        printTarget.style.display = "block";
        window.addEventListener("afterprint", cleanup, { once: true });

        // Chờ đủ 2 frame để browser hoàn tất layout trước khi print
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Target riêng cho print đặt trực tiếp ở body để tránh bị parent ẩn khi in */}
            {printRoot
                ? createPortal(<div id="docx-print-target" ref={printTargetRef} />, printRoot)
                : null}

            {/* Overlay */}
            <div className="docx-preview-wrap" role="dialog" aria-modal="true">
                {/* Toolbar */}
                <div className="docx-preview-toolbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <FileText style={{ width: 20, height: 20, color: "#60a5fa", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {title || "Xem trước hợp đồng"}
                            </div>
                            {subtitle && (
                                <div style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <button
                            className="btn-docx-print"
                            onClick={handlePrint}
                            disabled={loading || !!error}
                            title="In hợp đồng"
                        >
                            <Printer style={{ width: 16, height: 16 }} />
                            In hợp đồng
                        </button>
                        <button className="btn-docx-close" onClick={onClose}>
                            <X style={{ width: 14, height: 14 }} />
                            Đóng
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="docx-preview-body" onClick={onClose}>
                    <div style={{ width: "100%", maxWidth: 900 }} onClick={e => e.stopPropagation()}>
                        {loading && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 0", color: "#94a3b8" }}>
                                <Loader2 style={{ width: 36, height: 36, animation: "spin 1s linear infinite" }} />
                                <span style={{ fontSize: 14 }}>Đang tải xem trước...</span>
                            </div>
                        )}
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                                <div style={{ background: "#7f1d1d", color: "#fca5a5", borderRadius: 12, padding: "20px 32px", maxWidth: 400, textAlign: "center" }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Lỗi hiển thị</div>
                                    <div style={{ fontSize: 13 }}>{error}</div>
                                </div>
                            </div>
                        )}
                        {/* docx-preview render target */}
                        <div
                            ref={containerRef}
                            style={{ display: loading || error ? "none" : "block" }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
