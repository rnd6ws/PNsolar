"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Printer, X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** Blob của file docx đã được render bởi docxtemplater */
    docxBlob: Blob | null;
    title?: string;
    subtitle?: string;
    printButtonText?: string;
    fixedTableLayout?: boolean;
}

const PREVIEW_CSS = `
#docx-preview-modal-root {
    position: relative;
    z-index: 9999;
}
.docx-preview-wrap {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.docx-preview-toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    color: #f1f5f9;
    padding: 10px 20px;
    gap: 12px;
    border-bottom: 1px solid #1e293b;
}
.docx-preview-body {
    flex: 1;
    overflow: auto;
    background: #1e293b;
    display: flex;
    justify-content: center;
    padding: 24px 16px 40px;
}
.docx-preview-content {
    display: inline-block;
    min-width: fit-content;
}
.docx-preview-body .docx-wrapper {
    background: transparent !important;
    padding: 0 !important;
}
.docx-preview-body .docx-wrapper > section.docx {
    margin: 8px auto !important;
}
.docx-preview-body .docx-wrapper > section.docx:last-child {
    margin-bottom: 0 !important;
}
.btn-docx-print {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #16a34a;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
}
.btn-docx-print:hover {
    background: #15803d;
}
.btn-docx-print:disabled {
    background: #4b7a5e;
    cursor: not-allowed;
}
.btn-docx-close {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    color: #94a3b8;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}
.btn-docx-close:hover {
    background: #1e293b;
    color: #f1f5f9;
    border-color: #64748b;
}
.docx-preview-wrap.table-layout-fixed .docx-preview-body section.docx table {
    table-layout: fixed !important;
    border-collapse: collapse !important;
}
.docx-preview-wrap.table-layout-fixed .docx-preview-body section.docx tr,
.docx-preview-wrap.table-layout-fixed .docx-preview-body section.docx td,
.docx-preview-wrap.table-layout-fixed .docx-preview-body section.docx th {
    break-inside: avoid;
    page-break-inside: avoid;
}

@media print {
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
    }
    body {
        overflow: visible !important;
    }
    body > * {
        display: none !important;
    }
    body > #docx-preview-modal-root {
        display: block !important;
    }
    #docx-preview-modal-root {
        position: static !important;
    }
    #docx-preview-modal-root .docx-preview-wrap {
        position: static !important;
        inset: auto !important;
        display: block !important;
        background: #fff !important;
        backdrop-filter: none !important;
        overflow: visible !important;
    }
    #docx-preview-modal-root .docx-preview-toolbar {
        display: none !important;
    }
    #docx-preview-modal-root .docx-preview-body {
        display: block !important;
        overflow: visible !important;
        padding: 0 !important;
        background: #fff !important;
    }
    #docx-preview-modal-root .docx-preview-content {
        display: block !important;
        min-width: 0 !important;
    }
    #docx-preview-modal-root section.docx {
        margin: 0 auto !important;
        break-after: page;
        page-break-after: always;
    }
    #docx-preview-modal-root section.docx:last-child {
        break-after: auto;
        page-break-after: auto;
    }
}
`;

export default function DocxPreviewModal({
    isOpen,
    onClose,
    docxBlob,
    title,
    subtitle,
    printButtonText,
    fixedTableLayout = false,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const styleInjected = useRef(false);
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const printText = printButtonText || "In tài liệu";

    useEffect(() => {
        if (styleInjected.current || typeof document === "undefined") return;

        const existingStyle = document.getElementById("docx-preview-modal-styles");
        if (existingStyle) {
            styleInjected.current = true;
            return;
        }

        const el = document.createElement("style");
        el.id = "docx-preview-modal-styles";
        el.textContent = PREVIEW_CSS;
        document.head.appendChild(el);
        styleInjected.current = true;
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;
        setPortalRoot(document.body);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !docxBlob || !containerRef.current) return;

        let cancelled = false;
        const target = containerRef.current;

        setLoading(true);
        setError(null);
        target.innerHTML = "";

        import("docx-preview")
            .then(async ({ renderAsync }) => {
                await renderAsync(docxBlob, target, undefined, {
                    inWrapper: true,
                    hideWrapperOnPrint: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: false,
                    useBase64URL: true,
                    renderChanges: false,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                    experimental: true,
                });

                if (!cancelled) {
                    setLoading(false);
                }
            })
            .catch((renderError) => {
                if (cancelled) return;

                console.error("docx-preview error:", renderError);
                setError("Không thể hiển thị preview. Vui lòng thử lại.");
                setLoading(false);
            });

        return () => {
            cancelled = true;
            target.innerHTML = "";
        };
    }, [isOpen, docxBlob]);

    const handlePrint = () => {
        if (loading || error || !containerRef.current?.childElementCount) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div id="docx-preview-modal-root">
            <div
                className={`docx-preview-wrap ${fixedTableLayout ? "table-layout-fixed" : ""}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="docx-preview-toolbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <FileText style={{ width: 20, height: 20, color: "#60a5fa", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {title || "Xem trước tài liệu"}
                            </div>
                            {subtitle ? (
                                <div style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</div>
                            ) : null}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <button
                            className="btn-docx-print"
                            onClick={handlePrint}
                            disabled={loading || !!error}
                            title={printText}
                        >
                            <Printer style={{ width: 16, height: 16 }} />
                            {printText}
                        </button>
                        <button className="btn-docx-close" onClick={onClose}>
                            <X style={{ width: 14, height: 14 }} />
                            Đóng
                        </button>
                    </div>
                </div>

                <div className="docx-preview-body" onClick={onClose}>
                    <div className="docx-preview-content" onClick={(event) => event.stopPropagation()}>
                        {loading ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 12,
                                    padding: "80px 0",
                                    color: "#94a3b8",
                                }}
                            >
                                <Loader2 style={{ width: 36, height: 36, animation: "spin 1s linear infinite" }} />
                                <span style={{ fontSize: 14 }}>Đang tải xem trước...</span>
                            </div>
                        ) : null}

                        {error ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                                <div
                                    style={{
                                        background: "#7f1d1d",
                                        color: "#fca5a5",
                                        borderRadius: 12,
                                        padding: "20px 32px",
                                        maxWidth: 400,
                                        textAlign: "center",
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Lỗi hiển thị</div>
                                    <div style={{ fontSize: 13 }}>{error}</div>
                                </div>
                            </div>
                        ) : null}

                        <div
                            ref={containerRef}
                            style={{ display: loading || error ? "none" : "block" }}
                        />
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
}
