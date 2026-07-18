import { FileUp, Replace, Save, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { uploadsApi } from "../../api/uploads.api";
import { toast } from "sonner";

const defaults = { title:"District Survey Report for Sand Mining", district:"Jalandhar", state:"Punjab", year:"2025-26", version:"Final Draft", preparedBy:"Sub-Divisional Committee, Jalandhar District", assistedBy:"RSP Green Development and Laboratories Pvt. Ltd.", preface:"This District Survey Report has been prepared in compliance with EMGSM 2020 and records sand mining activity, river morphology, mineral deposits and replenishment studies.", acknowledgement:"The Sub-Divisional Committee acknowledges the support of the Government of Punjab, Department of Geology and Mining, and field surveyors." };
type UploadRecord={name:string;url?:string};

const isPdfUrl = (file: UploadRecord | null) => Boolean(file?.url && !file.url.match(/\.(jpe?g|png|gif|webp|bmp)$/i));

function downloadUploadedPdfs(_files: Array<{ label: string; file: UploadRecord | null }>) {
  return 0; // PDFs now served from backend URL; not base64
}

async function downloadPdf(
  coverFile: UploadRecord | null,
  certFile: UploadRecord | null,
  contentFile: UploadRecord | null,
  prefaceFile: UploadRecord | null,
  data: typeof defaults
) {
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  const pageStyle = `
    body { margin: 0; font-family: Arial, sans-serif; background: #fff; }
    .page { width: 794px; min-height: 1123px; page-break-after: always; overflow: hidden; position: relative; background: #fff; box-sizing: border-box; }
    .page-inner { padding: 60px; box-sizing: border-box; min-height: 1123px; display: flex; flex-direction: column; }
    .page img { width: 794px; height: 1123px; object-fit: fill; display: block; }
  `;

  const toImg = (src: string) => `<img src="${src}" width="794" height="1123" style="object-fit:fill;display:block;" />`;

  const coverHtml = coverFile?.url
    ? `<div class="page">${toImg(coverFile.url)}</div>`
    : `<div class="page"><div class="page-inner" style="text-align:center;align-items:center;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:.2em;text-transform:uppercase;">Government of ${data.state}</p>
        <h1 style="margin-top:80px;font-size:28px;font-weight:bold;text-transform:uppercase;line-height:1.3;">${data.title}</h1>
        <p style="margin-top:30px;font-size:18px;">District ${data.district}</p>
        <p style="margin-top:8px;color:#64748b;">${data.year} • ${data.version}</p>
        <div style="margin:60px auto 0;height:4px;width:120px;background:#1d4ed8;"></div>
        <p style="margin-top:80px;font-size:13px;font-weight:600;">Prepared By</p>
        <p style="margin-top:8px;font-size:13px;">${data.preparedBy}</p>
        <p style="margin-top:50px;font-size:11px;color:#64748b;">Assisted By<br/>${data.assistedBy}</p>
      </div></div>`;

  const certHtml = certFile?.url
    ? `<div class="page">${toImg(certFile.url)}</div>`
    : `<div class="page"><div class="page-inner" style="justify-content:center;align-items:center;">
        <p style="color:#94a3b8;border:2px dashed #e2e8f0;padding:40px 60px;">Certificate of Compliance Not Uploaded</p>
      </div></div>`;

  const prefaceHtml = prefaceFile?.url
    ? `<div class="page">${toImg(prefaceFile.url)}</div>`
    : `<div class="page"><div class="page-inner">
        <h2 style="font-size:20px;font-weight:bold;text-transform:uppercase;text-align:center;margin-bottom:40px;">Preface</h2>
        <div style="white-space:pre-wrap;line-height:1.7;">${data.preface}</div>
      </div></div>`;

  const contentHtml = contentFile?.url
    ? `<div class="page">${toImg(contentFile.url)}</div>`
    : `<div class="page"><div class="page-inner">
        <h2 style="font-size:20px;font-weight:bold;text-transform:uppercase;text-align:center;margin-bottom:40px;">Contents</h2>
        <ol style="font-size:13px;line-height:2;list-style:decimal;padding-left:20px;">
          ${["Cover Page","Certificate of Compliance","Preface","Acknowledgement",...Array.from({length:10},(_,i)=>`Chapter ${i+1}`),"Plates and Maps","Cross Section Graphs","Annexures I-VII"].map(e=>`<li>${e}</li>`).join("")}
        </ol>
      </div></div>`;

  const ackHtml = `<div class="page"><div class="page-inner">
    <h2 style="font-size:20px;font-weight:bold;text-transform:uppercase;text-align:center;margin-bottom:40px;">Acknowledgement</h2>
    <div style="white-space:pre-wrap;line-height:1.7;">${data.acknowledgement}</div>
  </div></div>`;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${pageStyle}</style></head><body>${coverHtml}${certHtml}${prefaceHtml}${ackHtml}${contentHtml}</body></html>`;

  const container = document.createElement("div");
  container.innerHTML = fullHtml;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  await html2pdf()
    .set({
      margin: 0,
      filename: "Front_Matter.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

export default function FrontMatterPage(){
  const {projectId="default"}=useParams();
  const [data,setData]=useLocalDraft(`project-${projectId}:front-matter`,defaults);
  const [downloading, setDownloading] = useState(false);
  
  const [coverFile,setCoverFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:cover`,null);
  const [certFile,setCertFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:certificate`,null);
  const [contentFile,setContentFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:contents`,null);
  const [prefaceFile,setPrefaceFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:preface`,null);

  const field=(key:keyof typeof data,label:string)=><label className="block text-sm font-semibold text-slate-700">{label}<input value={data[key]} onChange={e=>setData(v=>({...v,[key]:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"/></label>;
  
  const leftPanel = (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="space-y-5">
        <Card title="Cover Page" subtitle="Upload a PDF or image, or use the generated template">
          <Upload file={coverFile} onChange={setCoverFile} label="Upload Cover Page" hint="PDF or image" accept=".pdf,image/*" projectId={projectId} module="front-matter" />
          <div className="mt-5 grid gap-4">
            {field("title","Report Title")}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("district","District")}
              {field("state","State")}
              {field("year","Year")}
              {field("version","Version")}
            </div>
            {field("preparedBy","Prepared By")}
            {field("assistedBy","Assisted By")}
          </div>
        </Card>
        <Card title="Certificate of Compliance">
          <Upload file={certFile} onChange={setCertFile} label="Upload Certificate" hint="PDF or image" accept=".pdf,image/*" projectId={projectId} module="front-matter" />
        </Card>
      </section>
      <section className="space-y-5">
        <Card title="Content Page" subtitle="Upload PDF or use the auto-generated contents">
          <Upload file={contentFile} onChange={setContentFile} label="Upload Content Page" hint="PDF or image" accept=".pdf,image/*" projectId={projectId} module="front-matter" />
          <AutoContents/>
        </Card>
        <Card title="Preface">
          <Upload file={prefaceFile} onChange={setPrefaceFile} label="Upload Preface" hint="PDF or image" accept=".pdf,image/*" projectId={projectId} module="front-matter" />
          <TextArea label="Preface Text" value={data.preface} onChange={value=>setData(v=>({...v,preface:value}))}/>
        </Card>
        <Card title="Acknowledgement">
          <TextArea label="Acknowledgement Text" value={data.acknowledgement} onChange={value=>setData(v=>({...v,acknowledgement:value}))}/>
        </Card>
      </section>
    </div>
  );

  const rightPanel = (
    <aside className="h-full rounded-2xl border bg-slate-200 p-4 flex flex-col">
      <p className="mb-3 text-xs font-bold uppercase text-slate-600 shrink-0">Live Front Matter Preview</p>
      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl pb-10 custom-scrollbar">
        <div id="front-matter-pdf-preview" className="flex flex-col gap-6 items-center" style={{ color: '#0f172a' }}>
          <style>{`
            #front-matter-pdf-preview * {
              border-color: #e2e8f0 !important;
              outline-color: transparent !important;
              box-shadow: none !important;
            }
          `}</style>
          
          {/* Cover Page */}
          <PageSlot file={coverFile}>
            <div className="flex-1 flex flex-col pt-10 text-center p-10">
              <p className="text-xs font-bold uppercase tracking-[.2em]">Government of {data.state}</p>
              <h1 className="mt-24 text-3xl font-bold uppercase leading-tight">{data.title}</h1>
              <p className="mt-8 text-xl">District {data.district}</p>
              <p className="mt-2 text-[#64748b]">{data.year} • {data.version}</p>
              <div className="mx-auto mt-16 h-1 w-32 bg-[#1d4ed8]"/>
              <p className="mt-20 text-sm font-semibold">Prepared By</p>
              <p className="mt-2 text-sm">{data.preparedBy}</p>
              <p className="mt-12 text-xs text-[#64748b]">Assisted By<br/>{data.assistedBy}</p>
            </div>
          </PageSlot>

          {/* Certificate Page */}
          <PageSlot file={certFile}>
            <div className="flex-1 flex items-center justify-center text-[#94a3b8] border-2 border-dashed border-[#e2e8f0] m-10">
              Certificate of Compliance Not Uploaded
            </div>
          </PageSlot>

          {/* Preface Page */}
          <PageSlot file={prefaceFile}>
            <div className="flex-1 flex flex-col p-10">
              <h2 className="text-xl font-bold uppercase text-center mb-10">Preface</h2>
              <div className="whitespace-pre-wrap flex-1">{data.preface}</div>
            </div>
          </PageSlot>

          {/* Acknowledgement Page */}
          <div className="bg-white aspect-[1/1.414] w-full max-w-[794px] p-10 text-left border border-[#e2e8f0] shrink-0 flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold uppercase text-center mb-10">Acknowledgement</h2>
            <div className="whitespace-pre-wrap flex-1">{data.acknowledgement}</div>
          </div>

          {/* Content Page */}
          <PageSlot file={contentFile}>
            <div className="flex-1 flex flex-col p-10">
              <h2 className="text-xl font-bold uppercase text-center mb-10">Contents</h2>
              <div className="flex-1"><AutoContents/></div>
            </div>
          </PageSlot>

        </div>
      </div>
    </aside>
  );

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Front Matter"
        description="Cover page, preface, content page, certificate of compliance & acknowledgements"
        action={
          <div className="flex gap-2">
            <button
              className="module-btn"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const downloadedUploads = downloadUploadedPdfs([
                    { label: "Cover_Page.pdf", file: coverFile },
                    { label: "Certificate.pdf", file: certFile },
                    { label: "Content_Page.pdf", file: contentFile },
                    { label: "Preface.pdf", file: prefaceFile },
                  ]);
                  const hasGeneratedContent = [coverFile, certFile, contentFile, prefaceFile].some((file) => !isPdfUrl(file));
                  if (hasGeneratedContent || downloadedUploads === 0) {
                    await downloadPdf(
                      isPdfUrl(coverFile) ? null : coverFile,
                      isPdfUrl(certFile) ? null : certFile,
                      isPdfUrl(contentFile) ? null : contentFile,
                      isPdfUrl(prefaceFile) ? null : prefaceFile,
                      data
                    );
                  }
                }
                catch(e) { console.error("PDF generation failed:", e); }
                finally { setDownloading(false); }
              }}
            >
              <Download size={17}/>
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button className="module-btn-primary" onClick={()=>{}}>
              <Save size={17}/>Save Draft
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

/** A4 page slot: shows uploaded file at full size, or renders fallback children */
function PageSlot({ file, children }: { file: UploadRecord | null; children: React.ReactNode }) {
  return (
    <div className="bg-white aspect-[1/1.414] w-full max-w-[794px] border border-[#e2e8f0] shrink-0 relative overflow-hidden flex flex-col">
      {file?.url ? (
        <UploadedPreview src={file.url} />
      ) : (
        children
      )}
    </div>
  );
}

function Card({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){
  return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-bold">{title}</h2>{subtitle&&<p className="text-sm text-slate-500">{subtitle}</p>}</div><div className="p-5">{children}</div></div>;
}

function Upload({file,onChange,label,hint,accept,projectId,module}:{file:UploadRecord|null;onChange:(f:UploadRecord|null)=>void;label:string;hint:string;accept:string;projectId:string;module:string}){
  const [isUploading, setIsUploading] = useState(false);
  const select=async(selected:File|undefined)=>{
    if(!selected)return;
    setIsUploading(true);
    try {
      const result = await uploadsApi.upload(selected, projectId, module);
      onChange({name:selected.name,url:result.url});
      toast.success(`${selected.name} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };
  if(file) return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">{isUploading ? "Uploading..." : `Ready: ${file.name}`}</p>
      {file.url&&<UploadedPreview src={file.url} small/>}
      <div className="mt-3 flex gap-2">
        <label className="module-btn cursor-pointer"><Replace size={16}/>Replace<input type="file" accept={accept} hidden disabled={isUploading} onChange={e=>select(e.target.files?.[0])}/></label>
        <button type="button" onClick={()=>onChange(null)} className="module-btn text-red-600"><Trash2 size={16}/>Delete</button>
      </div>
    </div>
  );
  return (
    <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400">
      <FileUp className="text-blue-600"/>
      <span className="mt-2 font-semibold">{isUploading ? "Uploading..." : label}</span>
      <span className="text-xs text-slate-500">{hint}</span>
      <input type="file" accept={accept} hidden disabled={isUploading} onChange={e=>select(e.target.files?.[0])}/>
    </label>
  );
}

function UploadedPreview({ src, small = false }: { src: string; small?: boolean }) {
  const isImage = !src.match(/\.pdf(#.*)?$/) && (src.match(/\.(jpe?g|png|gif|webp|bmp)$/) || src.startsWith("data:image"));

  if (small) {
    return isImage ? (
      <img src={src} alt="Uploaded preview" className="mt-3 max-h-48 w-full rounded-lg object-contain border" />
    ) : (
      <iframe
        title="PDF thumbnail"
        src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
        className="mt-3 h-48 w-full rounded-lg border bg-white"
        style={{ border: 'none' }}
      />
    );
  }

  // Full-page slot: absolute fill so it respects the A4 aspect-ratio container exactly
  return isImage ? (
    <img src={src} alt="Uploaded preview" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
  ) : (
    <iframe
      title="PDF preview"
      src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`}
      className="absolute inset-0 w-full h-full"
      style={{ border: 'none', display: 'block' }}
    />
  );
}

function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
  return <label className="mt-4 block text-sm font-semibold">{label}<textarea rows={6} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal leading-6 outline-none focus:border-blue-500"/></label>;
}

function AutoContents(){
  const entries=["Cover Page","Certificate of Compliance","Preface","Acknowledgement",...Array.from({length:10},(_,i)=>`Chapter ${i+1}`),"Plates and Maps","Cross Section Graphs","Annexures I–VII","Additional Annexures B–K","Replenishment Report / Model DSR"];
  return <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"><div className="flex items-center justify-between"><p className="font-semibold text-[#1e293b]">Auto-generated Contents</p><span className="text-xs text-[#047857]">Live</span></div><ol className="mt-3 space-y-1 text-xs text-[#475569]">{entries.map((entry,index)=><li key={entry} className="flex gap-2"><span className="w-5 text-[#94a3b8]">{index+1}</span><span>{entry}</span></li>)}</ol></div>;
}
