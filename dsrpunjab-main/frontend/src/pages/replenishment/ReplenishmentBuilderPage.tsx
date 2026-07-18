import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  Archive,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FileStack,
  FolderTree,
  GitCompare,
  Layers3,
  Lock,
  Map,
  Merge,
  Download,
  FileJson,
  FileText,
  Printer,
  RefreshCw,
  Replace,
  Save,
  Upload,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import {
  replenishmentApi,
  type ReplenishmentStudy,
} from "../../api/replenishment.api";
import {
  downloadBlob,
  exportDraftJson,
  exportWordDocument,
  loadDownloadHistory,
  openPrintableDocument,
  downloadHtmlAsPdf,
  recordDownloadHistory,
  replenishmentFileName,
  type DownloadFormat,
} from "../../utils/reportExport";

type ImportMode = "smart" | "selective" | "fresh";
type ContentAction = "Preview" | "Copy" | "Replace" | "Merge" | "Reference" | "Skip";

type ContentItem = {
  id: string;
  group: string;
  name: string;
  status: "Imported" | "Updated" | "Pending" | "Fresh Survey Required";
  action: ContentAction;
};

type SurveyUpdate = {
  surveyYear: string;
  surveyDate: string;
  dgps: boolean;
  drone: boolean;
  demDsm: boolean;
  orthomosaic: boolean;
  crossSections: boolean;
  rainfall: string;
  waterLevel: string;
  riverWidthDepth: string;
  sediment: string;
  photos: string;
};

type CrossSectionRow = {
  id: string;
  chainage: string;
  previous: string;
  updated: string;
  action: "Copy previous" | "Replace graph" | "Upload updated" | "Overlay compare";
};

type WorkflowState = {
  type: "replenishment_enterprise_workflow";
  importMode: ImportMode;
  selectedResources: string[];
  contentItems: ContentItem[];
  crossSections: CrossSectionRow[];
  importSummary: { imported: number; updated: number; pending: number };
  suggestions: { title: string; detail: string; kind: "static" | "dynamic" | "pending" }[];
  dynamicRegeneration: string[];
  previewNotes: string[];
  lastSavedAt?: string;
  district?: string;
  river?: string;
  year?: string;
  version?: number;
};

const resourceOptions = [
  "Chapters",
  "Tables",
  "Figures",
  "Maps",
  "Cross Sections",
  "Images",
  "Graphs",
  "Annexures",
  "References",
];

const dynamicOutputs = [
  "Reserve Estimation",
  "Volume Calculation",
  "Grid Calculation",
  "Replenishment Analysis",
  "Quantity Tables",
  "Cross Section Tables",
  "Updated Figures",
  "Executive Summary",
  "Conclusion",
  "Recommendations",
];

const defaultSurvey: SurveyUpdate = {
  surveyYear: "2025-26",
  surveyDate: "",
  dgps: true,
  drone: true,
  demDsm: true,
  orthomosaic: true,
  crossSections: true,
  rainfall: "",
  waterLevel: "",
  riverWidthDepth: "",
  sediment: "",
  photos: "",
};

const defaultWorkflow: WorkflowState = {
  type: "replenishment_enterprise_workflow",
  importMode: "smart",
  selectedResources: resourceOptions,
  contentItems: [
    { id: "front", group: "Front Matter", name: "Certificate, Preface, Executive context", status: "Imported", action: "Reference" },
    { id: "chapters", group: "Chapters", name: "Static district, geology and drainage chapters", status: "Imported", action: "Copy" },
    { id: "tables", group: "Tables", name: "Lease, river and baseline district tables", status: "Imported", action: "Merge" },
    { id: "maps", group: "Maps", name: "District maps, mining block plans and GIS outputs", status: "Updated", action: "Replace" },
    { id: "cross", group: "Cross Sections", name: "Pre/post monsoon chainage profiles", status: "Fresh Survey Required", action: "Replace" },
    { id: "annexures", group: "Annexures", name: "References, approvals and survey attachments", status: "Pending", action: "Skip" },
  ],
  crossSections: [
    { id: "cs-01", chainage: "R-01 / 0+500", previous: "Final DSR graph available", updated: "Awaiting updated Excel", action: "Overlay compare" },
    { id: "cs-02", chainage: "R-02 / 1+250", previous: "Final DSR graph available", updated: "Fresh survey required", action: "Upload updated" },
  ],
  importSummary: { imported: 3, updated: 1, pending: 2 },
  suggestions: [
    { title: "Reuse safe", detail: "District profile, geology, drainage and statutory references look static.", kind: "static" },
    { title: "Update required", detail: "Survey year, cross sections, river dimensions, rainfall and water level are dynamic.", kind: "dynamic" },
    { title: "Pending evidence", detail: "Upload updated DGPS/drone/DEM/orthomosaic files before final generation.", kind: "pending" },
  ],
  dynamicRegeneration: dynamicOutputs,
  previewNotes: [
    "Existing Final DSR remains read-only and untouched.",
    "Imported Replenishment Report starts from reusable approved DSR content.",
    "Updated Replenishment Report highlights modified survey-dependent sections.",
  ],
  district: "Punjab",
  river: "River",
  year: String(new Date().getFullYear()),
  version: 1,
};

function currentUserName() {
  try {
    const raw = localStorage.getItem("dsr:auth_user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.fullName || user?.username || user?.email || "Current Officer";
  } catch {
    return "Current Officer";
  }
}

function fileNameFor(workflow: WorkflowState, extension: "pdf" | "json" | "docx") {
  return replenishmentFileName({
    district: workflow.district,
    river: workflow.river,
    year: workflow.year,
    version: workflow.version,
    extension,
  });
}

function recordHistory(studyId: string, workflow: WorkflowState, fileName: string, fileSize: number, format: DownloadFormat) {
  recordDownloadHistory({
    reportId: studyId,
    generatedBy: currentUserName(),
    version: workflow.version || 1,
    fileName,
    fileSize,
    format,
  });
}

function buildReplenishmentPreviewHtml(study: ReplenishmentStudy | null, workflow: WorkflowState, survey: SurveyUpdate) {
  const summary = workflow.importSummary;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title></title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Noto Sans", "Nirmala UI", "Mangal", Arial, Helvetica, sans-serif; background: #f1f5f9; color: #0f172a; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; max-width: 780px; min-height: 1060px; margin: 0 auto 18px; background: #fff; padding: 42px 52px; box-shadow: 0 4px 24px rgba(15,23,42,0.12); page-break-after: always; overflow: hidden; }
  .watermark { position: absolute; inset: 42% 0 auto; text-align: center; transform: rotate(-28deg); font-size: 52px; font-weight: 800; color: rgba(23,50,77,0.06); pointer-events: none; }
  .header { text-align: center; border-bottom: 3px solid #17324d; padding-bottom: 18px; margin-bottom: 28px; }
  .header img { height: 58px; object-fit: contain; margin-bottom: 8px; }
  h1 { font-size: 18px; color: #17324d; text-transform: uppercase; letter-spacing: 0.5px; }
  h2 { margin-top: 8px; font-size: 15px; color: #334155; text-transform: uppercase; }
  .meta { margin-top: 8px; font-size: 11px; color: #64748b; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 24px 0; }
  .metric { border: 1px solid #e2e8f0; background: #f8fafc; padding: 10px; border-radius: 6px; }
  .metric b { display: block; font-size: 18px; color: #17324d; }
  .metric span { font-size: 10px; color: #64748b; text-transform: uppercase; }
  h3 { margin: 22px 0 10px; font-size: 13px; color: #17324d; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; }
  th { background: #e2e8f0; color: #334155; text-transform: uppercase; }
  .survey { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 11px; }
  .survey div { border: 1px solid #e2e8f0; padding: 8px; background: #f8fafc; border-radius: 6px; }
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8; }
  @media print { body { background: #fff; padding: 0; } .page { max-width: none; min-height: auto; box-shadow: none; margin: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="watermark">GOVERNMENT OF PUNJAB</div>
  <div class="header">
    <img src="/assets/state-emblem.png" alt="Punjab Logo">
    <h1>Government of Punjab</h1>
    <h2>${study?.title || "Enterprise Replenishment Report"}</h2>
    <div class="meta">${workflow.district || "Punjab"} | ${workflow.river || "River"} | ${workflow.year || survey.surveyYear} | Version ${workflow.version || 1}</div>
  </div>
  <div class="grid">
    <div class="metric"><b>${summary.imported}</b><span>Imported</span></div>
    <div class="metric"><b>${summary.updated}</b><span>Updated</span></div>
    <div class="metric"><b>${summary.pending}</b><span>Pending/Fresh Survey</span></div>
  </div>
  <h3>DSR Content Manager</h3>
  <table>
    <thead><tr><th>Group</th><th>Name</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${workflow.contentItems.map((item) => `<tr><td>${item.group}</td><td>${item.name}</td><td>${item.status}</td><td>${item.action}</td></tr>`).join("")}</tbody>
  </table>
  <h3>Survey Update Section</h3>
  <div class="survey">
    <div><b>Survey Year:</b> ${survey.surveyYear || "-"}</div>
    <div><b>Survey Date:</b> ${survey.surveyDate || "-"}</div>
    <div><b>Rainfall:</b> ${survey.rainfall || "-"}</div>
    <div><b>Water Level:</b> ${survey.waterLevel || "-"}</div>
    <div><b>River Width/Depth:</b> ${survey.riverWidthDepth || "-"}</div>
    <div><b>Sediment:</b> ${survey.sediment || "-"}</div>
  </div>
  <h3>Dynamic Regeneration Queue</h3>
  <table>
    <tbody>${workflow.dynamicRegeneration.map((item, index) => `<tr><td>${index + 1}</td><td>${item}</td></tr>`).join("")}</tbody>
  </table>
  <div class="footer">Generated by DSR Portal | Live Preview source | Unicode-safe replenishment export</div>
</div>
</body>
</html>`;
}

export default function ReplenishmentBuilderPage() {
  const { projectId } = useParams();
  const [study, setStudy] = useState<ReplenishmentStudy | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState>(defaultWorkflow);
  const [survey, setSurvey] = useState<SurveyUpdate>(defaultSurvey);
  const [originalPdf, setOriginalPdf] = useState<{ name: string; url: string; size: number; serverKey?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [importingDsr, setImportingDsr] = useState(false);

  const loadStudy = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const studies = await replenishmentApi.list(projectId);
      const existing = studies.find((item) => item.reportState?.type === defaultWorkflow.type) || studies[0];
      const active = existing || await replenishmentApi.create(projectId, {
        title: "Enterprise Replenishment Report",
        reportState: defaultWorkflow,
        surveyData: defaultSurvey,
      });
      setStudy(active);
      setWorkflow({ ...defaultWorkflow, ...(active.reportState as Partial<WorkflowState>) });
      setSurvey({ ...defaultSurvey, ...(active.surveyData as Partial<SurveyUpdate>) });
    } catch {
      toast.error("Replenishment workflow load nahi ho paya");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  const summary = useMemo(() => ({
    imported: workflow.contentItems.filter((item) => item.status === "Imported").length,
    updated: workflow.contentItems.filter((item) => item.status === "Updated").length,
    pending: workflow.contentItems.filter((item) => item.status === "Pending" || item.status === "Fresh Survey Required").length,
  }), [workflow.contentItems]);

  const persist = async () => {
    if (!study) return;
    setSaving(true);
    try {
      const nextState = { ...workflow, importSummary: summary, lastSavedAt: new Date().toISOString() };
      const saved = await replenishmentApi.update(study.id, {
        reportState: nextState,
        surveyData: survey,
      });
      setStudy(saved);
      setWorkflow({ ...defaultWorkflow, ...(saved.reportState as Partial<WorkflowState>) });
      setSurvey({ ...defaultSurvey, ...(saved.surveyData as Partial<SurveyUpdate>) });
      toast.success("Replenishment workflow database me save ho gaya");
    } catch {
      toast.error("Save failed - database connection/API check karo");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (id: string, patch: Partial<ContentItem>) => {
    setWorkflow((current) => ({
      ...current,
      contentItems: current.contentItems.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  };

  const updateWorkflowMeta = (key: "district" | "river" | "year" | "version", value: string) => {
    setWorkflow((current) => ({ ...current, [key]: key === "version" ? Number(value) || 1 : value }));
  };

  const exportHtml = () => buildReplenishmentPreviewHtml(study, { ...workflow, importSummary: summary }, survey);

  const handleDownloadGeneratedPdf = async () => {
    if (!study) return;
    const fileName = fileNameFor(workflow, "pdf");
    toast.info("Generating PDF, please wait...");
    try {
      await downloadHtmlAsPdf(exportHtml(), fileName, false);
      recordHistory(study.id, workflow, fileName, 0, "generated-pdf");
      toast.success("Generated PDF downloaded");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadDraft = () => {
    if (!study) return;
    const fileName = fileNameFor(workflow, "json");
    const size = exportDraftJson({ study, workflow: { ...workflow, importSummary: summary }, survey }, fileName);
    recordHistory(study.id, workflow, fileName, size, "draft-json");
    toast.success("Draft JSON downloaded");
  };

  const handleExportDocx = () => {
    if (!study) return;
    const fileName = fileNameFor(workflow, "docx");
    const size = exportWordDocument(exportHtml(), fileName);
    recordHistory(study.id, workflow, fileName, size, "docx");
    toast.success("Editable DOCX downloaded");
  };

  const handlePrint = () => {
    if (!study) return;
    openPrintableDocument(exportHtml(), study.title);
    recordHistory(study.id, workflow, fileNameFor(workflow, "pdf"), 0, "print");
  };

  const handleOriginalPdfSelect = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Original official file PDF hona chahiye");
      return;
    }
    if (!study) {
      toast.error("Please wait for study to load");
      return;
    }
    try {
      const result = await replenishmentApi.uploadFile(study.id, "original_pdf", file);
      if (originalPdf?.url) URL.revokeObjectURL(originalPdf.url);
      setOriginalPdf({ name: file.name, url: URL.createObjectURL(file), size: file.size, serverKey: result.objectKey });
      toast.success("Original PDF uploaded successfully");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleCrossSectionUpload = async (file: File | undefined) => {
    if (!file || !study) return;
    try {
      await replenishmentApi.uploadFile(study.id, "cross_section", file);
      toast.success("Cross section data uploaded successfully");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleExecuteImport = async () => {
    if (!study) return;
    setImportingDsr(true);
    try {
      await replenishmentApi.fetchFinalDsr(study.id);
      toast.success("Final DSR data imported successfully");
      loadStudy(); // Reload to get updated inherited state
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Import failed");
    } finally {
      setImportingDsr(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!study) return;
    setGeneratingAi(true);
    try {
      const result = await replenishmentApi.generateAi(study.id, "general");
      setWorkflow((current) => ({
        ...current,
        suggestions: [{ title: "AI Generated Insight", detail: result.generatedText, kind: "dynamic" }, ...current.suggestions]
      }));
      toast.success("AI insights generated successfully");
    } catch {
      toast.error("AI Generation failed");
    } finally {
      setGeneratingAi(false);
    }
  };

  const WORKFLOW_STAGES = [
    "DRAFT", "SURVEY_OFFICER_APPROVED", "GIS_EXPERT_APPROVED", 
    "GEOLOGIST_APPROVED", "DISTRICT_OFFICER_APPROVED", "REVIEWER_APPROVED", 
    "DISTRICT_ADMIN_APPROVED", "STATE_ADMIN_APPROVED", "FINAL_REPORT_GENERATED"
  ];

  const handleWorkflowAdvance = async () => {
    if (!study) return;
    const currentIndex = WORKFLOW_STAGES.indexOf(study.approvalState || "DRAFT");
    const nextState = WORKFLOW_STAGES[currentIndex + 1];
    if (!nextState) {
      toast.success("Workflow already complete!");
      return;
    }
    try {
      await replenishmentApi.workflow(study.id, { action: nextState });
      toast.success(`Workflow advanced to ${nextState}`);
      loadStudy(); // Reload to get new status
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Workflow advancement failed");
    }
  };

  const handleDownloadOriginalPdf = () => {
    if (!study || !originalPdf) {
      toast.error("Pehle official Replenishment PDF upload karo");
      return;
    }
    fetch(originalPdf.url)
      .then((response) => response.blob())
      .then((blob) => {
        downloadBlob(blob, originalPdf.name);
        recordHistory(study.id, workflow, originalPdf.name, blob.size || originalPdf.size, "original-pdf");
      })
      .catch(() => toast.error("Original PDF download nahi ho paya"));
  };

  const downloadHistory = study ? loadDownloadHistory(study.id).slice(0, 4) : [];

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading replenishment workflow...</div>;
  }

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Enterprise Replenishment Report"
        description="Approved Final DSR se smart import, selective reuse, survey updates aur dynamic regeneration - sab database me persisted."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <label className="module-btn cursor-pointer">
              <Upload size={17}/>Upload Original PDF
              <input type="file" accept="application/pdf" hidden onChange={(event) => handleOriginalPdfSelect(event.target.files?.[0])} />
            </label>
            <button className="module-btn" onClick={handleDownloadOriginalPdf}><FileText size={17}/>Download Original PDF</button>
            <button className="module-btn-primary" onClick={handleDownloadGeneratedPdf}><Download size={17}/>Download Generated PDF</button>
            <button className="module-btn" onClick={handleDownloadDraft}><FileJson size={17}/>Download Draft (.json)</button>
            <button className="module-btn" onClick={handleExportDocx}><FileText size={17}/>Export DOCX</button>
            <button className="module-btn" onClick={handlePrint}><Printer size={17}/>Print</button>
            <button className="module-btn-primary" onClick={persist} disabled={saving || !study}><Save size={17}/>{saving ? "Saving..." : "Save to Database"}</button>
          </div>
        }
      />

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {([
            ["district", "District"],
            ["river", "River"],
            ["year", "Year"],
            ["version", "Version"],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-xs font-bold uppercase text-slate-500">
              {label}
              <input
                value={String(workflow[key] || (key === "version" ? 1 : ""))}
                onChange={(event) => updateWorkflowMeta(key, event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold normal-case text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {originalPdf && <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Original: {originalPdf.name}</span>}
          {downloadHistory.map((item) => (
            <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1">
              {item.fileName} | v{item.version} | {Math.ceil(item.fileSize / 1024)} KB | {item.downloadCount}x | {item.generatedBy}
            </span>
          ))}
        </div>
      </section>

      {/* Workflow Progress Bar */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Current Workflow Stage</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${study?.approvalState === 'FINAL_REPORT_GENERATED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {study?.approvalState?.replace(/_/g, ' ') || "DRAFT"}
            </span>
            {study?.status === 'APPROVED' && <span className="text-green-600 font-bold ml-2">✓ GREEN FLAG - FULLY APPROVED</span>}
          </div>
        </div>
        <div>
          <button 
            onClick={handleWorkflowAdvance} 
            disabled={study?.approvalState === 'FINAL_REPORT_GENERATED'}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Advance Workflow Stage <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric icon={FileStack} label="Study" value={study?.title || "Draft"} />
        <Metric icon={CheckCircle2} label="Imported" value={String(summary.imported)} />
        <Metric icon={RefreshCw} label="Updated" value={String(summary.updated)} />
        <Metric icon={Lock} label="Pending/Fresh Survey" value={String(summary.pending)} />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Import Setup" icon={Archive} description="Final DSR read-only source rahega; Replenishment report usse imported working copy banata hai.">
          <div className="grid gap-3 md:grid-cols-3">
            {(["smart", "selective", "fresh"] as ImportMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkflow((current) => ({ ...current, importMode: mode }))}
                className={`rounded-2xl border p-4 text-left transition ${workflow.importMode === mode ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-blue-300"}`}
              >
                <p className="font-semibold capitalize">{mode === "smart" ? "Smart Import" : mode === "selective" ? "Selective Import" : "Fresh Report"}</p>
                <p className="mt-1 text-sm text-slate-500">{mode === "smart" ? "Auto-detect reusable and outdated DSR content." : mode === "selective" ? "Choose chapters/resources one by one." : "Start clean but still linked to project DB."}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {resourceOptions.map((resource) => (
              <label key={resource} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={workflow.selectedResources.includes(resource)}
                  onChange={(event) => setWorkflow((current) => ({
                    ...current,
                    selectedResources: event.target.checked
                      ? [...current.selectedResources, resource]
                      : current.selectedResources.filter((item) => item !== resource),
                  }))}
                />
                {resource}
              </label>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <button 
              onClick={handleExecuteImport}
              disabled={importingDsr}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {importingDsr ? "Importing Data..." : "Execute DSR Import"}
            </button>
          </div>
        </Panel>

        <Panel title="AI Smart Suggestions" icon={Bot} description="Static vs dynamic detection summary.">
          <div className="mb-3">
            <button 
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
            >
              <Sparkles size={16} /> {generatingAi ? "Generating AI Insights..." : "Generate AI Insights"}
            </button>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {workflow.suggestions.map((suggestion) => (
              <div key={suggestion.title} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">{suggestion.title}</p>
                <p className="text-sm text-slate-600">{suggestion.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="DSR Content Manager" icon={FolderTree} description="Each imported item can be previewed, copied, replaced, merged, referenced or skipped.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-3">Group</th><th>Name</th><th>Status</th><th>Action</th><th>Tools</th></tr>
              </thead>
              <tbody>
                {workflow.contentItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-3 font-semibold">{item.group}</td>
                    <td className="pr-3 text-slate-600">{item.name}</td>
                    <td className="pr-3"><StatusBadge status={item.status} /></td>
                    <td className="pr-3">
                      <select value={item.action} onChange={(event) => updateItem(item.id, { action: event.target.value as ContentAction })} className="rounded-lg border border-slate-200 px-2 py-1">
                        {["Preview", "Copy", "Replace", "Merge", "Reference", "Skip"].map((action) => <option key={action}>{action}</option>)}
                      </select>
                    </td>
                    <td className="flex gap-2 py-3">
                      {[Eye, Copy, Replace, Merge].map((Icon, index) => <button key={index} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Icon size={15}/></button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Survey Update Section" icon={ClipboardCheck} description="Sirf new/changing survey data yahan capture hota hai.">
          <div className="grid gap-3">
            {(["surveyYear", "surveyDate", "rainfall", "waterLevel", "riverWidthDepth", "sediment", "photos"] as (keyof SurveyUpdate)[]).map((field) => (
              <label key={field} className="text-sm font-medium text-slate-700">
                {labelize(field)}
                <input
                  value={String(survey[field] || "")}
                  type={field === "surveyDate" ? "date" : "text"}
                  onChange={(event) => setSurvey((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              {(["dgps", "drone", "demDsm", "orthomosaic", "crossSections"] as (keyof SurveyUpdate)[]).map((field) => (
                <label key={field} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={Boolean(survey[field])} onChange={(event) => setSurvey((current) => ({ ...current, [field]: event.target.checked }))} />
                  {labelize(field)}
                </label>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-2">
        <Panel title="Cross Section Manager" icon={GitCompare} description="Previous graph, updated Excel, overlay compare and regenerate flow.">
          <div className="space-y-3">
            {workflow.crossSections.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-semibold">{row.chainage}</p><p className="text-sm text-slate-500">{row.previous} {"->"} {row.updated}</p></div>
                  <select value={row.action} onChange={(event) => setWorkflow((current) => ({ ...current, crossSections: current.crossSections.map((item) => item.id === row.id ? { ...item, action: event.target.value as CrossSectionRow["action"] } : item) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    {["Copy previous", "Replace graph", "Upload updated", "Overlay compare"].map((action) => <option key={action}>{action}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload size={16}/> Upload updated Excel / graph
              <input type="file" accept=".xls,.xlsx,.png,.jpg,.jpeg" hidden onChange={(e) => handleCrossSectionUpload(e.target.files?.[0])} />
            </label>
          </div>
        </Panel>

        <Panel title="Dynamic Regeneration Queue" icon={Layers3} description="Only changing calculations and report sections regenerate automatically.">
          <div className="grid gap-2 md:grid-cols-2">
            {dynamicOutputs.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={workflow.dynamicRegeneration.includes(item)}
                  onChange={(event) => setWorkflow((current) => ({
                    ...current,
                    dynamicRegeneration: event.target.checked
                      ? [...current.dynamicRegeneration, item]
                      : current.dynamicRegeneration.filter((entry) => entry !== item),
                  }))}
                />
                {item}
              </label>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Preview Mode" icon={Map} description="Side-by-side review: Existing Final DSR, Imported Replenishment, Updated Replenishment.">
        <div className="grid gap-4 lg:grid-cols-3">
          {["Existing Final DSR", "Imported Replenishment Report", "Updated Replenishment Report"].map((title, index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-2 text-sm text-slate-600">{workflow.previewNotes[index]}</p>
              <div className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-500">{index === 0 ? "Read-only approved content" : index === 1 ? `${workflow.selectedResources.length} resource groups imported` : `${workflow.dynamicRegeneration.length} dynamic outputs selected`}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5">
        <Panel title="Live Replenishment Preview" icon={Eye} description="Database draft ka current printable report preview. Har form change yahan turant update hota hai.">
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-200">
            <iframe
              title="Live replenishment report preview"
              srcDoc={exportHtml()}
              className="block h-[760px] w-full bg-white lg:h-[920px]"
            />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon size={18}/></div><div><h2 className="font-bold">{title}</h2><p className="text-sm text-slate-500">{description}</p></div></div>{children}</section>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-slate-500"><Icon size={16}/>{label}</div><p className="mt-2 truncate text-xl font-bold">{value}</p></div>;
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const tone = status === "Imported" ? "bg-green-50 text-green-700" : status === "Updated" ? "bg-blue-50 text-blue-700" : status === "Fresh Survey Required" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
