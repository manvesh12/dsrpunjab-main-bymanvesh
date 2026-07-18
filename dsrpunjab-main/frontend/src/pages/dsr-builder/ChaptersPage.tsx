import { ArrowDown, ArrowUp, Plus, Trash2, Upload, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { useAuth } from "../../security/auth.context";
import { hasPermission, Permission } from "../../security/access";
import { useParams } from "react-router-dom";

type Chapter = { name: string; summary: string; file?: { name: string; preview?: string } };

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

export default function ChaptersPage() {
  const { projectId = "default" } = useParams();
  const { user } = useAuth();
  const [chapters, setChapters] = useLocalDraft<Chapter[]>("chapters-exact", initial);
  const canEditFirstHalf = hasPermission(user, Permission.SectionChaptersFirstHalf);
  const canEditSecondHalf = hasPermission(user, Permission.SectionChaptersSecondHalf);
  const canEditAnyChapter = canEditFirstHalf || canEditSecondHalf;
  const canEditChapter = (index: number) => index < 5 ? canEditFirstHalf : canEditSecondHalf;

  const move = (index: number, direction: number) =>
    setChapters((current) => {
      const next = [...current];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });

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
              onClick={() => {
                const element = document.getElementById("chapters-pdf-preview");
                if (element) {
                  html2pdf().set({ margin: 0.5, filename: "Chapters.pdf" }).from(element).save();
                }
              }}
            >
              <Download size={17} />
              Download PDF
            </button>
          <button
            className="module-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEditAnyChapter}
            onClick={() =>
              setChapters((current) => [
                ...current,
                { name: "NEW CHAPTER - ENTER TITLE", summary: "Enter chapter summary here..." },
              ])
            }
          >
            <Plus size={17} />
            Add Chapter
          </button>
          </div>
        }
      />
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout
          leftPanelDefaultSize={60}
          rightPanelDefaultSize={40}
          leftPanel={
            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const editable = canEditChapter(index);
                return (
                  <article
                    key={index}
                    className={`flex gap-4 rounded-2xl border p-4 shadow-sm ${editable ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-80"}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {!editable && (
                        <p className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                          Locked - not accessible for you
                        </p>
                      )}
                      <input
                        value={chapter.name}
                        disabled={!editable}
                        onChange={(event) =>
                          setChapters((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                      <textarea
                        rows={2}
                        value={chapter.summary}
                        disabled={!editable}
                        onChange={(event) =>
                          setChapters((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, summary: event.target.value } : item
                            )
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                      <label className={`module-btn mt-2 ${editable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                        <Upload size={16} />
                        Upload Chapter PDF
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          hidden
                          disabled={!editable}
                          onChange={async (event) => {
                            const selected = event.target.files?.[0];
                            if (!selected) return;
                            const preview = await readFile(selected);
                            setChapters((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, file: { name: selected.name, preview } } : item
                              )
                            );
                          }}
                        />
                      </label>
                      {chapter.file && (
                        <p className="mt-2 truncate text-xs font-medium text-emerald-600">
                          Uploaded: {chapter.file.name}
                        </p>
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
                  </article>
                );
              })}
            </div>
          }
          rightPanel={
            <aside className="block h-full rounded-2xl border bg-slate-200 p-4">
              <p className="mb-3 text-xs font-bold uppercase text-slate-600">Live Chapter Index Preview</p>
              <div id="chapters-pdf-preview" className="min-h-[760px] bg-white p-8 shadow">
                <p className="text-center text-xs font-bold uppercase tracking-[.2em]">District Survey Report</p>
                <h2 className="mt-4 border-b-2 pb-4 text-center text-xl font-bold uppercase">Table of Chapters</h2>
                <div className="mt-6 space-y-4">
                  {chapters.map((chapter, index) => (
                    <div key={index} className="border-b pb-3">
                      <p className="text-sm font-bold">{chapter.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{chapter.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
