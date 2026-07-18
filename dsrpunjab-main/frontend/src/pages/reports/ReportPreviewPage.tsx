import { Download, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { downloadHtmlAsPdf } from "../../utils/reportExport";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { projectsApi } from "../../api/projects.api";
import { toast } from "sonner";

type UploadRecord = { name: string; url?: string } | null;
type Chapter = { name: string; summary: string; file?: { name: string; url: string } };
type Plate = { name: string; summary: string; fileName?: string; url?: string };
type Graph = { id: string; name: string; area?: string; bulk?: string; pct?: string };

type FrontMatterState = {
  data?: {
    title?: string;
    district?: string;
    state?: string;
    year?: string;
    version?: string;
    preparedBy?: string;
    assistedBy?: string;
    preface?: string;
    acknowledgement?: string;
  };
  coverFile?: UploadRecord;
  certFile?: UploadRecord;
  contentFile?: UploadRecord;
  prefaceFile?: UploadRecord;
};

function UploadedSection({ file, title }: { file: UploadRecord | undefined; title: string }) {
  if (!file?.url) return null;

  return (
    <section className="pdf-page flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold uppercase">{title}</h2>
      <div className="relative aspect-[1/1.414] w-full max-w-[794px] overflow-hidden border border-slate-200 bg-white shadow">
        <UploadedFilePreview src={file.url} title={title} alt={title} imageStyle={{ objectFit: "fill" }} />
      </div>
    </section>
  );
}

export default function ReportPreviewPage() {
  const { projectId = "default" } = useParams();
  const [downloading, setDownloading] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, "preview"],
    queryFn: () => projectsApi.get(projectId),
    enabled: /^\d+$/.test(projectId),
  });

  const state = project?.projectState || {};
  const frontMatter = state["front-matter"] as FrontMatterState | undefined;
  const chaptersState = state.chapters as { chapters?: Chapter[] } | Chapter[] | undefined;
  const platesState = state.plates as { plates?: Plate[] } | Plate[] | undefined;
  const crossSectionsState = state["cross-sections"] as { graphs?: Graph[] } | Graph[] | undefined;

  const data = frontMatter?.data || {};
  const chapters = Array.isArray(chaptersState) ? chaptersState : chaptersState?.chapters || [];
  const plates = Array.isArray(platesState) ? platesState : platesState?.plates || [];
  const graphs = Array.isArray(crossSectionsState) ? crossSectionsState : crossSectionsState?.graphs || [];

  const hasContent = Boolean(
    frontMatter ||
    chapters.length ||
    plates.length ||
    graphs.length
  );

  const downloadFinalPdf = async () => {
    const element = document.getElementById("report-preview-article");
    if (!element) return;

    setDownloading(true);
    try {
      await downloadHtmlAsPdf(element, `DSR-Final-Report-${projectId}.pdf`);
      toast.success("Final PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Final PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Live Report Preview"
        description={`Continuous compiled preview of saved sections for project #${projectId}`}
        action={
          <div className="flex gap-2">
            <button className="module-btn" onClick={() => window.print()}>
              <Printer size={17} />
              Print
            </button>
            <button className="module-btn-primary" disabled={downloading || isLoading || !hasContent} onClick={downloadFinalPdf}>
              <Download size={17} />
              {downloading ? "Generating..." : "Download Final PDF"}
            </button>
          </div>
        }
      />

      <main className="rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8 overflow-y-auto">
        <article id="report-preview-article" className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center gap-12 bg-white px-4 py-16 shadow-xl md:px-12">
          {!hasContent ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
              <p className="max-w-md text-lg text-slate-500">
                {isLoading ? "Loading saved project sections..." : "No saved sections found. Open a section, upload data, then click Save Draft or Save All Sections."}
              </p>
            </div>
          ) : (
            <>
              <section className="pdf-page flex aspect-[1/1.414] w-full max-w-[794px] flex-col items-center justify-center border border-slate-200 bg-white p-12 text-center shadow">
                <p className="text-xs font-bold uppercase tracking-[.2em]">Government of {data.state || "Punjab"}</p>
                <h1 className="mt-20 text-3xl font-bold uppercase leading-tight">{data.title || project?.title || project?.projectName || "District Survey Report"}</h1>
                <p className="mt-8 text-xl">District {data.district || project?.district || ""}</p>
                <p className="mt-2 text-slate-500">{data.year || project?.year || "2025-26"} - {data.version || "Final Draft"}</p>
                <div className="mx-auto mt-16 h-1 w-32 bg-blue-700" />
                <p className="mt-20 text-sm font-semibold">Prepared By</p>
                <p className="mt-2 text-sm">{data.preparedBy || "Sub-Divisional Committee"}</p>
                {data.assistedBy && <p className="mt-12 text-xs text-slate-500">Assisted By<br />{data.assistedBy}</p>}
              </section>

              <UploadedSection file={frontMatter?.coverFile} title="Uploaded Cover Page" />
              <UploadedSection file={frontMatter?.certFile} title="Certificate of Compliance" />
              <UploadedSection file={frontMatter?.prefaceFile} title="Preface Upload" />

              {!frontMatter?.prefaceFile?.url && data.preface && (
                <section className="pdf-page aspect-[1/1.414] w-full max-w-[794px] border border-slate-200 bg-white p-12 shadow">
                  <h2 className="mb-10 text-center text-xl font-bold uppercase">Preface</h2>
                  <div className="whitespace-pre-wrap leading-7">{data.preface}</div>
                </section>
              )}

              {data.acknowledgement && (
                <section className="pdf-page aspect-[1/1.414] w-full max-w-[794px] border border-slate-200 bg-white p-12 shadow">
                  <h2 className="mb-10 text-center text-xl font-bold uppercase">Acknowledgement</h2>
                  <div className="whitespace-pre-wrap leading-7">{data.acknowledgement}</div>
                </section>
              )}

              <UploadedSection file={frontMatter?.contentFile} title="Content Page" />

              <section className="pdf-page w-full max-w-[794px] border border-slate-200 bg-white p-12 shadow">
                <h2 className="mb-8 text-center text-xl font-bold uppercase">Chapters</h2>
                <div className="space-y-4">
                  {chapters.map((chapter, index) => (
                    <div key={`${chapter.name}-${index}`} className="border-b border-slate-200 pb-4">
                      <p className="font-bold">{index + 1}. {chapter.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{chapter.summary}</p>
                      {chapter.file && <p className="mt-1 text-xs text-blue-600">Attached: {chapter.file.name}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {chapters.filter((chapter) => chapter.file?.url).map((chapter, index) => (
                <UploadedSection key={`${chapter.name}-${index}-file`} file={chapter.file || null} title={chapter.name} />
              ))}

              {plates.length > 0 && (
                <section className="pdf-page w-full max-w-[794px] border border-slate-200 bg-white p-12 shadow">
                  <h2 className="mb-8 text-center text-xl font-bold uppercase">Plates and Maps</h2>
                  <div className="space-y-4">
                    {plates.map((plate, index) => (
                      <div key={`${plate.name}-${index}`} className="border-b border-slate-200 pb-4">
                        <p className="font-bold">{index + 1}. {plate.name}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{plate.summary}</p>
                        {plate.fileName && <p className="mt-1 text-xs text-blue-600">Attached: {plate.fileName}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {plates.filter((plate) => plate.url).map((plate, index) => (
                <UploadedSection key={`${plate.name}-${index}-file`} file={plate.url ? { name: plate.fileName || plate.name, url: plate.url } : null} title={plate.name} />
              ))}

              {graphs.length > 0 && (
                <section className="pdf-page w-full max-w-[794px] border border-slate-200 bg-white p-12 shadow">
                  <h2 className="mb-8 text-center text-xl font-bold uppercase">Cross Section Graphs</h2>
                  <div className="space-y-4">
                    {graphs.map((graph, index) => (
                      <div key={graph.id || index} className="border-b border-slate-200 pb-4">
                        <p className="font-bold">{index + 1}. {graph.name}</p>
                        <p className="mt-1 text-sm text-slate-600">Area: {graph.area || "-"} Ha | Bulk Density: {graph.bulk || "-"} | Permitted: {graph.pct || "-"}%</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="w-full border-t-2 border-dashed border-slate-300 pt-12 text-center text-slate-400">
                <p>End of Report Document</p>
              </div>
            </>
          )}
        </article>
      </main>
    </>
  );
}
