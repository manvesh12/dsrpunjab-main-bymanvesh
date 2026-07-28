import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { EditorColumn } from "../components/ui/ModuleEditor";
import { PDFDocument } from "pdf-lib";
import { appendUploadedDocument, saveSectionPdf, type PdfUpload } from "./sectionPdf";

export type AnnexureSnapshot = {
  title: string;
  columns: EditorColumn[];
  rows: Record<string, string>[];
  attachments?: string[];
};

const safeName = (value: string) => value.replace(/[\\/?*[\]:]/g, " ").trim();

export function exportAnnexureExcel(
  title: string,
  snapshots: AnnexureSnapshot[],
) {
  const workbook = XLSX.utils.book_new();
  snapshots.forEach((snapshot, index) => {
    const data = [
      snapshot.columns.map((column) => column.label),
      ...snapshot.rows.map((row) =>
        snapshot.columns.map((column) => row[column.key] ?? ""),
      ),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet["!cols"] = snapshot.columns.map((column) => ({
      wch: Math.min(45, Math.max(14, column.label.length + 3)),
    }));
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    const base = safeName(snapshot.title).slice(0, 25) || `Table ${index + 1}`;
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      `${index + 1}-${base}`.slice(0, 31),
    );
    if (snapshot.attachments?.length) {
      const attachmentSheet = XLSX.utils.aoa_to_sheet([
        ["Attachments for", snapshot.title],
        ...snapshot.attachments.map((name) => [name]),
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        attachmentSheet,
        `${index + 1}-Files`.slice(0, 31),
      );
    }
  });
  if (!snapshots.length)
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([[title]]),
      "Annexure",
    );
  XLSX.writeFile(workbook, `${safeName(title).replaceAll(" ", "-")}.xlsx`);
}

export async function exportAnnexurePdf(
  title: string,
  snapshots: AnnexureSnapshot[],
  uploads: PdfUpload[] = [],
) {
  // Annexure V and a few other official schedules have many columns.  An A4
  // page forces AutoTable to make every column (and consequently the text)
  // too narrow.  Use A3 landscape for any dense annexure so the actual column
  // widths stay usable instead of shrinking the content into unreadable text.
  const pageFormat = snapshots.some((snapshot) => snapshot.columns.length > 10)
    ? "a3"
    : "a4";
  const document = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: pageFormat,
  });
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const horizontalMargin = pageFormat === "a3" ? 12 : 10;
  snapshots.forEach((snapshot, index) => {
    if (index) document.addPage(pageFormat, "landscape");
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("GOVERNMENT OF PUNJAB", pageWidth / 2, 12, { align: "center" });
    document.setFontSize(15);
    document.text(title.toUpperCase(), pageWidth / 2, 21, {
      align: "center",
      maxWidth: pageWidth - horizontalMargin * 2,
    });
    document.setFontSize(11);
    document.text(snapshot.title, horizontalMargin + 4, 31, {
      maxWidth: pageWidth - horizontalMargin * 2 - 8,
    });
    autoTable(document, {
      startY: 36,
      head: [snapshot.columns.map((column) => column.label)],
      body: snapshot.rows.map((row) =>
        snapshot.columns.map((column) => row[column.key] ?? ""),
      ),
      theme: "grid",
      styles: {
        // Keep text readable; extra page width, not a tiny font, handles
        // large tables.  The compact padding still keeps the table neat.
        fontSize: snapshot.columns.length > 10 ? 6 : 6.5,
        cellPadding: snapshot.columns.length > 10 ? 0.65 : 0.8,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 14, right: horizontalMargin, bottom: 14, left: horizontalMargin },
      tableWidth: pageWidth - horizontalMargin * 2,
      didDrawPage: ({ pageNumber }) => {
        document.setFontSize(7);
        document.setTextColor(90);
        document.text(
          `District Survey Report • ${title} • Page ${pageNumber}`,
          pageWidth / 2,
          pageHeight - 7,
          { align: "center" },
        );
      },
    });
    if (snapshot.attachments?.length) {
      const finalY =
        (document as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY ?? 42;
      document.setFontSize(7);
      document.setTextColor(70);
      document.text(
        `Attached files: ${snapshot.attachments.join(", ")}`,
        horizontalMargin + 2,
        Math.min(finalY + 8, pageHeight - 12),
        { maxWidth: pageWidth - horizontalMargin * 2 - 4 },
      );
    }
  });
  if (!snapshots.length) document.text(title, pageWidth / 2, 25, { align: "center" });
  const merged = await PDFDocument.load(document.output("arraybuffer"));
  for (const upload of uploads) await appendUploadedDocument(merged, upload);
  await saveSectionPdf(merged, `${safeName(title).replaceAll(" ", "-")}.pdf`);
}
