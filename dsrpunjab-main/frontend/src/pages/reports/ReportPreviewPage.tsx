import { Download, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import UploadedFilePreview from "../../components/ui/UploadedFilePreview";
import { projectsApi, type ProjectFile } from "../../api/projects.api";
import { uploadsApi } from "../../api/uploads.api";
import { appendUploadedDocument, createSectionPdf, saveSectionPdf } from "../../utils/sectionPdf";
import { toast } from "sonner";

type UploadRecord = { name: string; url?: string } | null;
type Chapter = { name: string; file?: { name: string; url: string } };
type Plate = { name: string; fileName?: string; url?: string };
type FrontMatterState = {
  coverFile?: UploadRecord;
  certFile?: UploadRecord;
  contentFile?: UploadRecord;
  prefaceFile?: UploadRecord;
};
type PreviewUpload = { id: string; title: string; name: string; url: string };

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

function UploadedSection({ upload }: { upload: PreviewUpload }) {
  return (
    <section className="pdf-page flex w-full max-w-[794px] flex-col items-center gap-4">
      <h2 className="text-xl font-bold uppercase">{upload.title}</h2>
      <div className="relative aspect-[1/1.414] w-full overflow-hidden border border-slate-200 bg-white shadow">
        <UploadedFilePreview src={upload.url} title={upload.title} alt={upload.title} imageStyle={{ objectFit: "contain" }} />
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
  const chapters = Array.isArray(chaptersState) ? chaptersState : chaptersState?.chapters || [];
  const plates = Array.isArray(platesState) ? platesState : platesState?.plates || [];

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
    if (chapter.file?.url) uploads.push({ id: `chapter-${index}`, title: chapter.name, name: chapter.file.name, url: chapter.file.url });
  });
  plates.forEach((plate, index) => {
    if (plate.url) uploads.push({ id: `plate-${index}`, title: plate.name, name: plate.fileName || plate.name, url: plate.url });
  });
  (project?.files || []).forEach((file) => uploads.push({
    id: `project-${String(file.id)}`,
    title: `${uploadSectionLabel(file)} - ${file.fileName}`,
    name: file.fileName,
    url: uploadsApi.getDownloadUrl(file.annexureId),
  }));
  const uniqueUploads = uploads.filter((upload, index) => uploads.findIndex((item) => item.url === upload.url) === index);

  const downloadFinalPdf = async () => {
    if (!uniqueUploads.length) return;
    setDownloading(true);
    try {
      const { document } = await createSectionPdf();
      const skipped: string[] = [];
      for (const upload of uniqueUploads) {
        try {
          await appendUploadedDocument(document, upload);
        } catch (error) {
          console.warn(`Skipping unreadable final-report upload: ${upload.name}`, error);
          skipped.push(upload.name);
        }
      }
      if (document.getPageCount() === 0) throw new Error("No readable uploaded documents found");
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
        description="Uploaded project documents and annexures only"
        action={<div className="flex gap-2">
          <button className="module-btn" onClick={() => window.print()}><Printer size={17} />Print</button>
          <button className="module-btn-primary" disabled={downloading || isLoading || !uniqueUploads.length} onClick={downloadFinalPdf}>
            <Download size={17} />{downloading ? "Generating..." : "Download Final PDF"}
          </button>
        </div>}
      />
      <main className="overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8">
        <article id="report-preview-article" className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center gap-12 bg-white px-4 py-16 shadow-xl md:px-12">
          {!uniqueUploads.length ? (
            <div className="flex min-h-[500px] items-center justify-center text-center text-lg text-slate-500">
              {isLoading ? "Loading uploaded documents..." : "No uploaded documents found. Upload section or annexure files to build the final PDF."}
            </div>
          ) : uniqueUploads.map((upload) => <UploadedSection key={upload.id} upload={upload} />)}
        </article>
      </main>
    </>
  );
}
