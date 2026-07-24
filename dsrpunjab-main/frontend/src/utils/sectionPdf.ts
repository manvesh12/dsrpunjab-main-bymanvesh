import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "../api/client";
import { downloadBlob } from "./reportExport";

export type PdfUpload = { name: string; url?: string } | null | undefined;
export type ReportDataTable = { title: string; columns: Array<{ key: string; label: string }>; rows: Record<string, string>[] };
export type ReportCrossSection = { name?: string; dist?: string; post?: string; red?: string; thal?: string; area?: string; noMine?: string; bulk?: string; pct?: string; calcThick?: string };
export type ReportChapter = { name: string; summary: string };
export type ReportFrameSettings = { headerText?: string; footerText?: string; sectionTitles?: Record<string, string>; sectionOverrides?: Record<string, { headerText?: string; footerText?: string }> };

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const UPLOAD_SAFE_AREA = { x: 54, y: 72, width: A4_WIDTH - 108, height: A4_HEIGHT - 158 };

function safeText(value: string) {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, "-");
}

export function drawWrappedLines(page: PDFPage, font: PDFFont, text: string, options: { x: number; y: number; maxWidth: number; size?: number; lineHeight?: number }) {
  const size = options.size || 11;
  const lineHeight = options.lineHeight || 17;
  let y = options.y;
  let line = "";
  safeText(text).split(/\s+/).forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > options.maxWidth && line) {
      page.drawText(line, { x: options.x, y, size, font, color: rgb(0.15, 0.18, 0.24) });
      y -= lineHeight;
      line = word;
    } else line = candidate;
  });
  if (line) page.drawText(line, { x: options.x, y, size, font, color: rgb(0.15, 0.18, 0.24) });
  return y - lineHeight;
}

export function drawPdfHeading(page: PDFPage, font: PDFFont, text: string, y = 790, size = 18) {
  const safe = safeText(text);
  page.drawText(safe, { x: (page.getWidth() - font.widthOfTextAtSize(safe, size)) / 2, y, size, font, color: rgb(0.06, 0.09, 0.16) });
}

export async function appendUploadedDocument(target: PDFDocument, upload: PdfUpload, options: { preserveOriginalPage?: boolean } = {}) {
  if (!upload?.url) return false;
  let data: ArrayBuffer;
  let contentType = "";
  if (/^(blob:|data:)/i.test(upload.url)) {
    const response = await fetch(upload.url);
    if (!response.ok) throw new Error(`Could not read ${upload.name}`);
    data = await response.arrayBuffer();
    contentType = String(response.headers.get("content-type") || "").toLowerCase();
  } else {
    const response = await apiClient.get<ArrayBuffer>(upload.url, {
      responseType: "arraybuffer",
      timeout: 60_000,
    });
    data = response.data;
    contentType = String(response.headers["content-type"] || "").toLowerCase();
  }
  if (!data.byteLength) throw new Error(`${upload.name} is empty`);
  if (contentType.includes("pdf") || upload.name.toLowerCase().endsWith(".pdf")) {
    const source = await PDFDocument.load(data);
    if (options.preserveOriginalPage) {
      const pages = await target.copyPages(source, source.getPageIndices());
      pages.forEach((page) => target.addPage(page));
      return true;
    }
    for (const sourcePage of source.getPages()) {
      const embeddedPage = await target.embedPage(sourcePage);
      const sourceSize = sourcePage.getSize();
      const scale = Math.min(
        UPLOAD_SAFE_AREA.width / sourceSize.width,
        UPLOAD_SAFE_AREA.height / sourceSize.height,
      );
      const width = sourceSize.width * scale;
      const height = sourceSize.height * scale;
      const page = target.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawPage(embeddedPage, {
        x: UPLOAD_SAFE_AREA.x + (UPLOAD_SAFE_AREA.width - width) / 2,
        y: UPLOAD_SAFE_AREA.y + (UPLOAD_SAFE_AREA.height - height) / 2,
        width,
        height,
      });
    }
    return true;
  }
  const image = contentType.includes("png") || upload.name.toLowerCase().endsWith(".png")
    ? await target.embedPng(data)
    : await target.embedJpg(data);
  const page = target.addPage([A4_WIDTH, A4_HEIGHT]);
  const safeArea = options.preserveOriginalPage
    ? { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT }
    : UPLOAD_SAFE_AREA;
  const scale = Math.min(safeArea.width / image.width, safeArea.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, {
    x: safeArea.x + (safeArea.width - width) / 2,
    y: safeArea.y + (safeArea.height - height) / 2,
    width,
    height,
  });
  return true;
}

export async function createSectionPdf() {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  return { document, regular, bold };
}

/** Creates the standalone opening page used before every report section. */
export async function appendReportSectionTitle(target: PDFDocument, title: string, subtitle = "") {
  const page = target.addPage([595.28, 841.89]);
  const regular = await target.embedFont(StandardFonts.TimesRoman);
  const bold = await target.embedFont(StandardFonts.TimesRomanBold);
  const cleanTitle = safeText(title.toUpperCase());
  const titleSize = 24;
  const maxTitleWidth = 455;
  const titleLines: string[] = [];
  let currentLine = "";
  cleanTitle.split(/\s+/).forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && bold.widthOfTextAtSize(candidate, titleSize) > maxTitleWidth) {
      titleLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });
  if (currentLine) titleLines.push(currentLine);
  const lineHeight = 34;
  const titleBlockHeight = (titleLines.length - 1) * lineHeight;
  const firstLineY = page.getHeight() / 2 + titleBlockHeight / 2;
  titleLines.forEach((line, index) => {
    page.drawText(line, {
      x: (page.getWidth() - bold.widthOfTextAtSize(line, titleSize)) / 2,
      y: firstLineY - index * lineHeight,
      size: titleSize,
      font: bold,
      color: rgb(0.05, 0.08, 0.12),
    });
  });
  const underlineY = firstLineY - titleBlockHeight - 24;
  if (subtitle) {
    const cleanSubtitle = safeText(subtitle);
    page.drawText(cleanSubtitle, { x: (page.getWidth() - regular.widthOfTextAtSize(cleanSubtitle, 13)) / 2, y: underlineY - 28, size: 13, font: regular, color: rgb(0.25, 0.28, 0.32) });
  }
  page.drawLine({ start: { x: 150, y: underlineY }, end: { x: 445, y: underlineY }, thickness: 0.7, color: rgb(0.1, 0.1, 0.1) });
}

/** Adds editable annexure tables and saved cross-section graphs to the final report. */
export async function appendGeneratedReportContent(target: PDFDocument, input: {
  district: string;
  tables: ReportDataTable[];
  graphs: ReportCrossSection[];
  chapters?: ReportChapter[];
}) {
  if (!input.tables.length && !input.graphs.length && !input.chapters?.length) return;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let hasPage = false;
  const addPage = () => { if (hasPage) pdf.addPage(); hasPage = true; };

  (input.chapters || []).forEach((chapter) => {
    addPage();
    pdf.setFont("times", "bold"); pdf.setFontSize(17);
    pdf.text(chapter.name, 105, 34, { align: "center", maxWidth: 165 });
    pdf.setDrawColor(30); pdf.line(30, 54, 180, 54);
    pdf.setFont("times", "normal"); pdf.setFontSize(11);
    const content = chapter.summary || "Chapter content will appear here once it is entered and saved in the chapter editor.";
    pdf.text(pdf.splitTextToSize(content, 150), 30, 75, { lineHeightFactor: 1.6 });
    pdf.setFontSize(9); pdf.setTextColor(90);
    pdf.text("Chapter template - District Survey Report", 105, 260, { align: "center" });
    pdf.setTextColor(0);
  });

  input.graphs.forEach((graph, index) => {
    addPage();
    const distances = String(graph.dist || "").split(",").map(Number).filter(Number.isFinite);
    const elevations = String(graph.post || "").split(",").map(Number).filter(Number.isFinite);
    const values = [...elevations, Number(graph.red), Number(graph.thal)].filter(Number.isFinite);
    const min = values.length ? Math.min(...values) - 0.2 : 0;
    const max = values.length ? Math.max(...values) + 0.2 : 1;
    const x = 25, y = 72, w = 160, h = 76;
    pdf.setFont("times", "bold"); pdf.setFontSize(15);
    pdf.text("CROSS SECTION SAND BAR", 105, 20, { align: "center" });
    pdf.setFontSize(11); pdf.text(graph.name || `Cross Section ${index + 1}`, 105, 28, { align: "center" });
    pdf.setDrawColor(160); pdf.rect(x, y, w, h);
    for (let i = 1; i < 5; i += 1) { pdf.setDrawColor(225); pdf.line(x, y + h * i / 5, x + w, y + h * i / 5); }
    const maxDistance = Math.max(...distances, 1);
    const point = (distance: number, elevation: number) => [x + (distance / maxDistance) * w, y + h - ((elevation - min) / Math.max(max - min, 0.1)) * h] as const;
    if (distances.length && elevations.length) {
      pdf.setDrawColor(190, 110, 50); pdf.setLineWidth(0.8);
      for (let i = 1; i < Math.min(distances.length, elevations.length); i += 1) { const a = point(distances[i - 1], elevations[i - 1]); const b = point(distances[i], elevations[i]); pdf.line(a[0], a[1], b[0], b[1]); }
    }
    [[Number(graph.red), [220, 55, 55]], [Number(graph.thal), [55, 135, 185]]].forEach(([level, color]) => {
      if (!Number.isFinite(level)) return;
      const py = point(0, level)[1]; pdf.setDrawColor(...(color as number[])); pdf.setLineWidth(0.5); pdf.line(x, py, x + w, py);
    });
    pdf.setFont("times", "normal"); pdf.setFontSize(9);
    pdf.text(`Area: ${graph.area || "-"} Ha     No-mining: ${graph.noMine || "-"} Ha     Bulk density: ${graph.bulk || "-"}     Mining: ${graph.pct || "-"}%`, 25, 164);
    pdf.text(`Post-monsoon levels: ${graph.post || "-"}`, 25, 172, { maxWidth: 160 });
    pdf.text("Orange: post-monsoon elevation   Red: red line   Blue: thalweg", 25, 184);
  });

  input.tables.forEach((table) => {
    addPage();
    autoTable(pdf, {
      // Match the approved DSR annexure format: the report frame supplies the
      // heading, while the table starts below it and stays clear of the footer.
      startY: 42,
      head: [table.columns.map((column) => column.label)],
      body: table.rows.length ? table.rows.map((row) => table.columns.map((column) => String(row[column.key] || ""))) : [["No data entered yet"]],
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 8,
        cellPadding: 1.25,
        overflow: "linebreak",
        valign: "top",
        textColor: [0, 0, 0],
        lineColor: [70, 70, 70],
        lineWidth: 0.2,
      },
      headStyles: {
        font: "times",
        fontSize: 8,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [45, 45, 45],
        lineWidth: 0.25,
      },
      bodyStyles: {
        font: "times",
        fontSize: 8,
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      margin: { top: 42, right: 24, bottom: 27, left: 24 },
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
  });

  const generated = await PDFDocument.load(pdf.output("arraybuffer"));
  const pages = await target.copyPages(generated, generated.getPageIndices());
  pages.forEach((page) => target.addPage(page));
}

/**
 * Applies the DSR document frame used in the approved Jalandhar report.  This
 * is intentionally added after imported pages are copied so PDFs, scans and
 * images all receive the same numbering and section identification.
 */
export async function applyDsrReportFrame(document: PDFDocument, sections: Array<{ title: string; startPage: number }>, district = "Punjab", settings: ReportFrameSettings = {}, unframedPages: ReadonlySet<number> = new Set()) {
  const italic = await document.embedFont(StandardFonts.TimesRomanItalic);
  const regular = await document.embedFont(StandardFonts.TimesRoman);
  const bold = await document.embedFont(StandardFonts.TimesRomanBold);
  const pages = document.getPages();

  pages.forEach((page, index) => {
    if (unframedPages.has(index)) return;
    const { width, height } = page.getSize();
    const scale = Math.min(width / 595.28, height / 841.89);
    const left = 24 * scale;
    const bottom = 24 * scale;
    const top = height - 24 * scale;
    const section = sections.filter((item) => item.startPage <= index).at(-1)?.title || "District Survey Report";
    const override = settings.sectionOverrides?.[section];
    const title = override?.headerText || settings.headerText || "District Survey Report";
    const footer = override?.footerText || settings.footerText || "PREPARED BY: DISTRICT SURVEY REPORT COMMITTEE";
    const subtitle = section.length > 55 ? `${section.slice(0, 52)}...` : section;

    page.drawRectangle({ x: left, y: bottom, width: width - left * 2, height: height - bottom * 2, borderColor: rgb(0, 0, 0), borderWidth: 0.65 * scale, opacity: 1 });
    page.drawText(title, { x: 76 * scale, y: top - 19 * scale, font: italic, size: 10 * scale, color: rgb(0, 0, 0) });
    page.drawText(`${district} District, Punjab`, { x: 76 * scale, y: top - 34 * scale, font: italic, size: 8.5 * scale, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 74 * scale, y: top - 49 * scale }, end: { x: width - 74 * scale, y: top - 49 * scale }, thickness: 0.55 * scale, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 74 * scale, y: bottom + 42 * scale }, end: { x: width - 74 * scale, y: bottom + 42 * scale }, thickness: 0.35 * scale, color: rgb(0.55, 0.55, 0.55) });

    page.drawText(footer, { x: 130 * scale, y: bottom + 18 * scale, font: bold, size: 6.8 * scale, color: rgb(0, 0, 0) });
    page.drawText(`Page ${index + 1}`, { x: width - 108 * scale, y: bottom + 29 * scale, font: regular, size: 8 * scale, color: rgb(0.22, 0.22, 0.22) });
    page.drawText(subtitle, { x: 76 * scale, y: top - 61 * scale, font: regular, size: 7.5 * scale, color: rgb(0.25, 0.25, 0.25) });
  });
}

export async function saveSectionPdf(document: PDFDocument, fileName: string) {
  const bytes = await document.save();
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
}
