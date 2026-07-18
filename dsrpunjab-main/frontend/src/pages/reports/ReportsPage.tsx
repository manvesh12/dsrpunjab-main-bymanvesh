import { Download, Eye, FileText, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import { projectsApi, type ProjectListItem } from "../../api/projects.api";

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700", "In Progress": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700", Approved: "bg-emerald-100 text-emerald-700",
  Completed: "bg-emerald-100 text-emerald-700",
};
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not generated";
const districtLabel = (project: ProjectListItem) => project.district || (project.districtId ? `District #${project.districtId}` : "Punjab");

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { projectsApi.list().then((result) => setProjects(result.data)).catch((error) => { console.error(error); toast.error("Failed to load project reports"); }).finally(() => setLoading(false)); }, []);
  const reports = useMemo(() => projects.filter((project) => {
    const query = search.trim().toLowerCase();
    return !query || `${project.title || project.projectName} ${districtLabel(project)}`.toLowerCase().includes(query);
  }), [projects, search]);

  return <>
    <PageHeader title="DSR Reports Library" description="Live records from projects in your permitted district scope" />
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"><div className="relative max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project or district..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></div></section>
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 bg-slate-50"><tr><th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Report</th><th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">District / Year</th><th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th><th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Updated</th><th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
      {reports.map((project) => <tr key={project.id} className="group hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText size={20} /></span><div><p className="font-bold text-slate-900 group-hover:text-blue-700">{project.title || project.projectName}</p><p className="mt-1 text-xs font-medium text-slate-500">Project #{project.id}</p></div></div></td><td className="px-6 py-4"><p className="font-semibold text-slate-800">{districtLabel(project)}</p><p className="mt-1 text-xs text-slate-500">{project.year || "—"}</p></td><td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyles[project.status] || "bg-slate-100 text-slate-700"}`}>{project.status}</span></td><td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(project.updatedAt)}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><Link to={`/projects/${project.id}/preview`} className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600" title="Open preview"><Eye size={16} /></Link><Link to={`/projects/${project.id}/generate`} className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700" title="Download final PDF"><Download size={16} /></Link></div></td></tr>)}
      {!loading && !reports.length && <tr><td colSpan={5} className="px-6 py-14 text-center"><FileText size={42} className="mx-auto mb-3 text-slate-300" /><p className="font-bold text-slate-700">No project reports found</p><p className="mt-1 text-sm text-slate-500">Create a project or adjust your search.</p></td></tr>}
      {loading && <tr><td colSpan={5} className="px-6 py-14 text-center text-sm font-semibold text-slate-500">Loading project reports...</td></tr>}
    </tbody></table></div></div>
  </>;
}
