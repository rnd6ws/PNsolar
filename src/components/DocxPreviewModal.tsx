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
#docx-preview-frame-root section.docx {
    overflow: visible !important;
}
#docx-preview-frame-root section.docx table td,
#docx-preview-frame-root section.docx table th {
    box-sizing: border-box;
    overflow-wrap: break-word;
    word-break: normal;
}
#docx-preview-frame-root section.docx table td span,
#docx-preview-frame-root section.docx table th span {
    overflow-wrap: break-word;
    word-break: normal;
}
@media print {
    @page {
        size: A4;
        margin: 0;
    }
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
        overflow: hidden !important;
        break-after: page;
        page-break-after: always;
        box-shadow: none !important;
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

type ParagraphTabStopHint = {
    positionTwip: number | null;
    leader: string | null;
    style: string | null;
};

type TableRenderHint = {
    isFixedLayout: boolean;
    widthTwip: number | null;
    gridWidthsTwip: number[];
    positionXTwip: number | null;
};

type ParagraphStyleTabHint = {
    basedOnStyleId: string | null;
    tabStops: ParagraphTabStopHint[] | null;
};

const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const DEFAULT_TAB_STOP_TWIP = 720;
const MAX_TAB_STOPS = 50;
const TAB_TAIL_CLASS = "docx-tab-tail";

function getWordAttr(element: Element | null, name: string): string | null {
    if (!element) return null;
    return element.getAttribute(`w:${name}`) ?? element.getAttribute(name);
}

function getDirectWordChildren(element: Element | null, localName: string): Element[] {
    if (!element) return [];

    return Array.from(element.children).filter(
        (child) => child.namespaceURI === WORD_NAMESPACE && child.localName === localName
    );
}

function getDirectWordChild(element: Element | null, localName: string): Element | null {
    return getDirectWordChildren(element, localName)[0] ?? null;
}

function parseTwip(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function twipToPt(value: number): string {
    return `${value / 20}pt`;
}

function findWordAncestor(node: Node | null, localName: string): Element | null {
    let current = node?.parentNode ?? null;

    while (current) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            const element = current as Element;
            if (element.namespaceURI === WORD_NAMESPACE && element.localName === localName) {
                return element;
            }
        }

        current = current.parentNode;
    }

    return null;
}

function getWordTextContent(element: Element | null): string {
    if (!element) return "";

    return Array.from(element.getElementsByTagNameNS(WORD_NAMESPACE, "t"))
        .map((textNode) => textNode.textContent ?? "")
        .join("");
}

function paragraphHasTabCharacter(paragraphNode: Element): boolean {
    const tabNodes = Array.from(paragraphNode.getElementsByTagNameNS(WORD_NAMESPACE, "tab"));
    return tabNodes.some((tabNode) => findWordAncestor(tabNode, "r") != null);
}

function computePixelToPoint(iframeDocument: Document): number {
    const container = iframeDocument.body ?? iframeDocument.documentElement;
    if (!container) return 72 / 96;

    const temp = iframeDocument.createElement("div");
    temp.style.width = "100pt";
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.pointerEvents = "none";
    container.appendChild(temp);

    const measuredWidth = temp.offsetWidth;
    temp.remove();

    return measuredWidth > 0 ? 100 / measuredWidth : 72 / 96;
}

function waitForNextFrame(targetWindow: Window | null | undefined): Promise<void> {
    return new Promise((resolve) => {
        const schedule = targetWindow?.requestAnimationFrame?.bind(targetWindow) ?? requestAnimationFrame;
        schedule(() => resolve());
    });
}

function waitForTimeout(targetWindow: Window | null | undefined, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
        const schedule = targetWindow?.setTimeout?.bind(targetWindow) ?? window.setTimeout.bind(window);
        schedule(() => resolve(), timeoutMs);
    });
}

async function waitForStableFrameLayout(iframeDocument: Document, settleMs = 0): Promise<void> {
    const targetWindow = iframeDocument.defaultView;
    const fontFaceSet = (iframeDocument as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;

    try {
        await fontFaceSet?.ready;
    } catch {
        // Ignore font loading issues and continue with the best available layout.
    }

    if (settleMs > 0) {
        await waitForTimeout(targetWindow, settleMs);
    }

    await waitForNextFrame(targetWindow);
    await waitForNextFrame(targetWindow);
}

async function normalizePreviewDocxBlob(docxBlob: Blob): Promise<Blob> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentEntry = zip.file("word/document.xml");
    const documentXml = documentEntry?.asText();

    if (!documentXml || typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
        return docxBlob;
    }

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const pageBreakNodes = Array.from(xml.getElementsByTagNameNS(WORD_NAMESPACE, "lastRenderedPageBreak"));
    let changed = false;

    pageBreakNodes.forEach((pageBreakNode) => {
        const isInsideTable = findWordAncestor(pageBreakNode, "tbl") != null;
        const runNode = findWordAncestor(pageBreakNode, "r");

        if (!isInsideTable || !runNode) {
            return;
        }

        if (getWordTextContent(runNode).trim().length !== 0) {
            return;
        }

        pageBreakNode.parentNode?.removeChild(pageBreakNode);
        changed = true;
    });

    if (!changed) {
        return docxBlob;
    }

    zip.file("word/document.xml", new XMLSerializer().serializeToString(xml));

    return zip.generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) as Blob;
}

async function extractTableHints(docxBlob: Blob): Promise<TableRenderHint[]> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();

    if (!documentXml || typeof DOMParser === "undefined") {
        return [];
    }

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const body = xml.getElementsByTagNameNS(WORD_NAMESPACE, "body")[0];
    if (!body) {
        return [];
    }

    return Array.from(body.getElementsByTagNameNS(WORD_NAMESPACE, "tbl")).map((tableNode) => {
        const tableProperties = tableNode.getElementsByTagNameNS(WORD_NAMESPACE, "tblPr")[0] ?? null;
        const tableLayout = tableProperties?.getElementsByTagNameNS(WORD_NAMESPACE, "tblLayout")[0] ?? null;
        const tableWidth = tableProperties?.getElementsByTagNameNS(WORD_NAMESPACE, "tblW")[0] ?? null;
        const tablePosition = tableProperties?.getElementsByTagNameNS(WORD_NAMESPACE, "tblpPr")[0] ?? null;
        const tableGrid = tableNode.getElementsByTagNameNS(WORD_NAMESPACE, "tblGrid")[0] ?? null;
        const gridColumns = tableGrid
            ? Array.from(tableGrid.getElementsByTagNameNS(WORD_NAMESPACE, "gridCol"))
            : [];

        return {
            isFixedLayout: getWordAttr(tableLayout, "type") === "fixed",
            widthTwip: parseTwip(getWordAttr(tableWidth, "w")),
            positionXTwip: parseTwip(getWordAttr(tablePosition, "tblpX")),
            gridWidthsTwip: gridColumns
                .map((column) => parseTwip(getWordAttr(column, "w")))
                .filter((width): width is number => width != null),
        };
    });
}

function parseParagraphTabStops(tabsNode: Element | null): ParagraphTabStopHint[] | null {
    if (!tabsNode) return null;

    return getDirectWordChildren(tabsNode, "tab").map((tabNode) => ({
        positionTwip: parseTwip(getWordAttr(tabNode, "pos")),
        leader: getWordAttr(tabNode, "leader"),
        style: getWordAttr(tabNode, "val"),
    }));
}

function extractParagraphStyles(xml: Document): Map<string, ParagraphStyleTabHint> {
    const styleHints = new Map<string, ParagraphStyleTabHint>();
    const styleNodes = Array.from(xml.getElementsByTagNameNS(WORD_NAMESPACE, "style"));

    styleNodes.forEach((styleNode) => {
        if (getWordAttr(styleNode, "type") !== "paragraph") return;

        const styleId = getWordAttr(styleNode, "styleId");
        if (!styleId) return;

        const basedOnStyleId = getWordAttr(getDirectWordChild(styleNode, "basedOn"), "val");
        const paragraphProperties = getDirectWordChild(styleNode, "pPr");
        const tabsNode = getDirectWordChild(paragraphProperties, "tabs");

        styleHints.set(styleId, {
            basedOnStyleId,
            tabStops: parseParagraphTabStops(tabsNode),
        });
    });

    return styleHints;
}

function resolveStyleTabStops(
    styleHints: Map<string, ParagraphStyleTabHint>,
    styleId: string | null,
    visited = new Set<string>()
): ParagraphTabStopHint[] | null {
    if (!styleId || visited.has(styleId)) return null;

    const styleHint = styleHints.get(styleId);
    if (!styleHint) return null;

    if (styleHint.tabStops != null) {
        return styleHint.tabStops;
    }

    visited.add(styleId);
    return resolveStyleTabStops(styleHints, styleHint.basedOnStyleId, visited);
}

async function extractParagraphTabHints(docxBlob: Blob): Promise<{
    defaultTabStopTwip: number | null;
    paragraphs: ParagraphTabStopHint[][];
}> {
    const [{ default: PizZip }] = await Promise.all([import("pizzip")]);
    const buffer = await docxBlob.arrayBuffer();
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml || typeof DOMParser === "undefined") {
        return {
            defaultTabStopTwip: DEFAULT_TAB_STOP_TWIP,
            paragraphs: [],
        };
    }

    const xml = new DOMParser().parseFromString(documentXml, "application/xml");
    const body = xml.getElementsByTagNameNS(WORD_NAMESPACE, "body")[0];
    const settingsXml = zip.file("word/settings.xml")?.asText();
    const stylesXml = zip.file("word/styles.xml")?.asText();
    const settings = settingsXml
        ? new DOMParser().parseFromString(settingsXml, "application/xml")
        : null;
    const styles = stylesXml
        ? new DOMParser().parseFromString(stylesXml, "application/xml")
        : null;
    const defaultTabStopNode = settings?.getElementsByTagNameNS(WORD_NAMESPACE, "defaultTabStop")[0] ?? null;
    const styleHints = styles ? extractParagraphStyles(styles) : new Map<string, ParagraphStyleTabHint>();

    if (!body) {
        return {
            defaultTabStopTwip: parseTwip(getWordAttr(defaultTabStopNode, "val")) ?? DEFAULT_TAB_STOP_TWIP,
            paragraphs: [],
        };
    }

    return {
        defaultTabStopTwip: parseTwip(getWordAttr(defaultTabStopNode, "val")) ?? DEFAULT_TAB_STOP_TWIP,
        paragraphs: Array.from(body.getElementsByTagNameNS(WORD_NAMESPACE, "p"))
            .filter((paragraphNode) => paragraphHasTabCharacter(paragraphNode))
            .map((paragraphNode) => {
                const paragraphProperties = getDirectWordChild(paragraphNode, "pPr");
                const directTabs = parseParagraphTabStops(getDirectWordChild(paragraphProperties, "tabs"));
                if (directTabs != null) {
                    return directTabs;
                }

                const paragraphStyleId = getWordAttr(getDirectWordChild(paragraphProperties, "pStyle"), "val");
                return resolveStyleTabStops(styleHints, paragraphStyleId) ?? [];
            }),
    };
}

function resetParagraphTabStops(tabSpans: HTMLElement[]) {
    tabSpans.forEach((tabSpan) => {
        tabSpan.innerHTML = "&emsp;";
        tabSpan.style.wordSpacing = "";
        tabSpan.style.textDecoration = "inherit";
        tabSpan.style.textDecorationStyle = "";
    });
}

function resetParagraphNoWrap(paragraph: HTMLParagraphElement) {
    paragraph.style.whiteSpace = "";
    paragraph.querySelectorAll<HTMLElement>("span").forEach((span) => {
        span.style.whiteSpace = "";
    });
}

function applyCenterTabNoWrap(paragraph: HTMLParagraphElement, tabStops: ParagraphTabStopHint[]) {
    if (!tabStops.some((tabStop) => tabStop.style === "center")) return;

    paragraph.style.whiteSpace = "nowrap";
    paragraph.querySelectorAll<HTMLElement>("span").forEach((span) => {
        span.style.whiteSpace = "nowrap";
    });
}

function unwrapParagraphTabTail(paragraph: HTMLParagraphElement) {
    const existingTail = Array.from(paragraph.children).find((child) => child.classList.contains(TAB_TAIL_CLASS));
    if (!existingTail) return;

    while (existingTail.firstChild) {
        paragraph.insertBefore(existingTail.firstChild, existingTail);
    }

    existingTail.remove();
}

function resolveParagraphTabStops(
    tabStops: ParagraphTabStopHint[],
    defaultTabStopPt: number,
    paragraphWidthPt: number
) {
    const resolvedTabStops = tabStops
        .map((tabStop) => ({
            positionPt: tabStop.positionTwip != null ? tabStop.positionTwip / 20 : defaultTabStopPt,
            leader: tabStop.leader,
            style: tabStop.style ?? "left",
        }))
        .filter((tabStop): tabStop is { positionPt: number; leader: string | null; style: string } => tabStop.positionPt != null)
        .sort((left, right) => left.positionPt - right.positionPt)
        .map((tabStop) => ({
            pos: tabStop.positionPt,
            leader: tabStop.leader,
            style: tabStop.style,
        }));

    if (resolvedTabStops.length === 0) {
        resolvedTabStops.push({
            pos: defaultTabStopPt,
            leader: null,
            style: "left",
        });
    }

    const lastStop = resolvedTabStops[resolvedTabStops.length - 1];

    for (
        let nextPosition = lastStop.pos + defaultTabStopPt;
        nextPosition < paragraphWidthPt && resolvedTabStops.length < MAX_TAB_STOPS;
        nextPosition += defaultTabStopPt
    ) {
        resolvedTabStops.push({
            pos: nextPosition,
            leader: null,
            style: "left",
        });
    }

    return resolvedTabStops;
}

function applyTableHints(iframeDocument: Document, tableHints: TableRenderHint[], rootSelector: string) {
    const renderedTables = Array.from(
        iframeDocument.querySelectorAll<HTMLTableElement>(`${rootSelector} section.docx article table`)
    );

    renderedTables.forEach((table, index) => {
        const hint = tableHints[index];
        if (!hint) return;

        table.style.maxWidth = "none";

        if (hint.isFixedLayout) {
            table.style.tableLayout = "fixed";
        }

        if (hint.widthTwip != null) {
            const width = twipToPt(hint.widthTwip);
            table.style.width = width;
        }

        if (hint.positionXTwip != null) {
            table.style.marginLeft = twipToPt(hint.positionXTwip);
        }

        const renderedColumns = Array.from(table.querySelectorAll<HTMLTableColElement>("colgroup > col"));
        hint.gridWidthsTwip.forEach((widthTwip, columnIndex) => {
            const renderedColumn = renderedColumns[columnIndex];
            if (!renderedColumn) return;

            const width = twipToPt(widthTwip);
            renderedColumn.style.width = width;
        });
    });
}

function preserveEmptyParagraphSpacing(iframeDocument: Document, rootSelector: string) {
    const renderedParagraphs = Array.from(
        iframeDocument.querySelectorAll<HTMLParagraphElement>(`${rootSelector} section.docx article p`)
    );

    renderedParagraphs.forEach((paragraph) => {
        if (paragraph.closest("table")) return;
        if (paragraph.childElementCount !== 0) return;
        if ((paragraph.textContent ?? "").trim().length !== 0) return;

        paragraph.textContent = "\u00A0";
    });
}

function replaceSingleTextNodeText(root: Element, fromText: string, toText: string) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();

    while (currentNode) {
        if ((currentNode.textContent ?? "").trim() === fromText) {
            currentNode.textContent = (currentNode.textContent ?? "").replace(fromText, toText);
            return;
        }

        currentNode = walker.nextNode();
    }
}

function updateRenderedPageNumbers(iframeDocument: Document, rootSelector: string) {
    const sections = Array.from(iframeDocument.querySelectorAll<HTMLElement>(`${rootSelector} section.docx`));

    sections.forEach((section, index) => {
        const footer = section.querySelector<HTMLElement>("footer");
        if (!footer) return;
        if ((footer.textContent ?? "").trim() !== "1") return;

        replaceSingleTextNodeText(footer, "1", String(index + 1));
    });
}

function getParagraphTabOriginLeft(paragraph: Element, paragraphStyles: CSSStyleDeclaration): number {
    const paragraphRect = paragraph.getBoundingClientRect();
    const textIndent = Number.parseFloat(paragraphStyles.textIndent || "0") || 0;

    return paragraphRect.left + Math.min(textIndent, 0);
}

function recalculateTabStop(
    tabSpan: HTMLElement,
    tabStops: ParagraphTabStopHint[],
    defaultTabStopPt: number,
    pixelToPoint: number
) {
    const paragraph = tabSpan.closest("p");
    if (!paragraph) return;

    const paragraphRect = paragraph.getBoundingClientRect();
    const paragraphStyles = getComputedStyle(paragraph);
    const resolvedTabStops = resolveParagraphTabStops(tabStops, defaultTabStopPt, paragraphRect.width * pixelToPoint);

    const tabOriginLeft = getParagraphTabOriginLeft(paragraph, paragraphStyles);
    const currentLeftPt = (tabSpan.getBoundingClientRect().left - tabOriginLeft) * pixelToPoint;

    const allTabSpans = Array.from(paragraph.querySelectorAll<HTMLElement>(".docx-tab-stop"));
    const nextStop = resolvedTabStops.find((tabStop) => tabStop.style !== "clear" && tabStop.pos > currentLeftPt);

    if (!nextStop) return;

    const nextTabIndex = allTabSpans.indexOf(tabSpan) + 1;
    const range = paragraph.ownerDocument.createRange();
    range.setStart(tabSpan, 1);

    if (nextTabIndex < allTabSpans.length) {
        range.setEndBefore(allTabSpans[nextTabIndex]);
    } else {
        range.setEndAfter(paragraph);
    }

    const trailingRect = range.getBoundingClientRect();
    let targetWidthPt = nextStop.pos - currentLeftPt;

    if (nextStop.style === "right" || nextStop.style === "center") {
        const multiplier = nextStop.style === "center" ? 0.5 : 1;
        const offsetPt = (trailingRect.left + trailingRect.width * multiplier - tabOriginLeft) * pixelToPoint;
        targetWidthPt = nextStop.pos - offsetPt;
    }

    tabSpan.innerHTML = "&nbsp;";
    tabSpan.style.textDecoration = "inherit";
    tabSpan.style.wordSpacing = `${Math.max(targetWidthPt, 1).toFixed(0)}pt`;

    if (nextStop.leader === "dot" || nextStop.leader === "middleDot") {
        tabSpan.style.textDecoration = "underline";
        tabSpan.style.textDecorationStyle = "dotted";
    } else if (nextStop.leader === "hyphen" || nextStop.leader === "heavy" || nextStop.leader === "underscore") {
        tabSpan.style.textDecoration = "underline";
        tabSpan.style.textDecorationStyle = "solid";
    }
}

function applyParagraphTabHints(
    iframeDocument: Document,
    paragraphTabHints: { defaultTabStopTwip: number | null; paragraphs: ParagraphTabStopHint[][] },
    rootSelector: string
) {
    const renderedParagraphs = Array.from(
        iframeDocument.querySelectorAll<HTMLParagraphElement>(`${rootSelector} section.docx article p`)
    ).filter((paragraph) => paragraph.querySelector(".docx-tab-stop"));
    const defaultTabStopPt = (paragraphTabHints.defaultTabStopTwip ?? DEFAULT_TAB_STOP_TWIP) / 20;
    const pixelToPoint = computePixelToPoint(iframeDocument);

    renderedParagraphs.forEach((paragraph, index) => {
        unwrapParagraphTabTail(paragraph);
        resetParagraphNoWrap(paragraph);

        const tabSpans = Array.from(paragraph.querySelectorAll<HTMLElement>(".docx-tab-stop"));
        if (tabSpans.length === 0) return;

        resetParagraphTabStops(tabSpans);

        const tabHints = paragraphTabHints.paragraphs[index] ?? [];
        applyCenterTabNoWrap(paragraph, tabHints);
        tabSpans.forEach((tabSpan) => recalculateTabStop(tabSpan, tabHints, defaultTabStopPt, pixelToPoint));
    });
}

async function syncRenderedLayout(
    iframeDocument: Document,
    rootSelector: string,
    paragraphTabHints: { defaultTabStopTwip: number | null; paragraphs: ParagraphTabStopHint[][] },
    tableHints: TableRenderHint[]
) {
    const targetWindow = iframeDocument.defaultView;

    await waitForStableFrameLayout(iframeDocument, 120);
    applyTableHints(iframeDocument, tableHints, rootSelector);
    await waitForNextFrame(targetWindow);
    applyParagraphTabHints(iframeDocument, paragraphTabHints, rootSelector);

    preserveEmptyParagraphSpacing(iframeDocument, rootSelector);
    updateRenderedPageNumbers(iframeDocument, rootSelector);
    await waitForStableFrameLayout(iframeDocument, 120);
    applyParagraphTabHints(iframeDocument, paragraphTabHints, rootSelector);
    updateRenderedPageNumbers(iframeDocument, rootSelector);
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
    const syncPreviewLayoutRef = useRef<(() => Promise<void>) | null>(null);
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
        syncPreviewLayoutRef.current = null;

        iframeDocument.open();
        iframeDocument.write(IFRAME_HTML);
        iframeDocument.close();

        const target = iframeDocument.getElementById("docx-preview-frame-root");
        if (!target) {
            setError("Không thể khởi tạo vùng xem trước.");
            setLoading(false);
            return;
        }

        let cleanupBeforePrint: (() => void) | null = null;

        Promise.all([
            import("docx-preview"),
            normalizePreviewDocxBlob(docxBlob),
        ])
            .then(async ([{ renderAsync }, previewBlob]) => {
                const [paragraphTabHints, tableHints] = await Promise.all([
                    extractParagraphTabHints(previewBlob),
                    extractTableHints(previewBlob),
                ]);

                await renderAsync(previewBlob, target as HTMLElement, undefined, {
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

                await waitForStableFrameLayout(iframeDocument, 900);

                const syncPreviewLayout = async () => {
                    await syncRenderedLayout(
                        iframeDocument,
                        "#docx-preview-frame-root",
                        paragraphTabHints,
                        tableHints
                    );
                };

                syncPreviewLayoutRef.current = syncPreviewLayout;
                await syncPreviewLayout();

                const printWindow = iframe.contentWindow;
                if (printWindow) {
                    const handleBeforePrint = () => {
                        void syncPreviewLayout();
                    };

                    printWindow.addEventListener("beforeprint", handleBeforePrint);
                    cleanupBeforePrint = () => {
                        printWindow.removeEventListener("beforeprint", handleBeforePrint);
                    };
                }

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
            syncPreviewLayoutRef.current = null;
            cleanupBeforePrint?.();

            const cleanupDocument = iframe.contentDocument;
            if (!cleanupDocument) return;

            cleanupDocument.open();
            cleanupDocument.write(IFRAME_HTML);
            cleanupDocument.close();
        };
    }, [isOpen, docxBlob]);

    const handlePrint = async () => {
        if (loading || error || !previewReady || typeof document === "undefined" || !docxBlob) return;

        await syncPreviewLayoutRef.current?.();

        try {
            const printDocument = iframeRef.current?.contentDocument;
            const printWindow = iframeRef.current?.contentWindow;
            if (!printDocument || !printWindow) return;

            await waitForStableFrameLayout(printDocument, 300);

            await new Promise<void>((resolve) => {
                let resolved = false;

                const finish = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };

                printWindow.addEventListener("afterprint", finish, { once: true });
                void waitForTimeout(printWindow, 1500).then(finish);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        printWindow.focus();
                        printWindow.print();
                    });
                });
            });
        } catch (printError) {
            console.error("docx print error:", printError);
        }
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
