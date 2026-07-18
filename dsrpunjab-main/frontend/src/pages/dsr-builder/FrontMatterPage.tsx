import { FileUp, Replace, Save, Trash2, Download } from "lucide-react";
import { useState } from "react";
import html2pdf from "html2pdf.js";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";

const defaults = { title:"District Survey Report for Sand Mining", district:"Jalandhar", state:"Punjab", year:"2025-26", version:"Final Draft", preparedBy:"Sub-Divisional Committee, Jalandhar District", assistedBy:"RSP Green Development and Laboratories Pvt. Ltd.", preface:"This District Survey Report has been prepared in compliance with EMGSM 2020 and records sand mining activity, river morphology, mineral deposits and replenishment studies.", acknowledgement:"The Sub-Divisional Committee acknowledges the support of the Government of Punjab, Department of Geology and Mining, and field surveyors." };
type UploadRecord={name:string;preview?:string};

export default function FrontMatterPage(){
  const {projectId="default"}=useParams();
  const [data,setData]=useLocalDraft(`project-${projectId}:front-matter`,defaults);
  
  const [coverFile,setCoverFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:cover`,null);
  const [certFile,setCertFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:certificate`,null);
  const [contentFile,setContentFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:contents`,null);
  const [prefaceFile,setPrefaceFile]=useLocalDraft<UploadRecord|null>(`project-${projectId}:preface`,null);

  const field=(key:keyof typeof data,label:string)=><label className="block text-sm font-semibold text-slate-700">{label}<input value={data[key]} onChange={e=>setData(v=>({...v,[key]:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"/></label>;
  
  const leftPanel = (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="space-y-5">
        <Card title="Cover Page" subtitle="Upload a PDF or image, or use the generated template">
          <Upload file={coverFile} onChange={setCoverFile} label="Upload Cover Page" hint="PDF or image" accept=".pdf,image/*" />
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
          <Upload file={certFile} onChange={setCertFile} label="Upload Certificate" hint="PDF or image" accept=".pdf,image/*"/>
        </Card>
      </section>
      <section className="space-y-5">
        <Card title="Content Page" subtitle="Upload PDF or use the auto-generated contents">
          <Upload file={contentFile} onChange={setContentFile} label="Upload Content Page" hint="PDF or image" accept=".pdf,image/*"/>
          <AutoContents/>
        </Card>
        <Card title="Preface">
          <Upload file={prefaceFile} onChange={setPrefaceFile} label="Upload Preface" hint="PDF or image" accept=".pdf,image/*"/>
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
        <div id="front-matter-pdf-preview" className="flex flex-col gap-6 items-center">
          
          {/* Cover Page */}
          <div className={`bg-[#ffffff] aspect-[1/1.414] w-full max-w-[794px] text-center border border-[#e2e8f0] shrink-0 flex flex-col relative overflow-hidden ${coverFile?.preview ? 'p-0' : 'p-10'}`}>
            {coverFile?.preview ? (
              <UploadedPreview src={coverFile.preview} className="w-full h-full flex-1 object-fill" />
            ) : (
              <div className="flex-1 flex flex-col pt-10">
                <p className="text-xs font-bold uppercase tracking-[.2em]">Government of {data.state}</p>
                <h1 className="mt-24 text-3xl font-bold uppercase leading-tight">{data.title}</h1>
                <p className="mt-8 text-xl text-[#0f172a]">District {data.district}</p>
                <p className="mt-2 text-[#64748b]">{data.year} • {data.version}</p>
                <div className="mx-auto mt-16 h-1 w-32 bg-[#1d4ed8]"/>
                <p className="mt-20 text-sm font-semibold text-[#0f172a]">Prepared By</p>
                <p className="mt-2 text-sm text-[#0f172a]">{data.preparedBy}</p>
                <p className="mt-12 text-xs text-[#64748b]">Assisted By<br/>{data.assistedBy}</p>
              </div>
            )}
          </div>

          {/* Certificate Page */}
          <div className={`bg-[#ffffff] aspect-[1/1.414] w-full max-w-[794px] text-center border border-[#e2e8f0] shrink-0 flex flex-col relative overflow-hidden ${certFile?.preview ? 'p-0' : 'p-10'}`}>
            {certFile?.preview ? (
              <UploadedPreview src={certFile.preview} className="w-full h-full flex-1 object-fill" />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#94a3b8] border-2 border-dashed border-[#e2e8f0] m-10">
                Certificate of Compliance Not Uploaded
              </div>
            )}
          </div>

          {/* Preface Page */}
          <div className={`bg-[#ffffff] aspect-[1/1.414] w-full max-w-[794px] text-left border border-[#e2e8f0] shrink-0 flex flex-col relative overflow-hidden ${prefaceFile?.preview ? 'p-0' : 'p-10'}`}>
            {prefaceFile?.preview ? (
              <UploadedPreview src={prefaceFile.preview} className="w-full h-full flex-1 object-fill" />
            ) : (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-bold uppercase text-center mb-10 text-[#0f172a]">Preface</h2>
                <div className="whitespace-pre-wrap flex-1 text-[#0f172a]">{data.preface}</div>
              </div>
            )}
          </div>

          {/* Acknowledgement Page */}
          <div className="bg-[#ffffff] aspect-[1/1.414] w-full max-w-[794px] p-10 text-left border border-[#e2e8f0] shrink-0 flex flex-col relative overflow-hidden">
            <h2 className="text-xl font-bold uppercase text-center mb-10 text-[#0f172a]">Acknowledgement</h2>
            <div className="whitespace-pre-wrap flex-1 text-[#0f172a]">{data.acknowledgement}</div>
          </div>

          {/* Content Page */}
          <div className={`bg-[#ffffff] aspect-[1/1.414] w-full max-w-[794px] text-left border border-[#e2e8f0] shrink-0 flex flex-col relative overflow-hidden ${contentFile?.preview ? 'p-0' : 'p-10'}`}>
            {contentFile?.preview ? (
              <UploadedPreview src={contentFile.preview} className="w-full h-full flex-1 object-fill" />
            ) : (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-bold uppercase text-center mb-10 text-[#0f172a]">Contents</h2>
                <div className="flex-1">
                  <AutoContents/>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </aside>
  );

  return (
    <>
      <PageHeader backLink={`/projects/${projectId}`} title="Front Matter" description="Cover page, preface, content page, certificate of compliance & acknowledgements" action={<div className="flex gap-2"><button className="module-btn" onClick={() => { const element = document.getElementById("front-matter-pdf-preview"); if (element) { html2pdf().set({ margin: 0.5, filename: "Front_Matter.pdf" }).from(element).save(); } }}><Download size={17}/>Download PDF</button><button className="module-btn-primary" onClick={()=>{}}><Save size={17}/>Save Draft</button></div>}/>
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout leftPanel={leftPanel} rightPanel={rightPanel} leftPanelDefaultSize={60} rightPanelDefaultSize={40} />
      </div>
    </>
  );
}

function Card({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-bold">{title}</h2>{subtitle&&<p className="text-sm text-slate-500">{subtitle}</p>}</div><div className="p-5">{children}</div></div>}

function Upload({file,onChange,label,hint,accept}:{file:UploadRecord|null;onChange:(file:UploadRecord|null)=>void;label:string;hint:string;accept:string}){
  const select=async(selected:File|undefined)=>{
    if(!selected)return;
    const preview=selected.type.startsWith("image/")||selected.type==="application/pdf"?await readFile(selected):undefined;
    onChange({name:selected.name,preview});
  };
  const remove=()=>onChange(null);
  
  if(file) return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">Ready: {file.name}</p>
      {file.preview&&<UploadedPreview src={file.preview}/>}
      <div className="mt-3 flex gap-2">
        <label className="module-btn cursor-pointer">
          <Replace size={16}/>Replace
          <input type="file" accept={accept} hidden onChange={e=>select(e.target.files?.[0])}/>
        </label>
        <button type="button" onClick={remove} className="module-btn text-red-600">
          <Trash2 size={16}/>Delete
        </button>
      </div>
    </div>
  );
  
  return (
    <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400">
      <FileUp className="text-blue-600"/>
      <span className="mt-2 font-semibold">{label}</span>
      <span className="text-xs text-slate-500">{hint}</span>
      <input type="file" accept={accept} hidden onChange={e=>select(e.target.files?.[0])}/>
    </label>
  );
}

function UploadedPreview({src, className}:{src:string, className?:string}){
  const isPdf = src.startsWith("data:application/pdf");
  const pdfSrc = isPdf && !src.includes("#") ? `${src}#toolbar=0&navpanes=0&scrollbar=0&view=Fit` : src;
  
  return src.startsWith("data:image") ? (
    <img src={src} alt="Uploaded preview" className={className || "mt-3 max-h-72 w-full rounded-lg object-contain"}/>
  ) : (
    <iframe title="Uploaded PDF preview" src={pdfSrc} className={className || "mt-3 h-64 w-full rounded-lg border bg-[#ffffff]"} style={{ border: 'none' }}/>
  )
}

function TextArea({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <label className="mt-4 block text-sm font-semibold">{label}<textarea rows={6} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal leading-6 outline-none focus:border-blue-500"/></label>}

function AutoContents(){const entries=["Cover Page","Certificate of Compliance","Preface","Acknowledgement",...Array.from({length:10},(_,i)=>`Chapter ${i+1}`),"Plates and Maps","Cross Section Graphs","Annexures I–VII","Additional Annexures B–K","Replenishment Report / Model DSR"];return <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"><div className="flex items-center justify-between"><p className="font-semibold text-[#1e293b]">Auto-generated Contents</p><span className="text-xs text-[#047857]">Live</span></div><ol className="mt-3 space-y-1 text-xs text-[#475569]">{entries.map((entry,index)=><li key={entry} className="flex gap-2"><span className="w-5 text-[#94a3b8]">{index+1}</span><span>{entry}</span></li>)}</ol></div>}

function readFile(file:File):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)})}
