import { ArrowDown, ArrowUp, Image, Plus, Trash2, Upload, Download } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { useParams } from "react-router-dom";
import { resolveUploadUrl, uploadErrorMessage, uploadsApi } from "../../api/uploads.api";
import { toast } from "sonner";

type Plate = { name: string; summary: string; fileName?: string; url?: string };

const isPdfUrl = (url: string) => !url.match(/\.(jpe?g|png|gif|webp|bmp)$/i);

const initial: Plate[] = [
  { name: "Plate 1 - Pre/Post Monsoon Cross Section", summary: "Auto-generated elevation chart for sand volume calculation." },
  { name: "Plate 2 - Geological Subsurface Map", summary: "Detailed lithological boundaries and soil types." },
];

async function downloadPlatesPdf(plates: Plate[]) {
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  const pageStyle = `
    body { margin: 0; font-family: Arial, sans-serif; background: #fff; }
    .index-page { width: 794px; min-height: 1123px; padding: 60px; box-sizing: border-box; page-break-after: always; }
    .plate-page { width: 794px; height: 1123px; page-break-after: always; overflow: hidden; position: relative; background: #fff; }
    .plate-page img { width: 100%; height: 100%; object-fit: fill; display: block; }
  `;

  const indexHtml = `<div class="index-page">
    <p style="text-align:center;font-size:11px;font-weight:bold;letter-spacing:.2em;text-transform:uppercase;">District Survey Report</p>
    <h2 style="margin-top:12px;text-align:center;font-size:20px;font-weight:bold;text-transform:uppercase;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">List of Plates</h2>
    <div style="margin-top:24px;">
      ${plates.map((p, i) => `
        <div style="border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:12px;">
          <p style="font-weight:bold;font-size:14px;">${i + 1}. ${p.name}</p>
          <p style="font-size:12px;color:#64748b;margin-top:4px;">${p.summary}</p>
          ${p.fileName ? `<p style="font-size:11px;color:#2563eb;margin-top:4px;">Attached: ${p.fileName}</p>` : ""}
        </div>
      `).join("")}
    </div>
  </div>`;

  // For PDF export with backend URLs, only render image plates in PDF (iframe not supported in html2pdf)
  const platePages = plates.filter(p => p.url && !isPdfUrl(p.url)).map(p => {
    return `<div class="plate-page">
      <img src="${p.url}" />
    </div>`;
  }).join("");

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${pageStyle}</style></head><body>${indexHtml}${platePages}</body></html>`;

  const container = document.createElement("div");
  container.innerHTML = fullHtml;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  await html2pdf()
    .set({
      margin: 0,
      filename: "Plates.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

export default function PlatesPage() {
  const { projectId = "default" } = useParams();
  const [plates, setPlates] = useLocalDraft<Plate[]>("plates-exact", initial);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);

  const update = (i: number, p: Partial<Plate>) => setPlates(c => c.map((x, j) => j === i ? { ...x, ...p } : x));
  const move = (i: number, d: number) => setPlates(c => { const n = [...c]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  const leftPanel = (
    <div className="space-y-4">
      {plates.map((plate, i) => (
        <article key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Image size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <input value={plate.name} onChange={e => update(i, { name: e.target.value })} className="w-full rounded-lg border px-3 py-2 font-bold outline-none focus:border-blue-500" />
              <textarea value={plate.summary} onChange={e => update(i, { summary: e.target.value })} rows={2} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <label className="module-btn mt-2 cursor-pointer">
                <Upload size={16} />
                {uploading === i ? "Uploading..." : (plate.fileName || "Upload PDF / Image")}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  hidden
                  disabled={uploading === i}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(i);
                    try {
                      const result = await uploadsApi.upload(file, projectId, "plates");
                      update(i, { fileName: file.name, url: result.url });
                      toast.success(`${file.name} uploaded`);
                    } catch (error) {
                      toast.error(uploadErrorMessage(error));
                    } finally {
                      setUploading(null);
                    }
                  }}
                />
              </label>
              {plate.url && (
                <div className="mt-2 rounded-lg overflow-hidden border" style={{ height: 80 }}>
                  {!isPdfUrl(resolveUploadUrl(plate.url))
                    ? <img src={resolveUploadUrl(plate.url)} alt="preview" className="w-full h-full object-contain" />
                    : <iframe src={`${resolveUploadUrl(plate.url)}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="w-full h-full" style={{ border: 'none' }} title="plate preview" />
                  }
                </div>
              )}
            </div>
            <div>
              <button disabled={i === 0} onClick={() => move(i, -1)} className="block rounded p-2 disabled:opacity-30"><ArrowUp size={17} /></button>
              <button disabled={i === plates.length - 1} onClick={() => move(i, 1)} className="block rounded p-2 disabled:opacity-30"><ArrowDown size={17} /></button>
              <button onClick={() => setPlates(c => c.filter((_, j) => j !== i))} className="block rounded p-2 text-red-500"><Trash2 size={17} /></button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const rightPanel = (
    <aside className="h-full rounded-2xl border bg-slate-100 p-4 flex flex-col">
      <p className="mb-3 text-xs font-bold uppercase text-slate-500 shrink-0">Live plate index preview</p>
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {/* Index page */}
        <div id="plates-pdf-preview" className="bg-white p-8 shadow mb-4">
          <p className="text-center text-xs font-bold uppercase tracking-widest">District Survey Report</p>
          <h2 className="mt-3 text-center text-xl font-bold uppercase">List of Plates</h2>
          <div className="mt-8 space-y-5">
            {plates.map((p, i) => (
              <div key={i} className="border-b pb-3">
                <p className="font-bold">{i + 1}. {p.name}</p>
                <p className="text-sm text-slate-600">{p.summary}</p>
                {p.fileName && <p className="mt-1 text-xs text-blue-600">Attached: {p.fileName}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Individual plate previews - full A4 aspect ratio */}
        {plates.filter(p => p.url).map((p, i) => (
          <div key={i} className="mb-4">
            <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">{p.name}</p>
            <div className="bg-white aspect-[1/1.414] w-full border border-slate-200 relative overflow-hidden">
              {!isPdfUrl(resolveUploadUrl(p.url)) ? (
                <img src={resolveUploadUrl(p.url)} alt={p.name} className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
              ) : (
                <iframe
                  title={p.name}
                  src={`${resolveUploadUrl(p.url)}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 'none', display: 'block' }}
                />
              )}
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
        title="Plate Section"
        description="Upload PDFs and images. Each entry becomes a plate in the final DSR report."
        action={
          <div className="flex gap-2">
            <button
              className="module-btn"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadPlatesPdf(plates);
                }
                catch (e) { console.error("PDF generation failed:", e); }
                finally { setDownloading(false); }
              }}
            >
              <Download size={17} />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button className="module-btn-primary" onClick={() => setPlates(c => [...c, { name: `Plate ${c.length + 1} - Enter Title`, summary: "Enter plate description" }])}>
              <Plus size={17} />Add Plate
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
