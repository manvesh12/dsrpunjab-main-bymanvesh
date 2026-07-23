import { Download, FileText, List, Printer, RefreshCw, Save, Settings2 } from "lucide-react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { get } from "idb-keyval";
import PageHeader from "../../components/layout/PageHeader";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { projectsApi, type ProjectFile } from "../../api/projects.api";
import { uploadsApi } from "../../api/uploads.api";
import { appendGeneratedReportContent, appendReportSectionTitle, appendUploadedDocument, applyDsrReportFrame, createSectionPdf, saveSectionPdf, type ReportChapter, type ReportCrossSection, type ReportDataTable, type ReportFrameSettings } from "../../utils/sectionPdf";
import { toast } from "sonner";
import { annexureTemplates } from "../annexures/AnnexureEditorPage";
import { additionalAnnexureTemplates } from "../annexures/AdditionalAnnexureEditorPage";
import ReplenishmentBuilderPage from "../replenishment/ReplenishmentBuilderPage";
import ModelDsrPage from "../replenishment/ModelDsrPage";

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

export function SectionTitlePage({ title, pageNumber, district, headerText, footerText }: { title: string; pageNumber: number; district: string; headerText: string; footerText: string }) {
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col items-center justify-center overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    <header className="absolute left-16 right-16 top-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">{headerText}</p><p className="text-[12px] italic">{district} District, Punjab</p></header>
    <h1 className="mx-16 border-b border-black pb-4 text-center font-serif text-3xl font-bold uppercase">{title}</h1>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span className="font-bold uppercase">{footerText}</span><span>Page {pageNumber}</span></footer>
  </section>;
}

export function GeneratedSection({ table, graph, chapter, pageNumber, district, headerText, footerText }: { table?: ReportDataTable; graph?: ReportCrossSection; chapter?: ReportChapter; pageNumber: number; district: string; headerText: string; footerText: string }) {
  const heading = table?.title || chapter?.name || graph?.name || "Cross Section Sand Bar";
  const points = String(graph?.post || "").split(",").map(Number).filter(Number.isFinite);
  const levels = [...points, Number(graph?.red), Number(graph?.thal)].filter(Number.isFinite);
  const min = levels.length ? Math.min(...levels) : 0;
  const max = levels.length ? Math.max(...levels) : 1;
  const svgPoints = points.map((value, index) => `${20 + index * (250 / Math.max(points.length - 1, 1))},${110 - ((value - min) / Math.max(max - min, .1)) * 82}`).join(" ");
  return <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
    <div className="pointer-events-none absolute inset-4 border border-black" />
    <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight"><p className="text-[15px] italic">{headerText}</p><p className="text-[12px] italic">{district} District, Punjab</p><p className="mt-1 text-[10px]">{heading}</p></header>
    <div className="relative mx-14 mb-12 mt-4 min-h-0 flex-1 overflow-auto font-serif">
      {table ? <><h2 className="mb-3 text-center text-sm font-bold">{table.title}</h2><table className="w-full border-collapse text-[8px]"><thead><tr>{table.columns.map((column) => <th key={column.key} className="border border-black bg-slate-100 p-1 text-left">{column.label}</th>)}</tr></thead><tbody>{table.rows.length ? table.rows.map((row, index) => <tr key={index}>{table.columns.map((column) => <td key={column.key} className="border border-slate-400 p-1">{row[column.key] || "-"}</td>)}</tr>) : <tr><td className="border p-3 text-center text-slate-500" colSpan={Math.max(table.columns.length, 1)}>No data entered yet</td></tr>}</tbody></table></> : chapter ? <><h2 className="mb-8 text-center text-xl font-bold uppercase">{chapter.name}</h2><div className="border-t border-black pt-6 text-[13px] leading-7 whitespace-pre-wrap">{chapter.summary || "Chapter content will appear here once it is entered and saved in the chapter editor."}</div></> : <><h2 className="mb-2 text-center text-sm font-bold">CROSS SECTION SAND BAR</h2><p className="text-center text-xs font-bold">{heading}</p><svg viewBox="0 0 290 140" className="mx-auto mt-5 w-full max-w-md border border-slate-300"><line x1="20" y1="110" x2="270" y2="110" stroke="#64748b"/><line x1="20" y1="20" x2="20" y2="110" stroke="#64748b"/><polyline points={svgPoints} fill="none" stroke="#b86d32" strokeWidth="2"/>{Number.isFinite(Number(graph?.red)) && <line x1="20" y1={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.red) - min) / Math.max(max - min, .1)) * 82} stroke="#dc2626"/>}{Number.isFinite(Number(graph?.thal)) && <line x1="20" y1={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} x2="270" y2={110 - ((Number(graph?.thal) - min) / Math.max(max - min, .1)) * 82} stroke="#2563eb"/>}</svg><div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><p>Area: {graph?.area || "-"} Ha</p><p>Bulk density: {graph?.bulk || "-"}</p><p>Post monsoon: {graph?.post || "-"}</p><p>Mining: {graph?.pct || "-"}%</p></div></>}
    </div>
    <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]"><span className="font-bold uppercase">{footerText}</span><span>Page {pageNumber}</span></footer>
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

export function UploadedSection({ upload, pageNumber, district, headerText, footerText }: { upload: PreviewUpload; pageNumber: number; district: string; headerText: string; footerText: string }) {
  return (
    <section className="dsr-preview-page relative flex aspect-[1/1.414] w-full max-w-[794px] flex-col overflow-hidden bg-white text-black shadow-xl">
      <div className="pointer-events-none absolute inset-4 border border-black" />
      <header className="mx-16 mt-7 border-b border-black pb-2 font-serif leading-tight">
        <p className="text-[15px] italic">{headerText}</p>
        <p className="max-w-[520px] text-[12px] italic">{district} District, Punjab</p>
        <p className="mt-1 text-[10px]">{upload.title}</p>
      </header>
      <div className="relative mx-14 mb-12 mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <UploadedFilePreview src={upload.url} title={upload.title} alt={upload.title} className="h-full w-full bg-white" imageStyle={{ objectFit: "contain" }} />
      </div>
      <footer className="absolute bottom-7 left-16 right-16 flex items-center justify-between border-t border-slate-300 pt-2 font-serif text-[9px]">
        <span className="font-bold uppercase">{footerText}</span>
        <span>Page {pageNumber}</span>
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
  const reportChapters = chapters.length ? chapters : draftChapters;
  const reportPlates = plates.length ? plates : draftPlates;

  useEffect(() => {
    const saved = state["report-format"] as ReportFrameSettings | undefined;
    if (saved) setFrameSettings(saved);
  }, [project?.id]);

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


  const setSelectedOverride = (field: "headerText" | "footerText", value: string) => setFrameSettings((current) => ({ ...current, sectionOverrides: { ...current.sectionOverrides, [selectedFrameSection]: { ...current.sectionOverrides?.[selectedFrameSection], [field]: value } } }));

  useEffect(() => {
    let active = true;
    const loadDraftTables = async () => {
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
      const locations = [...Array.from({ length: 7 }, (_, annexure) => ({ label: `Annexure ${roman[annexure]}`, key: String(annexure + 1), storageKey: annexure === 4 ? "5-v2" : String(annexure + 1), count: 8 })), ...["f", "j", "k"].map((key) => ({ label: `Annexure ${key.toUpperCase()}`, key, storageKey: key, count: 4 }))];
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
  (project?.files || []).forEach((file) => uploads.push({
    id: `project-${String(file.id)}`,
    title: `${uploadSectionLabel(file)} - ${file.fileName}`,
    name: file.fileName,
    url: uploadsApi.getDownloadUrl(file.annexureId),
  }));
  const uniqueUploads = uploads.filter((upload, index) => uploads.findIndex((item) => item.url === upload.url) === index).sort((a, b) => reportOrder(a.title) - reportOrder(b.title));
  const frontMatterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 0);
  const chapterUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 1);
  const plateUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 4);
  const otherUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 5);
  const annexureUploads = uniqueUploads.filter((item) => reportOrder(item.title) === 6);
  const previewPages: Array<{ sectionName: string; title?: string; upload?: PreviewUpload; table?: ReportDataTable; graph?: ReportCrossSection; chapter?: ReportChapter }> = [
    ...(frontMatterUploads.length ? [{ sectionName: "Front Matter", title: "Front Matter" }, ...frontMatterUploads.map((upload) => ({ sectionName: "Front Matter", upload }))] : []),
    { sectionName: "Chapters", title: "Chapters" }, ...reportChapters.map((chapter) => ({ sectionName: "Chapters", chapter })), ...chapterUploads.map((upload) => ({ sectionName: "Chapters", upload })),
    { sectionName: "Plates and Maps", title: "Plates and Maps" }, ...plateUploads.map((upload) => ({ sectionName: "Plates and Maps", upload })), ...otherUploads.map((upload) => ({ sectionName: "Plates and Maps", upload })),
    ...annexureSections.flatMap((annexure) => [{ sectionName: annexure, title: annexure }, ...tables.filter((table) => annexureMatches(table.title, annexure)).map((table) => ({ sectionName: annexure, table })), ...annexureUploads.filter((upload) => annexureMatches(upload.title, annexure)).map((upload) => ({ sectionName: annexure, upload }))]),
  ];

  const reportSections = previewPages.flatMap((page) => page.title
    ? [{ id: `report-section-${page.sectionName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label: sectionDisplayName(page.sectionName) }]
    : []);
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
      const addSectionTitle = async (section: string) => { const startPage = document.getPageCount(); await appendReportSectionTitle(document, sectionDisplayName(section)); sections.push({ title: section, startPage }); };
      if (frontMatterUploads.length) { await addSectionTitle("Front Matter"); for (const upload of frontMatterUploads) await appendUpload(upload); }
      await addSectionTitle("Chapters");
      if (reportChapters.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: project?.district || "Punjab", tables: [], graphs: [], chapters: reportChapters }); if (document.getPageCount() > startPage) sections.push({ title: "Chapters", startPage }); }
      for (const upload of chapterUploads) await appendUpload(upload);
      await addSectionTitle("Plates and Maps");
      for (const upload of [...plateUploads, ...otherUploads]) await appendUpload(upload);
      for (const annexure of annexureSections) {
        await addSectionTitle(annexure);
        const annexureTables = tables.filter((table) => annexureMatches(table.title, annexure));
        if (annexureTables.length) { const startPage = document.getPageCount(); await appendGeneratedReportContent(document, { district: project?.district || "Punjab", tables: annexureTables, graphs: [] }); if (document.getPageCount() > startPage) sections.push({ title: annexure, startPage }); }
        for (const upload of annexureUploads.filter((item) => annexureMatches(item.title, annexure))) await appendUpload(upload);
      }
      if (document.getPageCount() === 0) throw new Error("No readable uploaded documents found");
      await applyDsrReportFrame(document, sections, project?.district || "Punjab", frameSettings);
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
        title="Final Report Generator"
        description="Generate, preview and download Final DSR, Replenishment Report and Model DSR from one workspace"
        action={activeGeneratorTab === "final-dsr" ? <div className="flex gap-2">
          <button className="module-btn" onClick={() => window.print()}><Printer size={17} />Print</button>
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
        <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <label className="text-xs font-semibold text-slate-600">Default header<input value={frameSettings.headerText || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, headerText: event.target.value }))} placeholder="District Survey Report" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Default footer<input value={frameSettings.footerText || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, footerText: event.target.value }))} placeholder="Prepared by: District Survey Report Committee" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Section override<select value={selectedFrameSection} onChange={(event) => setSelectedFrameSection(event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal">{frameSections.map((section) => <option key={section}>{section}</option>)}</select></label>
          <button className="module-btn-primary justify-center" disabled={savingFormat} onClick={saveFormat}><Save size={16} />{savingFormat ? "Saving..." : "Save Format"}</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600">{selectedFrameSection} section heading<input value={frameSettings.sectionTitles?.[selectedFrameSection] || ""} onChange={(event) => setFrameSettings((current) => ({ ...current, sectionTitles: { ...current.sectionTitles, [selectedFrameSection]: event.target.value } }))} placeholder={`Uses \"${selectedFrameSection}\" if empty`} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-xs text-slate-600">{selectedFrameSection} header<input value={selectedOverride.headerText || ""} onChange={(event) => setSelectedOverride("headerText", event.target.value)} placeholder="Uses default header if empty" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-xs text-slate-600">{selectedFrameSection} footer<input value={selectedOverride.footerText || ""} onChange={(event) => setSelectedOverride("footerText", event.target.value)} placeholder="Uses default footer if empty" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
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
            const footerText = override?.footerText || frameSettings.footerText || "Prepared by: District Survey Report Committee";
            
            const sectionId = page.title ? `report-section-${page.sectionName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined;
            const content = page.title ? <SectionTitlePage title={sectionDisplayName(page.title)} pageNumber={index + 1} district={project?.district || "Punjab"} headerText={headerText} footerText={footerText} /> : page.upload ? <UploadedSection upload={page.upload} pageNumber={index + 1} district={project?.district || "Punjab"} headerText={headerText} footerText={footerText} /> : <GeneratedSection table={page.table} graph={page.graph} chapter={page.chapter} pageNumber={index + 1} district={project?.district || "Punjab"} headerText={headerText} footerText={footerText} />;
            return <div key={page.title ? `section-${page.title}-${index}` : page.upload?.id || `generated-${index}`} id={sectionId} className="flex w-full scroll-mt-24 justify-center">{content}</div>;
          })}
        </article>
        </div>
      </main>
      </>
      )}
    </>
  );
}
