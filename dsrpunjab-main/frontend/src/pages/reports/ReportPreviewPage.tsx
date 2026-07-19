import { Download, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { get } from "idb-keyval";
import PageHeader from "../../components/layout/PageHeader";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { projectsApi, type ProjectFile } from "../../api/projects.api";
import { uploadsApi } from "../../api/uploads.api";
import { appendGeneratedReportContent, appendReportSectionTitle, appendUploadedDocument, applyDsrReportFrame, createSectionPdf, saveSectionPdf, type ReportChapter, type ReportCrossSection, type ReportDataTable } from "../../utils/sectionPdf";
import { toast } from "sonner";

type UploadRecord = { name: string; url?: string } | null;
type Chapter = ReportChapter & { file?: { name: string; url: string } };
type Plate = { name: string; fileName?: string; url?: string };
type FrontMatterState = {
  coverFile?: UploadRecord;
  certFile?: UploadRecord;
  contentFile?: UploadRecord;
  prefaceFile?: UploadRecord;
};
type PreviewUpload = { id: string; title: string; name: string; url: string };
type DraftColumn = { key: string; label: string };
const annexureSections = ["Annexure I", "Annexure II", "Annexure III", "Annexure IV", "Annexure V", "Annexure VI", "Annexure VII", "Annexure B", "Annexure C", "Annexure D", "Annexure E", "Annexure F", "Annexure G", "Annexure H", "Annexure I (Additional)", "Annexure J", "Annexure K"];

function annexureMatches(title: string, annexure: string) {
  const normalized = title.toLowerCase().replace(/\s+/g, " ");
  const target = annexure.toLowerCase().replace(" (additional)", "");
  return new RegExp(`${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|-|$)`).test(normalized);
}

function reportOrder(title: string) {
  const value = title.toLowerCase();
  if (/cover|certificate|content page|preface|front matter/.test(value)) return 0;
  if (value.includes("chapter")) return 1;
  if (value.includes("cross section")) return 3;
  if (value.includes("plate")) return 4;
  if (value.includes("annexure")) return 6;
  return 5;
}

function SectionTitlePage({ title, pageNumber, district }: { title: string; pageNumber: number; district: string }) {
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col items-center justify-center overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    <header className="absolute left-16 right-16 top-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">District Survey Report</p><p className="text-[12px] italic">{district} District, Punjab</p></header>
    <h1 className="mx-16 border-b border-black pb-4 text-center font-serif text-3xl font-bold uppercase">{title}</h1>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span className="font-bold uppercase">Prepared by: District Survey Report Committee</span><span>Page {pageNumber}</span></footer>
  </section>;
}

function GeneratedSection({ table, graph, chapter, pageNumber, district }: { table?: ReportDataTable; graph?: ReportCrossSection; chapter?: ReportChapter; pageNumber: number; district: string }) {
  const heading = table?.title || chapter?.name || graph?.name || "Cross Section Sand Bar";
  const points = String(graph?.post || "").split(",").map(Number).filter(Number.isFinite);
  const levels = [...points, Number(graph?.red), Number(graph?.thal)].filter(Number.isFinite);
  const min = levels.length ? Math.min(...levels) : 0;
  const max = levels.length ? Math.max(...levels) : 1;
  const svgPoints = points.map((value, index) => `${20 + index * (250 / Math.max(points.length - 1, 1))},${110 - ((value - min) / Math.max(max - min, .1)) * 82}`).join(" ");
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">District Survey Report</p><p className="text-[12px] italic">{district} District, Punjab</p><p className="mt-1 text-[10px]">{heading}</p></header>
    <div className="relative mx-14 mb-12 mt-4 min-h-0 flex-1 overflow-auto font-serif">
      {table ? <><h2 className="mb-3 text-center text-sm font-bold">{table.title}</h2><table className="w-full border-collapse text-[8px]"><thead><tr>{table.columns.map((column) => <th key={column.key} className="border border-black bg-slate-100 p-1 text-left">{column.label}</th>)}</tr></thead><tbody>{table.rows.length ? table.rows.map((row, index) => <tr key={index}>{table.columns.map((column) => <td key={column.key} className="border border-slate-400 p-1">{row[column.key] || "-"}</td>)}</tr>) : <tr><td className="border p-3 text-center text-slate-500" colSpan={Math.max(table.columns.length, 1)}>No data entered yet</td></tr>}</tbody></table></> : chapter ? <><h2 className="mb-8 text-center text-xl font-bold uppercase">{chapter.name}</h2><div className="border-t border-black pt-6 text-[13px] leading-7 whitespace-pre-wrap">{chapter.summary || "Chapter content will appear here once it is entered and saved in the chapter editor."}</div></> : <><h2 className="mb-2 text-center text-sm font-bold">CROSS SECTION SAND BAR</h2><p className="text-center text-xs font-bold">{heading}</p><svg viewBox="0 0 290 140" className="mx-auto mt-5 w-full max-w-md border border-slate-300"><line x1="20" y1="110" x2="270" y2="110" stroke="#64748b"/><line x1="20" y1="20" x2="20" y2="110" stroke="#64748b"/><polyline points={svgPoints} fill="none" stroke="#b86d32" strokeWidth="2"/>{Number.isFinite(Number(graph?.red)) && <line x1="20" y1={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} stroke="#dc2626"/>}{Number.isFinite(Number(graph?.thal)) && <line x1="20" y1={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} stroke="#2563eb"/>}</svg><div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><p>Area: {graph?.area || "-"} Ha</p><p>Bulk density: {graph?.bulk || "-"}</p><p>Post monsoon: {graph?.post || "-"}</p><p>Mining: {graph?.pct || "-"}%</p></div></>}
    </div>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span className="font-bold uppercase">Prepared by: District Survey Report Committee</span><span>Page {pageNumber}</span></footer>
  </section>;
}

function uploadSectionLabel(file: ProjectFile) {
  const key = file.objectKey.toLowerCase();
  const annexure = key.match(/\/annexure-([^/]+)\//)?.[1];
  if (annexure) return `Annexure ${annexure.toUpperCase()}`;
  if (key.includes("/front-matter/")) return "Front Matter";
  if (key.includes("/chapters/")) return "Chapter Upload";
  if (key.includes("/plates/")) return "Plate / Map";
  if (key.includes("/cross-sections/")) return "Cross Section";
  return "Project Upload";
}

function UploadedSection({ upload, pageNumber, district }: { upload: PreviewUpload; pageNumber: number; district: string }) {
  return (
    <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
      <div className="pointer-events-none absolute inset-4 border border-black" />
      <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight">
        <p className="text-[15px] italic">District Survey Report</p>
        <p className="max-w-[520px] text-[12px] italic">{district} District, Punjab</p>
        <p className="mt-1 text-[10px]">{upload.title}</p>
      </header>
      <div className="relative mx-14 mb-12 mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <UploadedFilePreview src={upload.url} title={upload.title} alt={upload.title} className="h-full w-full bg-white" imageStyle={{ objectFit: "contain" }} />
      </div>
      <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]">
        <span className="font-bold uppercase">Prepared by: District Survey Report Committee</span>
        <span>Page {pageNumber}</span>
      </footer>
    </section>
  );
}

export default function ReportPreviewPage() {
  const { projectId = "default" } = useParams();
  const [downloading, setDownloading] = useState(false);
  const [tables, setTables] = useState<ReportDataTable[]>([]);
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, "preview"],
    queryFn: () => projectsApi.get(projectId),
    enabled: /^\d+$/.test(projectId),
  });

  const state = project?.projectState || {};
  const frontMatter = state["front-matter"] as FrontMatterState | undefined;
  const chaptersState = state.chapters as { chapters?: Chapter[] } | Chapter[] | undefined;
  const platesState = state.plates as { plates?: Plate[] } | Plate[] | undefined;
  const chapters = Array.isArray(chaptersState) ? chaptersState : chaptersState?.chapters || [];
  const plates = Array.isArray(platesState) ? platesState : platesState?.plates || [];
  const crossSectionsState = state["cross-sections"] as { graphs?: ReportCrossSection[] } | ReportCrossSection[] | undefined;
  const graphs = Array.isArray(crossSectionsState) ? crossSectionsState : crossSectionsState?.graphs || [];

  useEffect(() => {
    let active = true;
    const loadDraftTables = async () => {
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
      const locations = [...Array.from({ length: 7 }, (_, annexure) => ({ label: `Annexure ${roman[annexure]}`, key: String(annexure + 1), count: 8 })), ...["f", "j", "k"].map((key) => ({ label: `Annexure ${key.toUpperCase()}`, key, count: 4 }))];
      const result: ReportDataTable[] = [];
      for (const location of locations) for (let index = 0; index < location.count; index += 1) {
        const base = `dsr:project-${projectId}:annexure-${location.key}-${index}`;
        const [rows, title, columns] = await Promise.all([get<unknown>(base), get<unknown>(`${base}:title`), get<unknown>(`${base}:columns`)]);
        if (!Array.isArray(rows) && !Array.isArray(columns)) continue;
        const validColumns = Array.isArray(columns) ? columns.filter((column): column is DraftColumn => Boolean(column && typeof column === "object" && "key" in column && "label" in column)) : [];
        if (!validColumns.length) continue;
        const tableName = typeof title === "string" && title.trim() ? title.trim() : `Table ${index + 1}`;
        result.push({ title: `${location.label} - ${tableName}`, columns: validColumns, rows: Array.isArray(rows) ? rows as Record<string, string>[] : [] });
      }
      if (active) setTables(result);
    };
    void loadDraftTables();
    return () => { active = false; };
  }, [projectId]);

  const uploads: PreviewUpload[] = [
    ["cover", "Cover Page", frontMatter?.coverFile],
    ["certificate", "Certificate of Compliance", frontMatter?.certFile],
    ["contents", "Content Page", frontMatter?.contentFile],
    ["preface", "Preface", frontMatter?.prefaceFile],
  ].flatMap(([id, title, file]) => {
    const record = file as UploadRecord;
    return record?.url ? [{ id: String(id), title: String(title), name: record.name, url: record.url }] : [];
  });
  chapters.forEach((chapter, index) => {
    if (chapter.file?.url) uploads.push({ id: `chapter-${index}`, title: `Chapter - ${chapter.name}`, name: chapter.file.name, url: chapter.file.url });
  });
  plates.forEach((plate, index) => {
    if (plate.url) uploads.push({ id: `plate-${index}`, title: `Plate - ${plate.name}`, name: plate.fileName || plate.name, url: plate.url });
  });
  (project?.files || []).forEach((file) => uploads.push({
    id: `project-${String(file.id)}`,
    title: `${uploadSectionLabel(file)} - ${file.fileName}`,
    name: file.fileName,
    url: uploadsApi.getDownloadUrl(file.annexureId),
  }));
  const uniqueUploads = uploads.filter((upload, index) => uploads.findIndex((item) => item.url === upload.url) === index).sort((a, b) => reportOrder(a.title) - reportOrder(b.title));
  const frontMatterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 0);
  const chapterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 1);
  const crossUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 3);
  const plateUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 4);
  const otherUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 5);
  const annexureUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 6);
  const previewPages: Array<{ title?: string; upload?: PreviewUpload; table?: ReportDataTable; graph?: ReportCrossSection; chapter?: ReportChapter }> = [
    ...(frontMatterUploads.length ? [{ title: "Front Matter" }, ...frontMatterUploads.map((upload) => ({ upload }))] : []),
    { title: "Chapters" }, ...chapters.map((chapter) => ({ chapter })), ...chapterUploads.map((upload) => ({ upload })),
    { title: "Cross Sections" }, ...graphs.map((graph) => ({ graph })), ...crossUploads.map((upload) => ({ upload })),
    { title: "Plates and Maps" }, ...plateUploads.map((upload) => ({ upload })), ...otherUploads.map((upload) => ({ upload })),
    ...annexureSections.flatMap((annexure) => [{ title: annexure }, ...tables.filter((table) => annexureMatches(table.title, annexure)).map((table) => ({ table })), ...annexureUploads.filter((upload) => annexureMatches(upload.title, annexure)).map((upload) => ({ upload }))]),
  ];

  const downloadFinalPdf = async () => {
    setDownloading(true);
    try {
      const { document } = await createSectionPdf();
      const skipped: string[] = [];
      const sections: Array<{ title: string; startPage: number }> = [];
      const appendUpload = async (upload: PreviewUpload) => {
        try {
          const startPage = document.getPageCount();
          await appendUploadedDocument(document, upload);
          if (document.getPageCount() > startPage) sections.push({ title: upload.title, startPage });
        } catch (error) {
          console.warn(`Skipping unreadable final-report upload: ${upload.name}`, error);
          skipped.push(upload.name);
        }
      };
      const addSectionTitle = async (title: string) => { const startPage = document.getPageCount(); await appendReportSectionTitle(document, title); sections.push({ title, startPage }); };
      if (frontMatterUploads.length) { await addSectionTitle("Front Matter"); for (const upload of frontMatterUploads) await appendUpload(upload); }
      await addSectionTitle("Chapters");
      if (chapters.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: project?.district || "Punjab", tables: [], graphs: [], chapters }); if (document.getPageCount() > startPage) sections.push({ title: "Chapters", startPage }); }
      for (const upload of chapterUploads) await appendUpload(upload);
      await addSectionTitle("Cross Sections");
      if (graphs.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: project?.district || "Punjab", tables: [], graphs }); if (document.getPageCount() > startPage) sections.push({ title: "Cross Sections", startPage }); }
      for (const upload of crossUploads) await appendUpload(upload);
      await addSectionTitle("Plates and Maps");
      for (const upload of [...plateUploads, ...otherUploads]) await appendUpload(upload);
      for (const annexure of annexureSections) {
        await addSectionTitle(annexure);
        const annexureTables = tables.filter((table) => annexureMatches(table.title, annexure));
        if (annexureTables.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: project?.district || "Punjab", tables: annexureTables, graphs: [] }); if (document.getPageCount() > startPage) sections.push({ title: annexure, startPage }); }
        for (const upload of annexureUploads.filter((item) => annexureMatches(item.title, annexure))) await appendUpload(upload);
      }
      if (document.getPageCount() === 0) throw new Error("No readable uploaded documents found");
      await applyDsrReportFrame(document, sections, project?.district || "Punjab");
      await saveSectionPdf(document, `DSR-Final-Report-${projectId}.pdf`);
      if (skipped.length) toast.warning(`PDF downloaded; ${skipped.length} unreadable upload(s) skipped`);
      else toast.success("Final PDF downloaded with all uploaded annexures");
    } catch (error) {
      console.error(error);
      toast.error("Final PDF download failed: no readable uploads found");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Live Report Preview"
        description="A4 DSR-format preview with section headers, borders, footers and page numbering"
        action={<div className="flex gap-2">
          <button className="module-btn" onClick={() => window.print()}><Printer size={17} />Print</button>
          <button className="module-btn-primary" disabled={downloading || isLoading} onClick={downloadFinalPdf}>
            <Download size={17} />{downloading ? "Generating..." : "Download Final PDF"}
          </button>
        </div>}
      />
      <main className="overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8">
        <article id="report-preview-article" className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center gap-12 bg-white px-4 py-16 shadow-xl md:px-12">
          {!previewPages.length ? (
            <div className="flex min-h-[500px] items-center justify-center text-center text-lg text-slate-500">
              {isLoading ? "Loading uploaded documents..." : "No uploaded documents found. Upload section or annexure files to build the final PDF."}
            </div>
          ) : previewPages.map((page, index) => page.title ? <SectionTitlePage key={`section-${page.title}-${index}`} title={page.title} pageNumber={index + 1} district={project?.district || "Punjab"} /> : page.upload ? <UploadedSection key={page.upload.id} upload={page.upload} pageNumber={index + 1} district={project?.district || "Punjab"} /> : <GeneratedSection key={page.table ? `table-${index}` : page.chapter ? `chapter-${index}` : `graph-${index}`} table={page.table} graph={page.graph} chapter={page.chapter} pageNumber={index + 1} district={project?.district || "Punjab"} />)}
        </article>
      </main>
    </>
  );
}
