import {
  Bell,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  Landmark,
  LockKeyhole,
  Mail,
  MapPinned,
  Menu,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "../../api/settings.api";
import ThemeToggle from "../../components/ui/ThemeToggle";

type Announcement = { title: string; date?: string; category?: string; active?: boolean };

const services = [
  { icon: FileText, title: "District Survey Report Workspace", text: "Prepare, update and maintain chapter-wise DSR content.", to: "/login" },
  { icon: Workflow, title: "Review and Approval Workflow", text: "Track submissions, observations and authority-level approvals.", to: "/login" },
  { icon: MapPinned, title: "District Directory", text: "Access district-wise DSR projects and reporting coverage.", to: "/districts" },
  { icon: CircleHelp, title: "Portal Helpdesk", text: "Find assistance for portal access and report preparation.", to: "#contact" },
];

const districts = ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar", "S.A.S. Nagar", "Sangrur", "S.B.S. Nagar", "Sri Muktsar Sahib", "Tarn Taran"];

export default function HomePage() {
  const { data: announcementsSetting } = useQuery({ queryKey: ["settings", "announcements"], queryFn: () => settingsApi.get("announcements") });
  let announcements: Announcement[] = [];
  if (announcementsSetting?.value) {
    try { announcements = JSON.parse(announcementsSetting.value); } catch { announcements = []; }
  }
  const activeAnnouncements = announcements.filter((item) => item.active);
  const notices = activeAnnouncements.length ? activeAnnouncements.slice(0, 5) : [{ title: "District Survey Report portal is available for authorised departmental users.", category: "Information", date: "Current" }];

  return (
    <div className="public-portal min-h-screen bg-[#f5f5f5] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="govt-topbar">
        <div className="govt-container flex min-h-9 items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-2 font-semibold"><Landmark size={13} /> Government of Punjab <span className="opacity-40">|</span> Department of Mines &amp; Geology</span>
          <div className="flex items-center gap-3"><a href="#main-content" className="hidden hover:underline sm:inline">Skip to main content</a><span className="hidden opacity-40 sm:inline">|</span><span className="hidden font-bold md:inline">A- &nbsp; A &nbsp; A+</span><ThemeToggle /></div>
        </div>
      </div>

      <header className="border-b border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="govt-container flex items-center justify-between gap-5 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-4">
            <img src="/assets/Emblem_of_India.svg.png" alt="State Emblem of India" className="h-[66px] w-auto object-contain" />
            <div className="hidden h-14 w-px bg-slate-300 sm:block dark:bg-slate-700" />
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a4b08]">Government of Punjab</p><h1 className="mt-1 text-xl font-extrabold text-[#123c6e] sm:text-2xl dark:text-white">District Survey Report Portal</h1><p className="mt-0.5 text-xs text-slate-500">Department of Mines &amp; Geology</p></div>
          </Link>
          <div className="hidden items-center gap-4 lg:flex"><div className="border-r border-slate-200 pr-4 text-right dark:border-slate-700"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Technical Support</p><p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">IIT Ropar · SEnSRS</p></div><img src="/assets/sensrs-final-logo.webp" alt="SEnSRS" className="h-11 w-auto object-contain" /></div>
        </div>
      </header>

      <nav aria-label="Primary navigation" className="sticky top-0 z-30 border-b-[3px] border-[#e49b17] bg-[#123c6e] text-white shadow-sm">
        <div className="govt-container flex h-12 items-center justify-between">
          <button type="button" aria-label="Open menu" className="border-r border-white/20 px-3 py-2 md:hidden"><Menu size={20} /></button>
          <div className="hidden h-full items-stretch md:flex"><a href="#home" className="govt-nav is-active">Home</a><a href="#services" className="govt-nav">Services</a><a href="#notices" className="govt-nav">Notices</a><a href="#districts" className="govt-nav">Districts</a><a href="#contact" className="govt-nav">Contact Us</a></div>
          <Link to="/login" className="inline-flex items-center gap-2 bg-[#e9a319] px-4 py-2 text-xs font-extrabold text-[#102f55] transition hover:bg-[#f5b832]"><LockKeyhole size={15} /> Official Login</Link>
        </div>
      </nav>

      <main id="main-content">
        <section id="home" className="relative overflow-hidden border-b border-slate-300 bg-[#e8eef3] dark:border-slate-800 dark:bg-slate-900">
          <img src="/assets/sand_mining_scenery.png" alt="Survey landscape" className="absolute inset-y-0 right-0 hidden h-full w-[53%] object-cover lg:block" />
          <div className="absolute inset-y-0 right-0 hidden w-[60%] bg-gradient-to-r from-[#e8eef3] via-[#e8eef3]/74 to-transparent lg:block dark:from-slate-900" />
          <div className="govt-container relative grid min-h-[330px] items-center py-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-2xl border-l-4 border-[#e49b17] pl-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#8a4b08]">Departmental digital service</p><h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#123c6e] md:text-4xl dark:text-white">District Survey Reports for informed and responsible mineral governance</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">A secure system for preparing, reviewing and approving District Survey Reports across Punjab through defined workflows and departmental controls.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/login" className="govt-button-primary">Access the portal <ChevronRight size={16} /></Link><a href="#services" className="govt-button-secondary">View services</a></div></div>
          </div>
        </section>

        <section className="border-b border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="govt-container grid gap-0 lg:grid-cols-[1.45fr_.8fr]">
            <div id="notices" className="border-r border-slate-200 py-8 pr-0 lg:pr-8 dark:border-slate-800">
              <SectionBar title="What's New" icon={<Bell size={17} />} />
              <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {notices.map((notice, index) => <li key={`${notice.title}-${index}`}><a href="#notices" className="govt-notice-row"><span className="notice-date">{notice.date || "New"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{notice.title}</span><span className="mt-1 block text-[11px] text-slate-500">{notice.category || "General information"}</span></span><ChevronRight size={17} className="shrink-0 text-[#123c6e] dark:text-blue-300" /></a></li>)}
              </ul>
              <a href="#notices" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#123c6e] hover:underline dark:text-blue-300">View all notices <ChevronRight size={14} /></a>
            </div>
            <aside className="py-8 lg:pl-8"><SectionBar title="Important Links" /><div className="mt-2 border border-slate-200 dark:border-slate-700"><Link to="/login" className="important-link">Portal login <ChevronRight size={15} /></Link><a href="#services" className="important-link">DSR services <ChevronRight size={15} /></a><a href="#districts" className="important-link">District directory <ChevronRight size={15} /></a><a href="#contact" className="important-link">Helpdesk &amp; contact <ChevronRight size={15} /></a></div><div className="mt-5 border-l-4 border-[#e49b17] bg-[#fff9ed] px-4 py-3 text-xs leading-5 text-slate-600 dark:bg-amber-950/20 dark:text-slate-300"><strong className="text-[#123c6e] dark:text-amber-300">Notice:</strong> This portal is intended for authorised departmental users and designated stakeholders.</div></aside>
          </div>
        </section>

        <section id="services" className="bg-[#f5f5f5] py-10 dark:bg-slate-900">
          <div className="govt-container"><SectionBar title="Online Services" subtitle="Access services available through the District Survey Report Portal." /><div className="mt-4 grid border-l border-t border-slate-300 bg-white sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-950">
            {services.map((service) => <Link key={service.title} to={service.to} className="govt-service-row"><span className="govt-service-icon"><service.icon size={22} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#123c6e] dark:text-white">{service.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{service.text}</span></span><ChevronRight size={17} className="shrink-0 text-slate-400" /></Link>)}
          </div></div>
        </section>

        <section className="border-y border-slate-300 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
          <div className="govt-container grid gap-8 lg:grid-cols-[.78fr_1.22fr]"><div><SectionBar title="DSR workflow" subtitle="A defined process for preparation, scrutiny and approval." /><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">The portal maintains a clear progression from project initiation to final approval, with responsibility assigned at each stage.</p><Link to="/login" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#123c6e] hover:underline dark:text-blue-300">Go to workspace <ChevronRight size={14} /></Link></div><ol className="grid overflow-hidden border border-slate-300 sm:grid-cols-4 dark:border-slate-700">{[["01", "Initiate"], ["02", "Prepare"], ["03", "Review"], ["04", "Approve"]].map(([number, label], index) => <li key={number} className={`border-b border-slate-300 p-5 last:border-b-0 sm:border-b-0 ${index !== 3 ? "sm:border-r" : ""} dark:border-slate-700`}><span className="text-xs font-bold text-[#b36a0d]">{number}</span><span className="mt-3 block text-sm font-extrabold text-[#123c6e] dark:text-white">{label}</span></li>)}</ol></div>
        </section>

        <section id="districts" className="bg-[#f5f5f5] py-10 dark:bg-slate-900"><div className="govt-container"><div className="flex flex-wrap items-end justify-between gap-3"><SectionBar title="District Directory" subtitle="Districts covered under the Punjab DSR framework." /><span className="text-xs font-bold text-[#123c6e] dark:text-blue-300">23 Districts</span></div><div className="mt-4 grid border-l border-t border-slate-300 bg-white sm:grid-cols-3 lg:grid-cols-6 dark:border-slate-700 dark:bg-slate-950">{districts.map((district) => <div key={district} className="district-cell"><MapPinned size={13} className="text-[#b36a0d]" /> {district}</div>)}</div></div></section>
      </main>

      <footer id="contact" className="bg-[#082746] text-white"><div className="govt-container grid gap-10 py-10 md:grid-cols-[1.5fr_1fr_1fr]"><div><div className="flex items-center gap-3"><img src="/assets/Emblem_of_India.svg.png" alt="Emblem" className="h-12 brightness-0 invert" /><div><p className="text-sm font-extrabold">District Survey Report Portal</p><p className="mt-1 text-xs text-white/60">Department of Mines &amp; Geology, Government of Punjab</p></div></div><p className="mt-5 max-w-md text-xs leading-6 text-white/55">An official platform to support the preparation, review and management of District Survey Reports in Punjab.</p></div><div><h3 className="footer-heading">Useful Links</h3><div className="mt-4 grid gap-3 text-xs text-white/65"><a href="#services">Online Services</a><a href="#notices">Notices</a><a href="#districts">District Directory</a></div></div><div><h3 className="footer-heading">Contact</h3><div className="mt-4 grid gap-3 text-xs text-white/65"><span className="flex gap-2"><Mail size={14} /> coe@sensrs.com</span><a className="flex gap-2" href="https://www.iitrpr.ac.in/" target="_blank" rel="noreferrer"><ExternalLink size={14} /> IIT Ropar</a></div></div></div><div className="border-t border-white/10 bg-[#061d33]"><div className="govt-container flex flex-col justify-between gap-2 py-4 text-[11px] text-white/50 md:flex-row"><span>© 2026 Department of Mines &amp; Geology, Government of Punjab.</span><span>Technical support: IIT Ropar · SEnSRS</span></div></div></footer>
    </div>
  );
}

function SectionBar({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return <div className="border-b-2 border-[#123c6e] pb-2"><div className="flex items-center gap-2 text-[#123c6e] dark:text-blue-300">{icon}<h2 className="text-lg font-extrabold">{title}</h2></div>{subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}</div>;
}
