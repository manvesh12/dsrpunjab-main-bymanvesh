import { CheckCircle2, Eye, RotateCcw, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import { projectsApi } from "../../api/projects.api";
import { useAuth } from "../../security/auth.context";
import type { ReportFrameSettings } from "../../utils/sectionPdf";

type FinalizedFormat = ReportFrameSettings & {
  finalizedAt?: string;
  finalizedBy?: string;
};

const sections = [
  "Front Matter",
  "Chapters",
  "Plates and Maps",
  "Annexure I",
  "Annexure II",
  "Annexure III",
  "Annexure IV",
  "Annexure V",
  "Annexure VI",
  "Annexure VII",
  "Annexure B",
  "Annexure C",
  "Annexure D",
  "Annexure E",
  "Annexure F",
  "Annexure G",
  "Annexure H",
  "Annexure I (Additional)",
  "Annexure J",
  "Annexure K",
];

const defaultFormat: FinalizedFormat = {
  headerText: "District Survey Report",
  footerText: "PREPARED BY: DISTRICT SURVEY REPORT COMMITTEE",
  footerText2: "",
  sectionTitles: {},
  sectionOverrides: {},
};

export default function DsrFormatDesignerPage() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const [format, setFormat] = useState<FinalizedFormat>(defaultFormat);
  const [section, setSection] = useState("Chapters");
  const [saving, setSaving] = useState(false);
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, "format-designer"],
    queryFn: () => projectsApi.get(projectId),
    enabled: /^\d+$/.test(projectId),
  });

  useEffect(() => {
    const saved = project?.projectState?.["report-format"] as FinalizedFormat | undefined;
    if (saved) setFormat({ ...defaultFormat, ...saved });
  }, [project]);

  const override = format.sectionOverrides?.[section] || {};
  const previewHeader = override.headerText?.trim() || format.headerText?.trim() || defaultFormat.headerText!;
  const previewFooter = override.footerText?.trim() || format.footerText?.trim() || defaultFormat.footerText!;
  const previewFooter2 = override.footerText2?.trim() || format.footerText2?.trim() || "";
  const previewTitle = format.sectionTitles?.[section]?.trim() || section;
  const updateOverride = (field: "headerText" | "footerText" | "footerText2", value: string) =>
    setFormat((current) => ({
      ...current,
      finalizedAt: undefined,
      finalizedBy: undefined,
      sectionOverrides: {
        ...current.sectionOverrides,
        [section]: { ...current.sectionOverrides?.[section], [field]: value },
      },
    }));

  const finalize = async () => {
    if (!project || !/^\d+$/.test(projectId)) return;
    setSaving(true);
    try {
      const finalized: FinalizedFormat = {
        ...format,
        finalizedAt: new Date().toISOString(),
        finalizedBy: user?.fullName || user?.email || "Administrator",
      };
      await projectsApi.updateState(projectId, {
        state: { ...(project.projectState || {}), "report-format": finalized },
      });
      setFormat(finalized);
      toast.success("DSR format finalized. All section and final PDF previews now use this format.");
    } catch (error) {
      console.error(error);
      toast.error("Could not finalize the DSR format");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="DSR Format Designer"
        description={`Redesign and finalize the report format for ${project?.title || project?.projectName || "this DSR project"}.`}
        action={<div className="flex gap-2"><Link to={`/projects/${projectId}`} className="module-btn">Back to Project</Link><Link to={`/projects/${projectId}/preview`} className="module-btn"><Eye size={16} /> Full Preview</Link></div>}
      />

      {format.finalizedAt && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="flex items-center gap-2 font-semibold"><CheckCircle2 size={17} /> Finalized by {format.finalizedBy || "Administrator"} on {new Date(format.finalizedAt).toLocaleString()}</span>
          <span className="text-xs">Editing and finalizing again will replace the current report format.</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 font-extrabold text-slate-900"><Settings2 size={18} className="text-blue-700" /> Format controls</div>
          <div className="grid gap-4">
            <label className="text-xs font-bold text-slate-600">Default report header
              <input value={format.headerText || ""} onChange={(event) => setFormat((current) => ({ ...current, headerText: event.target.value, finalizedAt: undefined, finalizedBy: undefined }))} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold text-slate-600">Default report footer
              <input value={format.footerText || ""} onChange={(event) => setFormat((current) => ({ ...current, footerText: event.target.value, finalizedAt: undefined, finalizedBy: undefined }))} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold text-slate-600">Default footer second line
              <input value={format.footerText2 || ""} onChange={(event) => setFormat((current) => ({ ...current, footerText2: event.target.value, finalizedAt: undefined, finalizedBy: undefined }))} placeholder="Optional second line" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold text-slate-600">Design a section
              <select value={section} onChange={(event) => setSection(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
                {sections.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <h2 className="mb-3 text-sm font-extrabold text-blue-950">{section} overrides</h2>
            <div className="grid gap-3">
              <label className="text-xs font-bold text-slate-600">Section display title
                <input value={format.sectionTitles?.[section] || ""} onChange={(event) => setFormat((current) => ({ ...current, finalizedAt: undefined, finalizedBy: undefined, sectionTitles: { ...current.sectionTitles, [section]: event.target.value } }))} placeholder={section} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold text-slate-600">Custom header
                <input value={override.headerText || ""} onChange={(event) => updateOverride("headerText", event.target.value)} placeholder="Use default report header" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold text-slate-600">Custom footer
                <input value={override.footerText || ""} onChange={(event) => updateOverride("footerText", event.target.value)} placeholder="Use default report footer" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold text-slate-600">Custom footer second line
                <input value={override.footerText2 || ""} onChange={(event) => updateOverride("footerText2", event.target.value)} placeholder="Use default second line" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <button type="button" onClick={() => setFormat((current) => ({ ...current, finalizedAt: undefined, finalizedBy: undefined, sectionTitles: { ...current.sectionTitles, [section]: "" }, sectionOverrides: { ...current.sectionOverrides, [section]: {} } }))} className="module-btn justify-center"><RotateCcw size={15} /> Reset this section</button>
            </div>
          </div>

          <button type="button" disabled={saving || isLoading} onClick={finalize} className="module-btn-primary w-full justify-center py-3"><Save size={17} />{saving ? "Finalizing..." : "Finalize & Apply to DSR"}</button>
          <p className="text-xs leading-5 text-slate-500">Changes remain in this designer until finalized. Finalizing updates every matching section and the live Final DSR preview/export.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-inner md:p-8">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-extrabold text-slate-900">Live section preview</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">A4 preview</span></div>
          <div className="mx-auto aspect-[1/1.414] w-full max-w-[720px] bg-white p-4 shadow-xl">
            <div className="relative flex h-full flex-col border border-black px-12 py-8 font-serif text-black">
              <header className="border-b border-black pb-2"><p className="text-[15px] italic">{previewHeader}</p><p className="text-[12px] italic">{project?.district || "Punjab"} District, Punjab</p></header>
              <main className="flex flex-1 flex-col items-center justify-center">
                <h1 className="max-w-lg border-b border-black pb-4 text-center text-2xl font-bold uppercase">{previewTitle}</h1>
                <p className="mt-8 max-w-md text-center text-sm leading-6 text-slate-500">Uploaded or generated content for this section will appear inside this safe content area.</p>
              </main>
              <footer className="flex items-center justify-between border-t border-slate-400 pt-2 text-[9px]"><span><span className="block font-bold uppercase">{previewFooter}</span>{previewFooter2 && <span className="mt-0.5 block">{previewFooter2}</span>}</span><span>Page 1</span></footer>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
