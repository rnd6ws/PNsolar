"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Printer, X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    docxBlob: Blob | null;
    title?: string;
    subtitle?: string;
    printButtonText?: string;
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
    min-height: 0;
    overflow: hidden;
    background: #1e293b;
}
.docx-preview-content {
    position: relative;
    width: 100%;
    height: 100%;
}
.docx-preview-frame {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
    background: #1e293b;
}
.docx-preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
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
`;

const IFRAME_CSS = `
html, body {
    margin: 0;
    padding: 0;
    background: #1e293b;
}
body {
    overflow: auto;
}
#docx-preview-frame-shell {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 24px 16px 40px;
    display: flex;
    justify-content: center;
}
#docx-preview-frame-root {
    display: inline-block;
    min-width: fit-content;
}
#docx-preview-frame-root .docx-wrapper {
    background: transparent !important;
    padding: 0 !important;
}
#docx-preview-frame-root .docx-wrapper > section.docx {
    margin: 8px auto !important;
}
#docx-preview-frame-root .docx-wrapper > section.docx:last-child {
    margin-bottom: 0 !important;
}
#docx-preview-frame-root table td,
#docx-preview-frame-root table th {
    overflow-wrap: break-word;
    word-break: normal;
}
#docx-preview-frame-root table td span,
#docx-preview-frame-root table th span {
    overflow-wrap: anywhere !important;
    word-break: normal !important;
}
@media print {
    html, body {
        background: #fff !important;
    }
    body {
        overflow: visible !important;
    }
    #docx-preview-frame-shell {
        display: block !important;
        min-height: 0 !important;
        padding: 0 !important;
        background: #fff !important;
    }
    #docx-preview-frame-root {
        display: block !important;
        min-width: 0 !important;
    }
    #docx-preview-frame-root section.docx {
        margin: 0 auto !important;
        break-after: page;
        page-break-after: always;
    }
    #docx-preview-frame-root section.docx:last-child {
        break-after: auto;
        page-break-after: auto;
    }
}
`;

const IFRAME_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <style>${IFRAME_CSS}</style>
</head>
<body>
    <div id="docx-preview-frame-shell">
        <div id="docx-preview-frame-root"></div>
    </div>
</body>
</html>`;

type TableRenderHint = {
    hasFloatingPosition: boolean;
    isFixedLayout: boolean;
    widthTwip: number | null;
    positionXTwip: number | null;
    gridWidthsTwip: number[];
};

type PageRenderHint = {
    pageWidthTwip: number | null;
    pageHeightTwip: number | null;
    marginTopTwip: number | null;
    marginRightTwip: number | null;
    marginBottomTwip: number | null;
    marginLeftTwip: number | null;
    pageNumberStart: number;
    hasPageNumberField: boolean;
};

type ParagraphTabStopHint = {
    positionTwip: number | null;
    leader: string | null;
    style: string | null;
};

function getWordAttr(element: Element | null, name: string): string | null {
    if (!element) return null;
    return element.getAttribute(`w:${name}`) ?? element.getAttribute(name);
}

function parseTwip(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function twipToPt(value: number): string {
    return `${value / 20}pt`;
}

async function extractTableHints(docxBlob: Blob): Promise<TableRenderHint[]> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml || typeof DOMParser === "undefined") return [];

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const body = xml.getElementsByTagNameNS(wordNamespace, "body")[0];
    if (!body) return [];

    return Array.from(body.getElementsByTagNameNS(wordNamespace, "tbl")).map((tableNode) => {
        const tableProperties = tableNode.getElementsByTagNameNS(wordNamespace, "tblPr")[0] ?? null;
        const tablePosition = tableProperties?.getElementsByTagNameNS(wordNamespace, "tblpPr")[0] ?? null;
        const tableLayout = tableProperties?.getElementsByTagNameNS(wordNamespace, "tblLayout")[0] ?? null;
        const tableWidth = tableProperties?.getElementsByTagNameNS(wordNamespace, "tblW")[0] ?? null;
        const tableGrid = tableNode.getElementsByTagNameNS(wordNamespace, "tblGrid")[0] ?? null;
        const gridColumns = tableGrid
            ? Array.from(tableGrid.getElementsByTagNameNS(wordNamespace, "gridCol"))
            : [];

        return {
            hasFloatingPosition: !!tablePosition,
            isFixedLayout: getWordAttr(tableLayout, "type") === "fixed",
            widthTwip: parseTwip(getWordAttr(tableWidth, "w")),
            positionXTwip: parseTwip(getWordAttr(tablePosition, "tblpX")),
            gridWidthsTwip: gridColumns
                .map((column) => parseTwip(getWordAttr(column, "w")))
                .filter((width): width is number => width != null),
        };
    });
}

async function extractPageHints(docxBlob: Blob): Promise<PageRenderHint[]> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml || typeof DOMParser === "undefined") return [];

    const footerEntries = zip.file(/word\/footer\d+\.xml/) ?? [];
    const hasPageNumberField = footerEntries.some((entry) => {
        const content = entry.asText();
        return content.includes("PAGE");
    });

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const sectionNodes = Array.from(xml.getElementsByTagNameNS(wordNamespace, "sectPr"));

    return sectionNodes.map((sectionNode) => {
        const pageSize = sectionNode.getElementsByTagNameNS(wordNamespace, "pgSz")[0] ?? null;
        const pageMargins = sectionNode.getElementsByTagNameNS(wordNamespace, "pgMar")[0] ?? null;
        const pageNumberType = sectionNode.getElementsByTagNameNS(wordNamespace, "pgNumType")[0] ?? null;

        return {
            pageWidthTwip: parseTwip(getWordAttr(pageSize, "w")),
            pageHeightTwip: parseTwip(getWordAttr(pageSize, "h")),
            marginTopTwip: parseTwip(getWordAttr(pageMargins, "top")),
            marginRightTwip: parseTwip(getWordAttr(pageMargins, "right")),
            marginBottomTwip: parseTwip(getWordAttr(pageMargins, "bottom")),
            marginLeftTwip: parseTwip(getWordAttr(pageMargins, "left")),
            pageNumberStart: parseTwip(getWordAttr(pageNumberType, "start")) ?? 1,
            hasPageNumberField,
        };
    });
}

async function extractParagraphTabHints(docxBlob: Blob): Promise<ParagraphTabStopHint[][]> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml || typeof DOMParser === "undefined") return [];

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const body = xml.getElementsByTagNameNS(wordNamespace, "body")[0];
    if (!body) return [];

    return Array.from(body.getElementsByTagNameNS(wordNamespace, "p")).map((paragraphNode) => {
        const paragraphProperties = paragraphNode.getElementsByTagNameNS(wordNamespace, "pPr")[0] ?? null;
        const tabsNode = paragraphProperties?.getElementsByTagNameNS(wordNamespace, "tabs")[0] ?? null;
        const tabNodes = tabsNode ? Array.from(tabsNode.getElementsByTagNameNS(wordNamespace, "tab")) : [];

        return tabNodes.map((tabNode) => ({
            positionTwip: parseTwip(getWordAttr(tabNode, "pos")),
            leader: getWordAttr(tabNode, "leader"),
            style: getWordAttr(tabNode, "val"),
        }));
    });
}

function applyTableHints(iframeDocument: Document, tableHints: TableRenderHint[]) {
    const renderedTables = Array.from(
        iframeDocument.querySelectorAll<HTMLTableElement>("#docx-preview-frame-root section.docx article table")
    );

    renderedTables.forEach((table, index) => {
        const hint = tableHints[index];
        if (!hint) return;

        if (hint.isFixedLayout) {
            table.style.setProperty("table-layout", "fixed");
        }

        if (hint.widthTwip != null) {
            table.style.setProperty("width", twipToPt(hint.widthTwip));
        }

        const renderedColumns = table.querySelectorAll<HTMLTableColElement>("colgroup > col");
        hint.gridWidthsTwip.forEach((width, columnIndex) => {
            renderedColumns[columnIndex]?.style.setProperty("width", twipToPt(width));
        });

        if (!hint.hasFloatingPosition) return;

        table.style.setProperty("float", "none");
        table.style.setProperty("display", "table");
        table.style.removeProperty("margin-right");

        if (hint.positionXTwip != null) {
            table.style.setProperty("position", "relative");
            table.style.setProperty("left", twipToPt(hint.positionXTwip));
            table.style.removeProperty("margin-left");
        }
    });
}

function applyPageHints(iframeDocument: Document, pageHints: PageRenderHint[]) {
    if (pageHints.length === 0) return;

    const renderedPages = Array.from(
        iframeDocument.querySelectorAll<HTMLElement>("#docx-preview-frame-root section.docx")
    );
    if (renderedPages.length === 0) return;

    const primaryPageHint = pageHints[0];

    if (primaryPageHint.pageWidthTwip != null && primaryPageHint.pageHeightTwip != null) {
        const pageStyle = iframeDocument.createElement("style");
        pageStyle.textContent = `@page { size: ${twipToPt(primaryPageHint.pageWidthTwip)} ${twipToPt(primaryPageHint.pageHeightTwip)}; margin: 0; }`;
        iframeDocument.head.appendChild(pageStyle);
    }

    renderedPages.forEach((page, index) => {
        const hint = pageHints[Math.min(index, pageHints.length - 1)] ?? primaryPageHint;

        if (hint.pageWidthTwip != null) {
            page.style.setProperty("width", twipToPt(hint.pageWidthTwip));
        }

        if (hint.pageHeightTwip != null) {
            page.style.setProperty("min-height", twipToPt(hint.pageHeightTwip));
            page.style.setProperty("height", twipToPt(hint.pageHeightTwip));
        }

        if (hint.marginTopTwip != null) {
            page.style.setProperty("padding-top", twipToPt(hint.marginTopTwip));
        }

        if (hint.marginRightTwip != null) {
            page.style.setProperty("padding-right", twipToPt(hint.marginRightTwip));
        }

        if (hint.marginBottomTwip != null) {
            page.style.setProperty("padding-bottom", twipToPt(hint.marginBottomTwip));
        }

        if (hint.marginLeftTwip != null) {
            page.style.setProperty("padding-left", twipToPt(hint.marginLeftTwip));
        }

        if (!hint.hasPageNumberField) return;

        const footer = page.querySelector<HTMLElement>(":scope > footer");
        if (!footer) return;

        const numberTargets = Array.from(footer.querySelectorAll<HTMLElement>("p, span"))
            .filter((element) => /^\d+$/.test((element.textContent || "").trim()));
        const target = numberTargets[numberTargets.length - 1];
        if (!target) return;

        target.textContent = String(hint.pageNumberStart + index);
    });
}

function recalculateTabStop(tabSpan: HTMLElement, tabStops: ParagraphTabStopHint[]) {
    if (tabStops.length === 0) return;

    const paragraph = tabSpan.closest("p");
    if (!paragraph) return;

    const paragraphRect = paragraph.getBoundingClientRect();
    const tabRect = tabSpan.getBoundingClientRect();
    const paragraphStyles = getComputedStyle(paragraph);
    const marginLeft = Number.parseFloat(paragraphStyles.marginLeft || "0") || 0;
    const paragraphOffsetLeft = paragraphRect.left + marginLeft;
    const currentLeftPt = (tabRect.left - paragraphOffsetLeft) * (72 / 96);
    const nextStop = tabStops
        .map((tabStop) => ({
            positionPt: tabStop.positionTwip != null ? tabStop.positionTwip / 20 : null,
            leader: tabStop.leader,
            style: tabStop.style,
        }))
        .filter((tabStop): tabStop is { positionPt: number; leader: string | null; style: string | null } => tabStop.positionPt != null)
        .sort((left, right) => left.positionPt - right.positionPt)
        .find((tabStop) => tabStop.style !== "clear" && tabStop.positionPt > currentLeftPt);

    if (!nextStop) return;

    const allTabSpans = Array.from(paragraph.querySelectorAll<HTMLElement>(".docx-tab-stop"));
    const nextTabIndex = allTabSpans.indexOf(tabSpan) + 1;
    const range = paragraph.ownerDocument.createRange();
    range.setStart(tabSpan, 0);

    if (nextTabIndex < allTabSpans.length) {
        range.setEndBefore(allTabSpans[nextTabIndex]);
    } else {
        range.setEndAfter(paragraph);
    }

    const trailingRect = range.getBoundingClientRect();
    let targetWidthPt = nextStop.positionPt - currentLeftPt;

    if (nextStop.style === "right" || nextStop.style === "center") {
        const multiplier = nextStop.style === "center" ? 0.5 : 1;
        const offsetPt = (trailingRect.left + trailingRect.width * multiplier - paragraphOffsetLeft) * (72 / 96);
        targetWidthPt = nextStop.positionPt - offsetPt;
    }

    tabSpan.innerHTML = "&nbsp;";
    tabSpan.style.wordSpacing = `${Math.max(targetWidthPt, 1).toFixed(0)}pt`;
    tabSpan.style.textDecoration = "inherit";
    tabSpan.style.display = "inline";

    if (nextStop.leader === "dot" || nextStop.leader === "middleDot") {
        tabSpan.style.textDecoration = "underline";
        tabSpan.style.textDecorationStyle = "dotted";
    } else if (nextStop.leader === "hyphen" || nextStop.leader === "heavy" || nextStop.leader === "underscore") {
        tabSpan.style.textDecoration = "underline";
        tabSpan.style.textDecorationStyle = "solid";
    }
}

function applyParagraphTabHints(iframeDocument: Document, paragraphTabHints: ParagraphTabStopHint[][]) {
    const renderedParagraphs = Array.from(
        iframeDocument.querySelectorAll<HTMLParagraphElement>("#docx-preview-frame-root section.docx article p")
    );

    renderedParagraphs.forEach((paragraph, index) => {
        const tabHints = paragraphTabHints[index];
        if (!tabHints || tabHints.length === 0) return;

        const tabSpans = Array.from(paragraph.querySelectorAll<HTMLElement>(".docx-tab-stop"));
        tabSpans.forEach((tabSpan) => recalculateTabStop(tabSpan, tabHints));
    });
}

export default function DocxPreviewModal({
    isOpen,
    onClose,
    docxBlob,
    title,
    subtitle,
    printButtonText,
}: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const styleInjected = useRef(false);
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewReady, setPreviewReady] = useState(false);
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
        if (!isOpen || !docxBlob || !iframeRef.current) return;

        let cancelled = false;
        const iframe = iframeRef.current;
        const iframeDocument = iframe.contentDocument;

        if (!iframeDocument) {
            setError("Không thể khởi tạo vùng xem trước.");
            setLoading(false);
            setPreviewReady(false);
            return;
        }

        setLoading(true);
        setError(null);
        setPreviewReady(false);

        iframeDocument.open();
        iframeDocument.write(IFRAME_HTML);
        iframeDocument.close();

        const target = iframeDocument.getElementById("docx-preview-frame-root");
        if (!target) {
            setError("Không thể khởi tạo vùng xem trước.");
            setLoading(false);
            return;
        }

        Promise.all([
            import("docx-preview"),
            extractTableHints(docxBlob),
            extractPageHints(docxBlob),
            extractParagraphTabHints(docxBlob),
        ])
            .then(async ([{ renderAsync }, tableHints, pageHints, paragraphTabHints]) => {
                await renderAsync(docxBlob, target as HTMLElement, undefined, {
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

                applyPageHints(iframeDocument, pageHints);
                applyParagraphTabHints(iframeDocument, paragraphTabHints);
                applyTableHints(iframeDocument, tableHints);

                if (!cancelled) {
                    setPreviewReady(true);
                    setLoading(false);
                }
            })
            .catch((renderError) => {
                if (cancelled) return;

                console.error("docx-preview error:", renderError);
                setError("Không thể hiển thị preview. Vui lòng thử lại.");
                setLoading(false);
                setPreviewReady(false);
            });

        return () => {
            cancelled = true;
            setPreviewReady(false);

            const cleanupDocument = iframe.contentDocument;
            if (!cleanupDocument) return;

            cleanupDocument.open();
            cleanupDocument.write(IFRAME_HTML);
            cleanupDocument.close();
        };
    }, [isOpen, docxBlob]);

    const handlePrint = () => {
        if (loading || error || !previewReady) return;

        const printWindow = iframeRef.current?.contentWindow;
        if (!printWindow) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                printWindow.focus();
                printWindow.print();
            });
        });
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div id="docx-preview-modal-root">
            <div className="docx-preview-wrap" role="dialog" aria-modal="true">
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
                            disabled={loading || !!error || !previewReady}
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
                        <iframe
                            ref={iframeRef}
                            className="docx-preview-frame"
                            title={title || "Xem trước DOCX"}
                            style={{ visibility: loading || !!error ? "hidden" : "visible" }}
                        />

                        {loading ? (
                            <div className="docx-preview-overlay">
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
                            </div>
                        ) : null}

                        {error ? (
                            <div className="docx-preview-overlay">
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
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
}
