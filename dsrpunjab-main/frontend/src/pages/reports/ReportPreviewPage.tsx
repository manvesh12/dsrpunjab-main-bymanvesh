import { Download, FileText, List, Printer, RefreshCw, Save, Settings2, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { get } from "idb-keyval";
import PageHeader from "../../components/layout/PageHeader";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { projectsApi, type ProjectFile } from "../../api/projects.api";
import { uploadsApi } from "../../api/uploads.api";
import { appendGeneratedReportContent, appendReportSectionTitle, appendUploadedDocument, applyDsrReportFrame, createSectionPdf, REFERENCE_FOOTER_LINE2, REPRESENTATIONAL_WATERMARK, saveSectionPdf, uploadedDocumentPageCount, type ReportChapter, type ReportCrossSection, type ReportDataTable, type ReportFrameSettings } from "../../utils/sectionPdf";
import { toast } from "sonner";
import { annexureTemplates } from "../annexures/AnnexureEditorPage";
import { additionalAnnexureTemplates } from "../annexures/AdditionalAnnexureEditorPage";
import ReplenishmentBuilderPage from "../replenishment/ReplenishmentBuilderPage";
import ModelDsrPage from "../replenishment/ModelDsrPage";
import { appendGeneratedContentPage, type ContentEntry } from "../../utils/contentPage";

type UploadRecord = { name: string; url?: string } | null;
type Chapter = ReportChapter & { file?: { name: string; url: string } };
type Plate = { name: string; fileName?: string; url?: string };
type FrontMatterState = {
  coverFile?: UploadRecord;
  certFile?: UploadRecord;
  contentFile?: UploadRecord;
  prefaceFile?: UploadRecord;
};
export type PreviewUpload = { id: string; title: string; name: string; url: string };
type DraftColumn = { key: string; label: string };
type GeneratorTab = "final-dsr" | "replenishment" | "model-dsr";
const annexureSections = ["Annexure I", "Annexure II", "Annexure III", "Annexure IV", "Annexure V", "Annexure VI", "Annexure VII", "Annexure B", "Annexure C", "Annexure D", "Annexure E", "Annexure F", "Annexure G", "Annexure H", "Annexure I (Additional)", "Annexure J", "Annexure K"];
const frameSections = ["Front Matter", "Chapters", "Plates and Maps", ...annexureSections];
const generatorTabs: { id: GeneratorTab; label: string; description: string; icon: typeof FileText }[] = [
  { id: "final-dsr", label: "Final DSR", description: "Generate and download the complete District Survey Report", icon: FileText },
  { id: "replenishment", label: "Replenishment Report", description: "Prepare replenishment study and export PDF/DOCX", icon: RefreshCw },
  { id: "model-dsr", label: "Model DSR", description: "Create selected-section model DSR and download PDF", icon: List },
];
const punjabDistricts = ["Rupnagar"];

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

function uploadIdentity(upload: PreviewUpload) {
  try {
    const parsed = new URL(upload.url, window.location.origin);
    const downloadId = parsed.pathname.match(/\/(?:api\/)?files\/download\/([^/]+)$/i)?.[1];
    if (downloadId) return `file:${decodeURIComponent(downloadId).toLowerCase()}`;
    return `url:${parsed.origin.toLowerCase()}${parsed.pathname.toLowerCase()}`;
  } catch {
    return `url:${upload.url.split(/[?#]/, 1)[0].toLowerCase()}`;
  }
}

export function SectionTitlePage({ title, pageNumber, district, headerText, footerText, footerText2, showWatermark }: { title: string; pageNumber: number; district: string; headerText: string; footerText: string; footerText2?: string; showWatermark: boolean }) {
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col items-center justify-center overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    {showWatermark && <PreviewWatermark />}
    <header className="absolute left-16 right-16 top-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">{headerText}</p><p className="text-[12px] italic">{district} District</p><p className="text-[12px] italic">Punjab</p></header>
    <h1 className="mx-16 border-b border-black pb-4 text-center font-serif text-3xl font-bold uppercase">{title}</h1>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span><span className="block font-bold uppercase">{footerText}</span>{footerText2 && <span className="mt-0.5 block">{footerText2}</span>}</span><span>{pageNumber} | Page</span></footer>
  </section>;
}

export function GeneratedSection({ table, tables, graph, chapter, pageNumber, district, headerText, footerText, footerText2, showWatermark }: { table?: ReportDataTable; tables?: ReportDataTable[]; graph?: ReportCrossSection; chapter?: ReportChapter; pageNumber: number; district: string; headerText: string; footerText: string; footerText2?: string; showWatermark: boolean }) {
  const displayedTables = tables || (table ? [table] : []);
  const heading = displayedTables[0]?.title || chapter?.name || graph?.name || "Cross Section Sand Bar";
  const points = String(graph?.post || "").split(",").map(Number).filter(Number.isFinite);
  const levels = [...points, Number(graph?.red), Number(graph?.thal)].filter(Number.isFinite);
  const min = levels.length ? Math.min(...levels) : 0;
  const max = levels.length ? Math.max(...levels) : 1;
  const svgPoints = points.map((value, index) => `${20 + index * (250 / Math.max(points.length - 1, 1))},${110 - ((value - min) / Math.max(max - min, .1)) * 82}`).join(" ");
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    {showWatermark && <PreviewWatermark />}
    <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">{headerText}</p><p className="text-[12px] italic">{district} District</p><p className="text-[12px] italic">Punjab</p><p className="mt-1 text-[10px]">{heading}</p></header>
    <div className="relative mx-14 mb-12 mt-4 min-h-0 flex-1 overflow-auto font-serif">
      {displayedTables.length ? <div className="space-y-4">{displayedTables.map((currentTable, tableIndex) => <section key={`${currentTable.title}-${tableIndex}`} className="break-inside-avoid"><h2 className="mb-1.5 font-serif text-[11px] font-bold">{currentTable.title}</h2><table className="w-full table-fixed border-collapse font-serif text-[10px] leading-[1.35]"><thead><tr>{currentTable.columns.map((column) => <th key={column.key} className="border border-black bg-white p-1.5 text-left align-top font-bold">{column.label}</th>)}</tr></thead><tbody>{currentTable.rows.length ? currentTable.rows.map((row, index) => <tr key={index} className="break-inside-avoid">{currentTable.columns.map((column) => <td key={column.key} className="whitespace-pre-line break-words border border-black bg-white p-1.5 align-top">{row[column.key] || "-"}</td>)}</tr>) : <tr><td className="border border-black bg-white p-3 text-center text-slate-500" colSpan={Math.max(currentTable.columns.length, 1)}>No data entered yet</td></tr>}</tbody></table></section>)}</div> : chapter ? <><h2 className="mb-8 text-center text-xl font-bold uppercase">{chapter.name}</h2><div className="border-t border-black pt-6 text-[13px] leading-7 whitespace-pre-wrap">{chapter.summary || "Chapter content will appear here once it is entered and saved in the chapter editor."}</div></> : <><h2 className="mb-2 text-center text-sm font-bold">CROSS SECTION SAND BAR</h2><p className="text-center text-xs font-bold">{heading}</p><svg viewBox="0 0 290 140" className="mx-auto mt-5 w-full max-w-md border border-slate-300"><line x1="20" y1="110" x2="270" y2="110" stroke="#64748b"/><line x1="20" y1="20" x2="20" y2="110" stroke="#64748b"/><polyline points={svgPoints} fill="none" stroke="#b86d32" strokeWidth="2"/>{Number.isFinite(Number(graph?.red)) && <line x1="20" y1={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} stroke="#dc2626"/>}{Number.isFinite(Number(graph?.thal)) && <line x1="20" y1={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} stroke="#2563eb"/>}</svg><div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><p>Area: {graph?.area || "-"} Ha</p><p>Bulk density: {graph?.bulk || "-"}</p><p>Post monsoon: {graph?.post || "-"}</p><p>Mining: {graph?.pct || "-"}%</p></div></>}
    </div>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span><span className="block font-bold uppercase">{footerText}</span>{footerText2 && <span className="mt-0.5 block">{footerText2}</span>}</span><span>{pageNumber} | Page</span></footer>
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

function PreviewWatermark() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
    <span className="-rotate-[32deg] whitespace-nowrap font-serif text-[46px] font-bold tracking-[0.08em] text-slate-600/[0.18]">{REPRESENTATIONAL_WATERMARK}</span>
  </div>;
}

function GeneratedContentsSection({ entries, pageNumber, district, headerText, footerText, footerText2, showWatermark }: { entries: ContentEntry[]; pageNumber: number; district: string; headerText: string; footerText: string; footerText2?: string; showWatermark: boolean }) {
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    {showWatermark && <PreviewWatermark />}
    <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">{headerText}</p><p className="text-[12px] italic">{district} District</p><p className="text-[12px] italic">Punjab</p></header>
    <div className="relative mx-14 mb-16 mt-4 min-h-0 flex-1 overflow-hidden font-serif">
      <h2 className="mb-4 text-center text-xl font-bold">Content</h2>
      <table className="w-full table-fixed border-collapse text-[10px]"><thead><tr><th className="w-24 border border-black p-2">Chapter No.</th><th className="border border-black p-2">Subject</th><th className="w-24 border border-black p-2">Page No.</th></tr></thead><tbody>{entries.map((entry) => <tr key={`${entry.chapterNo}-${entry.subject}`}><td className="border border-black p-2 text-center">{entry.chapterNo}</td><td className="border border-black p-2">{entry.subject}</td><td className="border border-black p-2 text-center">{entry.pageLabel}</td></tr>)}</tbody></table>
    </div>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span><span className="block font-bold uppercase">{footerText}</span>{footerText2 && <span className="mt-0.5 block">{footerText2}</span>}</span><span>{pageNumber} | Page</span></footer>
  </section>;
}

export function UploadedSection({ upload, pageNumber, sourcePageNumber = 1, district, headerText, footerText, footerText2, preserveUploadedFrame = false, showWatermark }: { upload: PreviewUpload; pageNumber: number; sourcePageNumber?: number; district: string; headerText: string; footerText: string; footerText2?: string; preserveUploadedFrame?: boolean; showWatermark: boolean }) {
  if (preserveUploadedFrame) return (
    <section className="dsr-preview-page relative aspect-[1/1.414] w-full max-w-[794px] overflow-hidden bg-white text-black shadow-xl">
      <UploadedFilePreview src={upload.url} pdfPage={sourcePageNumber} title={`${upload.title} - PDF page ${sourcePageNumber}`} alt={upload.title} className="h-full w-full bg-white" imageStyle={{ objectFit: "contain" }} />
      {showWatermark && <PreviewWatermark />}
      <span className="absolute bottom-[5.7%] right-[7%] z-20 bg-white px-2 py-1 font-serif text-[9px]">{pageNumber} | Page</span>
    </section>
  );
  return (
    <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
      <div className="pointer-events-none absolute inset-4 border border-black" />
      {showWatermark && <PreviewWatermark />}
      <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight">
        <p className="text-[15px] italic">{headerText}</p>
        <p className="max-w-[520px] text-[12px] italic">{district} District</p>
        <p className="max-w-[520px] text-[12px] italic">Punjab</p>
      </header>
      <div className="relative mx-14 mb-12 mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <UploadedFilePreview src={upload.url} pdfPage={sourcePageNumber} title={`${upload.title} - PDF page ${sourcePageNumber}`} alt={upload.title} className="h-full w-full bg-white" imageStyle={{ objectFit: "contain" }} />
      </div>
      <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]">
        <span><span className="block font-bold uppercase">{footerText}</span>{footerText2 && <span className="mt-0.5 block">{footerText2}</span>}</span>
        <span>{pageNumber} | Page</span>
      </footer>
    </section>
  );
}

export default function ReportPreviewPage() {
  const { projectId = "default" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeGeneratorTab, setActiveGeneratorTab] = useState<GeneratorTab>(
    initialTab === "replenishment" || initialTab === "model-dsr" ? initialTab : "final-dsr"
  );
  const [downloading, setDownloading] = useState(false);
  const [tables, setTables] = useState<ReportDataTable[]>([]);
  const [draftChapters, setDraftChapters] = useState<Chapter[]>([]);
  const [draftPlates, setDraftPlates] = useState<Plate[]>([]);
  const [frameSettings, setFrameSettings] = useState<ReportFrameSettings>({});
  const [selectedFrameSection, setSelectedFrameSection] = useState("Chapters");
  const [savingFormat, setSavingFormat] = useState(false);
  const [pageManagerOpen, setPageManagerOpen] = useState(false);
  const [pageManagerLoading, setPageManagerLoading] = useState(false);
  const [pageManagerUrl, setPageManagerUrl] = useState("");
  const [pageManagerPageCount, setPageManagerPageCount] = useState(0);
  const [excludedReportPages, setExcludedReportPages] = useState<Set<number>>(new Set());
  const [uploadPageCounts, setUploadPageCounts] = useState<Record<string, number>>({});
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, "preview"],
    queryFn: () => projectsApi.get(projectId),
    enabled: /^\d+$/.test(projectId),
  });

  const state = project?.projectState || {};
  const storedDistrict = String(project?.district || "").trim();
  const projectLabel = `${project?.title || ""} ${project?.projectName || ""}`.toLowerCase();
  const inferredDistrict = punjabDistricts.find((item) => projectLabel.includes(item.toLowerCase()));
  const reportDistrict = storedDistrict && storedDistrict.toLowerCase() !== "punjab" ? storedDistrict : inferredDistrict || "Punjab";
  const frontMatter = state["front-matter"] as FrontMatterState | undefined;
  const chaptersState = state.chapters as { chapters?: Chapter[] } | Chapter[] | undefined;
  const platesState = state.plates as { plates?: Plate[] } | Plate[] | undefined;
  const chapters = Array.isArray(chaptersState) ? chaptersState : chaptersState?.chapters || [];
  const plates = Array.isArray(platesState) ? platesState : platesState?.plates || [];
  const reportChapters = chapters.length ? chapters : draftChapters;
  const reportPlates = plates.length ? plates : draftPlates;

  useEffect(() => {
    const saved = state["report-format"] as ReportFrameSettings | undefined;
    if (saved) {
      setFrameSettings(saved);
      setIncludeWatermark(Boolean(saved.showWatermark));
    }
  }, [project?.id]);

  useEffect(() => () => {
    if (pageManagerUrl) URL.revokeObjectURL(pageManagerUrl);
  }, [pageManagerUrl]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "replenishment" || tab === "model-dsr" || tab === "final-dsr") setActiveGeneratorTab(tab);
  }, [searchParams]);

  const changeGeneratorTab = (tab: GeneratorTab) => {
    setActiveGeneratorTab(tab);
    setSearchParams(tab === "final-dsr" ? {} : { tab });
  };

  const selectedOverride = frameSettings.sectionOverrides?.[selectedFrameSection] || {};
  const sectionDisplayName = (section: string) => frameSettings.sectionTitles?.[section]?.trim() || section;
  const saveFormat = async () => {
    if (!/^\d+$/.test(projectId) || !project) return;
    setSavingFormat(true);
    try {
      await projectsApi.updateState(projectId, { state: { ...state, "report-format": frameSettings } });
      toast.success("Report header and footer settings saved");
    } catch (error) { console.error(error); toast.error("Could not save report format settings"); }
    finally { setSavingFormat(false); }
  };


  const setSelectedOverride = (field: "headerText" | "footerText" | "footerText2", value: string) => setFrameSettings((current) => ({ ...current, sectionOverrides: { ...current.sectionOverrides, [selectedFrameSection]: { ...current.sectionOverrides?.[selectedFrameSection], [field]: value } } }));

  useEffect(() => {
    let active = true;
    const loadDraftTables = async () => {
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
      const locations = [...Array.from({ length: 7 }, (_, annexure) => {
        const key = String(annexure + 1);
        const storageKey = key === "4" || key === "5" || key === "7" ? `${key}-v2` : key;
        return { label: `Annexure ${roman[annexure]}`, key, storageKey, count: 8 };
      }), ...["f", "j", "k"].map((key) => ({ label: `Annexure ${key.toUpperCase()}`, key, storageKey: key, count: 4 }))];
      const makeColumns = (labels: string[]) => labels.map((label) => ({ key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label }));
      const result: Array<ReportDataTable & { source: string }> = [
        ...Object.entries(annexureTemplates).flatMap(([key, template], annexureIndex) => template.items.map((item, index) => ({ source: `${key}-${index}`, title: `Annexure ${roman[annexureIndex]} - ${item.title}`, columns: makeColumns(item.columns), rows: [] }))),
        ...Object.entries(additionalAnnexureTemplates).flatMap(([key, items]) => items.map((item, index) => ({ source: `${key.toLowerCase()}-${index}`, title: `Annexure ${key} - ${item.title}`, columns: makeColumns(item.columns), rows: [] }))),
      ];
      for (const location of locations) for (let index = 0; index < location.count; index += 1) {
        const base = `dsr:project-${projectId}:annexure-${location.storageKey}-${index}`;
        const [rows, title, columns] = await Promise.all([get<unknown>(base), get<unknown>(`${base}:title`), get<unknown>(`${base}:columns`)]);
        if (!Array.isArray(rows) && !Array.isArray(columns)) continue;
        const validColumns = Array.isArray(columns) ? columns.filter((column): column is DraftColumn => Boolean(column && typeof column === "object" && "key" in column && "label" in column)) : [];
        if (!validColumns.length) continue;
        const tableName = typeof title === "string" && title.trim() ? title.trim() : `Table ${index + 1}`;
        const replacement = { source: `${location.key}-${index}`, title: `${location.label} - ${tableName}`, columns: validColumns, rows: Array.isArray(rows) ? rows as Record<string, string>[] : [] };
        const existingIndex = result.findIndex((table) => table.source === replacement.source);
        if (existingIndex >= 0) result[existingIndex] = replacement;
        else result.push(replacement);
      }
      const [storedChapters, storedPlates] = await Promise.all([get<unknown>("dsr:chapters-exact"), get<unknown>("dsr:plates-exact")]);
      if (active) { setTables(result.map(({ source: _source, ...table }) => table)); if (Array.isArray(storedChapters)) setDraftChapters(storedChapters as Chapter[]); if (Array.isArray(storedPlates)) setDraftPlates(storedPlates as Plate[]); }
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
  reportChapters.forEach((chapter, index) => {
    if (chapter.file?.url) uploads.push({ id: `chapter-${index}`, title: `Chapter - ${chapter.name}`, name: chapter.file.name, url: chapter.file.url });
  });
  reportPlates.forEach((plate, index) => {
    if (plate.url) uploads.push({ id: `plate-${index}`, title: `Plate - ${plate.name}`, name: plate.fileName || plate.name, url: plate.url });
  });
  const hasSavedFrontMatter = Boolean(frontMatter?.coverFile?.url || frontMatter?.certFile?.url || frontMatter?.contentFile?.url || frontMatter?.prefaceFile?.url);
  (project?.files || []).forEach((file) => {
    const sectionLabel = uploadSectionLabel(file);
    // The file register retains replaced uploads. Once the current Front
    // Matter slots are saved in project state, those slots are authoritative
    // and historical register entries must not reappear in the final report.
    if (hasSavedFrontMatter && sectionLabel === "Front Matter") return;
    uploads.push({
      id: `project-${String(file.id)}`,
      title: `${sectionLabel} - ${file.fileName}`,
      name: file.fileName,
      url: uploadsApi.getDownloadUrl(file.annexureId),
    });
  });
  const seenUploadIds = new Set<string>();
  const uniqueUploads = uploads.filter((upload) => {
    const identity = uploadIdentity(upload);
    if (seenUploadIds.has(identity)) return false;
    seenUploadIds.add(identity);
    return true;
  }).sort((a, b) => reportOrder(a.title) - reportOrder(b.title));
  const frontMatterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 0);
  const chapterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 1);
  const plateUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 4);
  const otherUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 5);
  const annexureUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 6);
  const chapterUploadUrls = new Set(reportChapters.map((chapter) => chapter.file?.url).filter(Boolean));
  const unmatchedChapterUploads = chapterUploads.filter((upload) => !chapterUploadUrls.has(upload.url));
  const chapterUploadKey = chapterUploads.map((upload) => `${upload.url}:${upload.name}`).join("|");
  const autoGenerateContents = frameSettings.autoGenerateContents !== false;

  useEffect(() => {
    let active = true;
    void Promise.all(chapterUploads.map(async (upload) => {
      try {
        return [upload.url, await uploadedDocumentPageCount(upload)] as const;
      } catch (error) {
        console.warn(`Could not count pages in ${upload.name}`, error);
        return [upload.url, 1] as const;
      }
    })).then((entries) => {
      if (active) setUploadPageCounts(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [chapterUploadKey]);

  const uploadedPreviewPages = (upload: PreviewUpload) =>
    Array.from({ length: Math.max(uploadPageCounts[upload.url] || 1, 1) }, (_, sourcePageNumber) => ({
      sectionName: "Chapters",
      upload,
      sourcePageNumber: sourcePageNumber + 1,
    }));
  const chapterPreviewPages = reportChapters.flatMap((chapter) => {
    const upload = chapter.file?.url
      ? chapterUploads.find((item) => item.url === chapter.file?.url)
      : undefined;
    return upload ? [...(frameSettings.chapterTitlePages !== false ? [{ sectionName: "Chapters", chapterTitle: chapter.name }] : []), ...uploadedPreviewPages(upload)] : [];
  });
  const frontPreviewPages = frontMatterUploads.filter((upload) => !autoGenerateContents || upload.id !== "contents").map((upload) => ({ sectionName: "Front Matter", upload }));
  if (autoGenerateContents) {
    const certificateIndex = frontPreviewPages.findIndex((page) => page.upload.id === "certificate");
    const coverIndex = frontPreviewPages.findIndex((page) => page.upload.id === "cover");
    const insertAt = certificateIndex >= 0 ? certificateIndex + 1 : coverIndex >= 0 ? coverIndex + 1 : 0;
    const expectedRows = reportChapters.filter((chapter) => chapter.file?.url).length + 1 + annexureSections.length;
    const expectedContentPages = Math.max(1, Math.ceil(expectedRows / 18));
    const contentPages = Array.from({ length: expectedContentPages }, (_, contentsPageIndex) => ({ sectionName: "Front Matter", contents: true, contentsPageIndex }));
    frontPreviewPages.splice(insertAt, 0, ...(contentPages as Array<typeof frontPreviewPages[number] & { contents: boolean; contentsPageIndex: number }>));
  }
  const previewPages: Array<{ sectionName: string; title?: string; chapterTitle?: string; upload?: PreviewUpload; sourcePageNumber?: number; table?: ReportDataTable; graph?: ReportCrossSection; chapter?: ReportChapter; contents?: boolean; contentsPageIndex?: number }> = [
    ...frontPreviewPages,
    ...chapterPreviewPages, ...unmatchedChapterUploads.flatMap(uploadedPreviewPages),
    { sectionName: "Plates and Maps", title: "Plates and Maps" }, ...plateUploads.map((upload) => ({ sectionName: "Plates and Maps", upload })), ...otherUploads.map((upload) => ({ sectionName: "Plates and Maps", upload })),
    ...annexureSections.flatMap((annexure) => [{ sectionName: annexure, title: annexure }, ...tables.filter((table) => annexureMatches(table.title, annexure)).map((table) => ({ sectionName: annexure, table })), ...annexureUploads.filter((upload) => annexureMatches(upload.title, annexure)).map((upload) => ({ sectionName: annexure, upload }))]),
  ];
  const previewMarkers = previewPages.flatMap((page, pageIndex) => {
    if (page.chapterTitle) return [];
    const chapterIndex = page.upload ? reportChapters.findIndex((chapter) => chapter.file?.url === page.upload?.url) : -1;
    if (chapterIndex >= 0 && (!page.sourcePageNumber || page.sourcePageNumber === 1)) return [{ chapterNo: chapterIndex + 1, subject: reportChapters[chapterIndex].name.replace(/^\s*chapter\s+\d+\s*[-:–—.]?\s*/i, ""), startPage: pageIndex }];
    if (page.title && (page.sectionName === "Plates and Maps" || page.sectionName.startsWith("Annexure"))) return [{ chapterNo: page.sectionName.startsWith("Annexure") ? page.sectionName.replace("Annexure ", "") : "-", subject: sectionDisplayName(page.sectionName), startPage: pageIndex }];
    return [];
  });
  const previewContentEntries: ContentEntry[] = previewMarkers.map((marker, markerIndex) => {
    const endPage = (previewMarkers[markerIndex + 1]?.startPage || previewPages.length) - 1;
    return { chapterNo: marker.chapterNo, subject: marker.subject, pageCount: endPage - marker.startPage + 1, pageLabel: marker.startPage === endPage ? String(marker.startPage + 1) : `${marker.startPage + 1} - ${endPage + 1}` };
  });

  const reportSections = previewPages.flatMap((page, pageIndex) => {
    let label = "";
    if (page.chapterTitle) label = page.chapterTitle;
    else if (page.contents) label = page.contentsPageIndex ? `Content Page ${page.contentsPageIndex + 1}` : "Content Page";
    else if (page.sectionName === "Front Matter" && page.upload) label = page.upload.title;
    else if (page.title) label = sectionDisplayName(page.sectionName);
    else if (page.sectionName === "Chapters" && page.upload && !reportChapters.length) label = page.upload.title;
    if (!label) return [];
    return [{
      id: `report-page-nav-${pageIndex}`,
      label,
      pageIndex,
    }];
  });
  const reportSectionIds = reportSections.map(({ id }) => id).join("|");

  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!reportSections.length) return;
    setActiveSection((current) => reportSections.some(({ id }) => id === current) ? current : reportSections[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    reportSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [reportSectionIds]);

  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const buildFinalPdf = async (excludedPages: ReadonlySet<number> = new Set()) => {
      const { document } = await createSectionPdf();
      const skipped: string[] = [];
      const sections: Array<{ title: string; startPage: number }> = [];
      const preformattedPages = new Set<number>();
      const tocMarkers: Array<{ chapterNo: number | string; subject: string; startPage: number }> = [];
      let generatedContentsIndex = -1;
      const appendUpload = async (upload: PreviewUpload, sectionName: string, preserveUploadedFrame = false, matchLivePreview = false) => {
        try {
          const startPage = document.getPageCount();
          await appendUploadedDocument(document, upload, { preserveOriginalPage: preserveUploadedFrame, renderPdfPagesAsImages: matchLivePreview });
          const endPage = document.getPageCount();
          if (endPage > startPage) {
            if (preserveUploadedFrame) {
              for (let pageIndex = startPage; pageIndex < endPage; pageIndex += 1) preformattedPages.add(pageIndex);
            }
            // Frame settings are saved against the report section (for example
            // "Chapters"), not the individual uploaded file title.
            sections.push({ title: sectionName, startPage });
          }
        } catch (error) {
          console.warn(`Skipping unreadable final-report upload: ${upload.name}`, error);
          skipped.push(upload.name);
        }
      };
      const addSectionTitle = async (section: string) => { const startPage = document.getPageCount(); await appendReportSectionTitle(document, sectionDisplayName(section)); sections.push({ title: section, startPage }); };
      const addChapterTitle = async (title: string) => {
        const startPage = document.getPageCount();
        await appendReportSectionTitle(document, title);
        sections.push({ title: "Chapters", startPage });
      };
      if (autoGenerateContents) {
        const beforeContents = frontMatterUploads.filter((upload) => upload.id === "cover" || upload.id === "certificate");
        for (const upload of beforeContents) await appendUpload(upload, "Front Matter");
        generatedContentsIndex = document.getPageCount();
        document.addPage([595.28, 841.89]);
        sections.push({ title: "Front Matter", startPage: generatedContentsIndex });
        for (const upload of frontMatterUploads.filter((upload) => upload.id !== "contents" && !beforeContents.includes(upload))) await appendUpload(upload, "Front Matter");
      } else {
        for (const upload of frontMatterUploads) await appendUpload(upload, "Front Matter");
      }
      for (let chapterIndex = 0; chapterIndex < reportChapters.length; chapterIndex += 1) {
        const chapter = reportChapters[chapterIndex];
        const upload = chapter.file?.url
          ? chapterUploads.find((item) => item.url === chapter.file?.url)
          : undefined;
        if (upload) {
          tocMarkers.push({ chapterNo: chapterIndex + 1, subject: chapter.name.replace(/^\s*chapter\s+\d+\s*[-:–—.]?\s*/i, ""), startPage: document.getPageCount() });
          if (frameSettings.chapterTitlePages !== false) await addChapterTitle(chapter.name);
          await appendUpload(upload, "Chapters", false, true);
        }
      }
      for (const upload of unmatchedChapterUploads) await appendUpload(upload, "Chapters", false, true);
      tocMarkers.push({ chapterNo: "-", subject: sectionDisplayName("Plates and Maps"), startPage: document.getPageCount() });
      await addSectionTitle("Plates and Maps");
      for (const upload of [...plateUploads, ...otherUploads]) await appendUpload(upload, "Plates and Maps");
      for (const annexure of annexureSections) {
        tocMarkers.push({ chapterNo: annexure.replace("Annexure ", ""), subject: sectionDisplayName(annexure), startPage: document.getPageCount() });
        await addSectionTitle(annexure);
        const annexureTables = tables.filter((table) => annexureMatches(table.title, annexure));
        if (annexureTables.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: reportDistrict, tables: annexureTables, graphs: [] }); if (document.getPageCount() > startPage) sections.push({ title: annexure, startPage }); }
        for (const upload of annexureUploads.filter((item) => annexureMatches(item.title, annexure))) await appendUpload(upload, annexure);
      }
      if (document.getPageCount() === 0) throw new Error("No readable uploaded documents found");
      if (autoGenerateContents && generatedContentsIndex >= 0) {
        const makeContentEntries = (extraContentsPages: number): ContentEntry[] => tocMarkers.map((marker, markerIndex) => {
          const startPage = marker.startPage + extraContentsPages;
          const endPage = (tocMarkers[markerIndex + 1]?.startPage || document.getPageCount()) - 1 + extraContentsPages;
          return {
            chapterNo: marker.chapterNo,
            subject: marker.subject,
            pageCount: endPage - startPage + 1,
            pageLabel: startPage === endPage ? String(startPage + 1) : `${startPage + 1} - ${endPage + 1}`,
          };
        });
        const { document: provisionalContents } = await createSectionPdf();
        await appendGeneratedContentPage(provisionalContents, makeContentEntries(0));
        const extraContentsPages = provisionalContents.getPageCount() - 1;
        const { document: contentsDocument } = await createSectionPdf();
        await appendGeneratedContentPage(contentsDocument, makeContentEntries(extraContentsPages));
        const contentsPages = await document.copyPages(contentsDocument, contentsDocument.getPageIndices());
        document.removePage(generatedContentsIndex);
        contentsPages.forEach((contentsPage, offset) => document.insertPage(generatedContentsIndex + offset, contentsPage));
        if (extraContentsPages) {
          sections.forEach((item) => { if (item.startPage > generatedContentsIndex) item.startPage += extraContentsPages; });
          const shiftedPreformatted = [...preformattedPages].map((pageIndex) => pageIndex > generatedContentsIndex ? pageIndex + extraContentsPages : pageIndex);
          preformattedPages.clear();
          shiftedPreformatted.forEach((pageIndex) => preformattedPages.add(pageIndex));
        }
      }

      let finalSections = sections;
      let finalPreformattedPages = preformattedPages;
      if (excludedPages.size) {
        const oldPageCount = document.getPageCount();
        const keptOldIndexes = Array.from({ length: oldPageCount }, (_, index) => index).filter((index) => !excludedPages.has(index));
        if (!keptOldIndexes.length) throw new Error("At least one page must remain in the final report");

        const remappedSections: Array<{ title: string; startPage: number }> = [];
        let lastSectionTitle = "";
        keptOldIndexes.forEach((oldIndex, newIndex) => {
          const activeSection = sections.filter((item) => item.startPage <= oldIndex).at(-1);
          if (activeSection && activeSection.title !== lastSectionTitle) {
            remappedSections.push({ title: activeSection.title, startPage: newIndex });
            lastSectionTitle = activeSection.title;
          }
        });
        [...excludedPages].filter((index) => index >= 0 && index < oldPageCount).sort((a, b) => b - a).forEach((index) => document.removePage(index));
        finalSections = remappedSections;
        finalPreformattedPages = new Set(keptOldIndexes.flatMap((oldIndex, newIndex) => preformattedPages.has(oldIndex) ? [newIndex] : []));
      }

      await applyDsrReportFrame(document, finalSections, reportDistrict, { ...frameSettings, showWatermark: includeWatermark }, finalPreformattedPages);
      return { document, skipped };
  };

  const downloadFinalPdf = async () => {
    setDownloading(true);
    try {
      const { document, skipped } = await buildFinalPdf(excludedReportPages);
      await saveSectionPdf(document, `DSR-Final-Report-${projectId}.pdf`);
      if (skipped.length) toast.warning(`PDF downloaded; ${skipped.length} unreadable upload(s) skipped`);
      else if (excludedReportPages.size) toast.success(`Final PDF downloaded with ${excludedReportPages.size} selected page(s) removed`);
      else toast.success("Final PDF downloaded with all uploaded annexures");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Final PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  const openPageManager = async () => {
    setPageManagerOpen(true);
    setPageManagerLoading(true);
    try {
      const { document } = await buildFinalPdf();
      const bytes = await document.save();
      const nextUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      setPageManagerUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setPageManagerPageCount(document.getPageCount());
      setExcludedReportPages((current) => new Set([...current].filter((index) => index < document.getPageCount())));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not prepare report pages");
      setPageManagerOpen(false);
    } finally {
      setPageManagerLoading(false);
    }
  };

  const toggleReportPage = (index: number) => setExcludedReportPages((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Final Report Generator"
        description="Generate, preview and download Final DSR, Replenishment Report and Model DSR from one workspace"
        action={activeGeneratorTab === "final-dsr" ? <div className="flex gap-2">
          <button className="module-btn" onClick={() => window.print()}><Printer size={17} />Print</button>
          <button className="module-btn" disabled={pageManagerLoading || isLoading} onClick={openPageManager}>
            <Trash2 size={17} />{excludedReportPages.size ? `Manage Pages (${excludedReportPages.size})` : "Manage Pages"}
          </button>
          <button className="module-btn-primary" disabled={downloading || isLoading} onClick={downloadFinalPdf}>
            <Download size={17} />{downloading ? "Generating..." : "Download Final PDF"}
          </button>
        </div> : undefined}
      />
      <section className="mb-5 border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-slate-700">
          {generatorTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeGeneratorTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeGeneratorTab(tab.id)}
                className={`flex min-h-20 items-start gap-3 bg-white px-4 py-3 text-left transition dark:bg-slate-900 ${active ? "border-t-4 border-[#e9a319] text-[#123c6e] dark:text-blue-300" : "border-t-4 border-transparent text-slate-600 hover:bg-[#f4f7fa] dark:text-slate-300 dark:hover:bg-slate-800"}`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${active ? "border-[#b9c9d9] bg-[#eaf0f7]" : "border-slate-200 bg-slate-50"} dark:border-slate-700 dark:bg-slate-800`}>
                  <Icon size={17} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold">{tab.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {activeGeneratorTab === "replenishment" && <ReplenishmentBuilderPage />}
      {activeGeneratorTab === "model-dsr" && <ModelDsrPage />}
      {activeGeneratorTab === "final-dsr" && (
      <>
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"><Settings2 size={16} /> Report Header &amp; Footer Settings</div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div><p className="text-xs font-bold text-slate-800">Representational watermark</p><p className="mt-0.5 text-xs text-slate-500">Choose whether “REPRESENTATIONAL DATA ONLY” appears behind every report page.</p></div>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
            <button type="button" onClick={() => setIncludeWatermark(true)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${includeWatermark ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>With Watermark</button>
            <button type="button" onClick={() => setIncludeWatermark(false)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${!includeWatermark ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Without Watermark</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <label className="text-xs font-semibold text-slate-600">Default header<input value={frameSettings.headerText || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, headerText: event.target.value }))} placeholder="District Survey Report" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Default footer<input value={frameSettings.footerText || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, footerText: event.target.value }))} placeholder={`PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${reportDistrict.toUpperCase()} DISTRICT`} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Default footer second line<input value={frameSettings.footerText2 || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, footerText2: event.target.value }))} placeholder={REFERENCE_FOOTER_LINE2} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Section override<select value={selectedFrameSection} onChange={(event) => setSelectedFrameSection(event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal">{frameSections.map((section) => <option key={section}>{section}</option>)}</select></label>
          <button className="module-btn-primary justify-center" disabled={savingFormat} onClick={saveFormat}><Save size={16} />{savingFormat ? "Saving..." : "Save Format"}</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600">{selectedFrameSection} section heading<input value={frameSettings.sectionTitles?.[selectedFrameSection] || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, sectionTitles: { ...current.sectionTitles, [selectedFrameSection]: event.target.value } }))} placeholder={`Uses \"${selectedFrameSection}\" if empty`} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-xs text-slate-600">{selectedFrameSection} header<input value={selectedOverride.headerText || ""} onChange={(event) => setSelectedOverride("headerText", event.target.value)} placeholder="Uses default header if empty" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-xs text-slate-600">{selectedFrameSection} footer<input value={selectedOverride.footerText || ""} onChange={(event) => setSelectedOverride("footerText", event.target.value)} placeholder="Uses default footer if empty" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-xs text-slate-600">{selectedFrameSection} footer second line<input value={selectedOverride.footerText2 || ""} onChange={(event) => setSelectedOverride("footerText2", event.target.value)} placeholder="Uses default second line if empty" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        </div>
      </section>
      <main className="rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8">
        {reportSections.length > 0 && (
          <div className="sticky top-3 z-20 mb-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur lg:hidden">
            <label htmlFor="report-section-select" className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><List size={15} /> Jump to section</label>
            <select id="report-section-select" value={activeSection} onChange={(event) => goToSection(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              {reportSections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
          </div>
        )}
        <div className="mx-auto flex max-w-[1500px] items-start gap-6">
          {reportSections.length > 0 && (
            <aside className="sticky top-4 hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-md lg:block">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 font-bold text-slate-800"><List size={18} className="text-blue-600" /> Report sections</div>
              <nav aria-label="Report sections" className="max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto pr-1">
                {reportSections.map((section) => <button key={section.id} type="button" onClick={() => goToSection(section.id)} aria-current={activeSection === section.id ? "location" : undefined} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeSection === section.id ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{section.label}</button>)}
              </nav>
            </aside>
          )}
        <article id="report-preview-article" className="flex min-h-screen min-w-0 flex-1 flex-col items-center gap-12 bg-white px-4 py-16 shadow-xl md:px-12">
          {!previewPages.length ? (
            <div className="flex min-h-[500px] items-center justify-center text-center text-lg text-slate-500">
            {isLoading ? "Loading uploaded documents..." : "No uploaded documents found. Upload section or annexure files to build the final PDF."}
            </div>
          ) : previewPages.map((page, index) => {
            const override = frameSettings.sectionOverrides?.[page.sectionName];
            const headerText = override?.headerText || frameSettings.headerText || "District Survey Report";
            const footerText = override?.footerText || frameSettings.footerText || `PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${reportDistrict.toUpperCase()} DISTRICT`;
            const footerText2 = override?.footerText2 || frameSettings.footerText2 || "";
            const showWatermark = includeWatermark;
            
            const sectionId = reportSections.find((item) => item.pageIndex === index)?.id;
            const content = page.contents
              ? <GeneratedContentsSection entries={previewContentEntries.slice((page.contentsPageIndex || 0) * 18, ((page.contentsPageIndex || 0) + 1) * 18)} pageNumber={index + 1} district={reportDistrict} headerText={headerText} footerText={footerText} footerText2={footerText2} showWatermark={showWatermark} />
              : page.chapterTitle
                ? <SectionTitlePage title={page.chapterTitle} pageNumber={index + 1} district={reportDistrict} headerText={headerText} footerText={footerText} footerText2={footerText2} showWatermark={showWatermark} />
                : page.title
                  ? <SectionTitlePage title={sectionDisplayName(page.title)} pageNumber={index + 1} district={reportDistrict} headerText={headerText} footerText={footerText} footerText2={footerText2} showWatermark={showWatermark} />
                  : page.upload
                    ? <UploadedSection upload={page.upload} sourcePageNumber={page.sourcePageNumber} pageNumber={index + 1} district={reportDistrict} headerText={headerText} footerText={footerText} footerText2={footerText2} showWatermark={showWatermark} />
                    : <GeneratedSection table={page.table} graph={page.graph} chapter={page.chapter} pageNumber={index + 1} district={reportDistrict} headerText={headerText} footerText={footerText} footerText2={footerText2} showWatermark={showWatermark} />;
            return <div key={page.chapterTitle ? `chapter-title-${page.chapterTitle}-${index}` : page.title ? `section-${page.title}-${index}` : page.upload ? `${page.upload.id}-source-page-${page.sourcePageNumber || 1}` : `generated-${index}`} id={sectionId} className="flex w-full scroll-mt-24 justify-center">{content}</div>;
          })}
        </article>
        </div>
      </main>
      </>
      )}
      {pageManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Manage final report pages">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Manage Final Report Pages</h2>
                <p className="mt-0.5 text-xs text-slate-500">Select pages to remove from the downloaded report. Uploaded source files remain unchanged.</p>
              </div>
              <button type="button" onClick={() => setPageManagerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close page manager"><X size={20} /></button>
            </header>
            {pageManagerLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">Preparing all report pages...</div>
            ) : (
              <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
                <div className="min-h-0 bg-slate-200 p-3">
                  {pageManagerUrl && <iframe title="Final report page preview" src={`${pageManagerUrl}#toolbar=1&navpanes=0&view=FitH`} className="h-full min-h-[420px] w-full rounded-lg bg-white shadow" />}
                </div>
                <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-bold text-slate-800">{pageManagerPageCount} pages</span>
                    {excludedReportPages.size > 0 && <button type="button" onClick={() => setExcludedReportPages(new Set())} className="text-xs font-semibold text-blue-700 hover:underline">Clear selection</button>}
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-3">
                    {Array.from({ length: pageManagerPageCount }, (_, index) => {
                      const removed = excludedReportPages.has(index);
                      return <button key={index} type="button" onClick={() => toggleReportPage(index)} className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${removed ? "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-200" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"}`}>
                        <span>Page {index + 1}</span>
                        <span className={`h-4 w-4 rounded border ${removed ? "border-red-600 bg-red-600" : "border-slate-300"}`} />
                      </button>;
                    })}
                  </div>
                </aside>
              </div>
            )}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-600">{excludedReportPages.size ? `${excludedReportPages.size} page(s) will be removed. Remaining pages will be renumbered.` : "No pages selected for removal."}</p>
              <div className="flex gap-2">
                <button type="button" className="module-btn" onClick={() => setPageManagerOpen(false)}>Done</button>
                <button type="button" className="module-btn-primary" disabled={downloading || pageManagerPageCount === excludedReportPages.size} onClick={async () => { await downloadFinalPdf(); setPageManagerOpen(false); }}><Download size={16} />Download Updated PDF</button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
