import { ArrowDown, ArrowUp, Plus, Trash2, Upload, Download, Save } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { useAuth } from "../../security/auth.context";
import { hasPermission, Permission } from "../../security/access";
import { useParams } from "react-router-dom";
import { uploadErrorMessage, uploadsApi } from "../../api/uploads.api";
import { projectsApi } from "../../api/projects.api";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { toast } from "sonner";
import { appendUploadedDocument, createSectionPdf, drawPdfHeading, drawWrappedLines, saveSectionPdf } from "../../utils/sectionPdf";

type Chapter = { name: string; summary: string; file?: { name: string; url: string } };

const initial: Chapter[] = [
  ["CHAPTER 1 - INTRODUCTION", "Overview of the district and purpose of the DSR under EMGSM 2020 guidelines."],
  ["CHAPTER 2 - OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT", "Current and historical sand mining activities, lease details, and district statistics."],
  ["CHAPTER 3 - PROCESS OF DEPOSITION OF SEDIMENTS IN THE RIVERS OF THE DISTRICT", "River morphology, sedimentation rates, and annual replenishment estimates."],
  ["CHAPTER 4 - GENERAL PROFILE OF THE DISTRICT", "Geographic, demographic, and administrative profile of the district."],
  ["CHAPTER 5 - PHYSIOGRAPHY OF THE DISTRICT", "Terrain, drainage patterns, river systems, and physical features."],
  ["CHAPTER 6 - GEOLOGY AND MINERAL WEALTH", "Geological formations, mineral deposits, and subsurface characteristics."],
  ["CHAPTER 7 - ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES", "Scientific estimation of available sand deposits and annual natural replenishment."],
  ["CHAPTER 8 - TRANSPORT", "Transportation infrastructure, road conditions, and logistics for mining operations."],
  ["CHAPTER 9 - REMEDIAL MEASURE TO MITIGATE THE IMPACT OF MINING", "Environmental safeguards, monitoring mechanisms, and impact mitigation plans."],
  ["CHAPTER 10 - CONCLUSION", "Summary findings, recommendations, and compliance declarations."],
].map(([name, summary]) => ({ name, summary }));

async function downloadChaptersPdf(chapters: Chapter[]) {
  const { document, regular, bold } = await createSectionPdf();
  let page = document.addPage([595.28, 841.89]);
  drawPdfHeading(page, bold, "TABLE OF CHAPTERS");
  let y = 745;
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    if (y < 115) {
      page = document.addPage([595.28, 841.89]);
      drawPdfHeading(page, bold, "TABLE OF CHAPTERS (CONTINUED)");
      y = 745;
    }
    page.drawText(`${index + 1}. ${chapter.name}`, { x: 45, y, size: 11, font: bold });
    y = drawWrappedLines(page, regular, chapter.summary, { x: 55, y: y - 20, maxWidth: 495, size: 9, lineHeight: 13 }) - 17;
    if (chapter.file) page.drawText(`Attached: ${chapter.file.name}`, { x: 55, y, size: 8, font: regular });
    y -= 24;
  }
  for (const chapter of chapters) await appendUploadedDocument(document, chapter.file);
  await saveSectionPdf(document, "Chapters.pdf");
}

export default function ChaptersPage() {
  const { projectId = "default" } = useParams();
  const { user } = useAuth();
  const [chapters, setChapters] = useLocalDraft<Chapter[]>("chapters-exact", initial);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const canEditFirstHalf = hasPermission(user, Permission.SectionChaptersFirstHalf);
  const canEditSecondHalf = hasPermission(user, Permission.SectionChaptersSecondHalf);
  const canEditAnyChapter = canEditFirstHalf || canEditSecondHalf;
  const canEditChapter = (index: number) => index < 5 ? canEditFirstHalf : canEditSecondHalf;

  const update = (index: number, chapter: Partial<Chapter>) =>
    setChapters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...chapter } : item));

  const move = (index: number, direction: number) =>
    setChapters((current) => {
      const next = [...current];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });

  useEffect(() => {
    if (!/^\d+$/.test(projectId)) return;

    let active = true;
    projectsApi.get(projectId).then((project) => {
      if (!active) return;
      const chaptersState = project.projectState?.chapters as { chapters?: Chapter[] } | Chapter[] | undefined;
      if (Array.isArray(chaptersState)) setChapters(chaptersState);
      else if (Array.isArray(chaptersState?.chapters)) setChapters(chaptersState.chapters);
    }).catch((error) => {
      console.error("Failed to load chapters draft:", error);
    });

    return () => { active = false; };
  }, [projectId, setChapters]);

  const saveDraft = async () => {
    if (!/^\d+$/.test(projectId)) {
      toast.error("Project ID missing");
      return;
    }

    setSaving(true);
    try {
      const project = await projectsApi.get(projectId);
      await projectsApi.updateState(projectId, {
        state: {
          ...(project.projectState || {}),
          chapters: {
            chapters,
            savedAt: new Date().toISOString(),
          },
        },
      });
      toast.success("Chapters saved to database");
    } catch (error) {
      console.error("Failed to save chapters draft:", error);
      toast.error("Draft save failed");
    } finally {
      setSaving(false);
    }
  };

  const leftPanel = (
    <div className="space-y-4">
      {chapters.map((chapter, index) => {
        const editable = canEditChapter(index);

        return (
          <article key={index} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <input
                  value={chapter.name}
                  disabled={!editable}
                  onChange={(event) => update(index, { name: event.target.value })}
                  className="w-full rounded-lg border px-3 py-2 font-bold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
                <textarea
                  value={chapter.summary}
                  disabled={!editable}
                  onChange={(event) => update(index, { summary: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
                <label className={`module-btn mt-2 ${editable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                  <Upload size={16} />
                  {uploading === index ? "Uploading..." : (chapter.file?.name || "Upload PDF / Image")}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    hidden
                    disabled={!editable || uploading === index}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setUploading(index);
                      try {
                        const result = await uploadsApi.upload(file, projectId, "chapters");
                        update(index, { file: { name: file.name, url: result.url } });
                        toast.success(`${file.name} uploaded`);
                      } catch (error) {
                        toast.error(uploadErrorMessage(error));
                      } finally {
                        setUploading(null);
                      }
                    }}
                  />
                </label>
                {chapter.file && (
                  <div className="mt-2 rounded-lg overflow-hidden border" style={{ height: 80 }}>
                    <UploadedFilePreview
                      src={chapter.file.url}
                      title="chapter preview"
                      alt="preview"
                      className="h-full w-full"
                      imageClassName="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  disabled={index === 0 || !editable}
                  onClick={() => move(index, -1)}
                  className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  disabled={index === chapters.length - 1 || !editable}
                  onClick={() => move(index, 1)}
                  className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  disabled={!editable}
                  onClick={() => setChapters((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  const rightPanel = (
    <aside className="h-full rounded-2xl border bg-slate-200 p-4 flex flex-col">
      <p className="mb-3 text-xs font-bold uppercase text-slate-600 shrink-0">Live Chapter Index Preview</p>
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <div id="chapters-pdf-preview" className="bg-white p-8 shadow mb-4">
          <p className="text-center text-xs font-bold uppercase tracking-[.2em]">District Survey Report</p>
          <h2 className="mt-4 border-b-2 pb-4 text-center text-xl font-bold uppercase">Table of Chapters</h2>
          <div className="mt-6 space-y-4">
            {chapters.map((chapter, index) => (
              <div key={index} className="border-b pb-3">
                <p className="text-sm font-bold">{chapter.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{chapter.summary}</p>
                {chapter.file && (
                  <p className="mt-1 text-xs text-blue-600">Attached: {chapter.file.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {chapters.filter((chapter) => chapter.file?.url).map((chapter, index) => (
          <div key={index} className="mb-4">
            <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">{chapter.name}</p>
            <div className="bg-white aspect-[1/1.414] w-full border border-slate-200 relative overflow-hidden">
              <UploadedFilePreview
                src={chapter.file!.url}
                title={chapter.name}
                alt={chapter.name}
                imageStyle={{ objectFit: "fill" }}
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Report Chapters"
        description="10 chapters as per EMGSM 2020. Officer handles chapters 1-5, DEO handles chapters 6-10."
        action={
          <div className="flex gap-2">
            <button
              className="module-btn"
              onClick={async () => {
                try {
                  await downloadChaptersPdf(chapters);
                  toast.success("Chapters PDF downloaded");
                } catch (error) {
                  console.error("Chapters PDF generation failed:", error);
                  toast.error("PDF download failed. Please re-upload the missing file.");
                }
              }}
            >
              <Download size={17} />
              Download PDF
            </button>
            <button
              className="module-btn-primary"
              disabled={!canEditAnyChapter}
              onClick={() => setChapters((current) => [...current, { name: `CHAPTER ${current.length + 1} - ENTER TITLE`, summary: "Enter chapter summary." }])}
            >
              <Plus size={17} />
              Add Chapter
            </button>
            <button className="module-btn-primary" disabled={saving} onClick={saveDraft}>
              <Save size={17} />
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        }
      />
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout leftPanel={leftPanel} rightPanel={rightPanel} leftPanelDefaultSize={60} rightPanelDefaultSize={40} />
      </div>
    </>
  );
}
