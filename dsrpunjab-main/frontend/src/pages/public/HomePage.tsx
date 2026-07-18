import {
  ArrowRight,
  Bell,
  BookOpenCheck,
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
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "../../api/settings.api";
import ThemeToggle from "../../components/ui/ThemeToggle";

type Announcement = { title: string; date?: string; category?: string; active?: boolean };

const districts = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
  "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
  "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar",
  "S.A.S. Nagar", "Sangrur", "S.B.S. Nagar", "Sri Muktsar Sahib", "Tarn Taran",
];

export default function HomePage() {
  const { data: announcementsSetting } = useQuery({
    queryKey: ["settings", "announcements"],
    queryFn: () => settingsApi.get("announcements"),
  });

  let announcements: Announcement[] = [];
  if (announcementsSetting?.value) {
    try {
      announcements = JSON.parse(announcementsSetting.value);
    } catch {
      announcements = [];
    }
  }
  const activeAnnouncements = announcements.filter((item) => item.active);
  const leadNotice = activeAnnouncements[0];

  return (
    <div className="public-portal min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="bg-[#0b315d] text-white">
        <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between gap-4 px-4 text-[11px] md:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <Landmark size={13} />
            <span>Government of Punjab</span>
            <span className="text-white/40">|</span>
            <span className="hidden sm:inline">ਪੰਜਾਬ ਸਰਕਾਰ</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#main-content" className="hidden hover:underline md:inline">Skip to Content</a>
            <span className="hidden text-white/30 md:inline">|</span>
            <span className="hidden font-bold sm:inline">A- &nbsp; A &nbsp; A+</span>
            <span className="text-white/30">|</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-4 py-5 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-4">
            <img src="/assets/Emblem_of_India.svg.png" alt="State Emblem of India" className="h-[68px] w-auto object-contain" />
            <div className="hidden h-14 w-px bg-slate-200 sm:block dark:bg-slate-700" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b45309]">Department of Mines &amp; Geology</p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#102f55] sm:text-2xl dark:text-white">District Survey Report Portal</h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Government of Punjab</p>
            </div>
          </Link>
          <div className="hidden items-center gap-5 lg:flex">
            <div className="border-r border-slate-200 pr-5 text-right dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Knowledge &amp; Technical Partner</p>
              <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">IIT Ropar · SEnSRS</p>
            </div>
            <img src="/assets/sensrs-final-logo.webp" alt="SEnSRS" className="h-12 w-auto object-contain" />
            <img src="/assets/dsr-logo.png" alt="Smart DSR" className="h-12 w-auto object-contain" />
          </div>
        </div>
      </header>

      <nav aria-label="Primary navigation" className="sticky top-0 z-30 border-b-4 border-[#e9a319] bg-[#123c6e] text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 md:px-8">
          <button type="button" aria-label="Open menu" className="rounded-sm border border-white/30 p-2 md:hidden"><Menu size={20} /></button>
          <div className="hidden h-full items-stretch md:flex">
            <a href="#home" className="public-nav-link is-active">Home</a>
            <a href="#services" className="public-nav-link">Services</a>
            <a href="#process" className="public-nav-link">DSR Process</a>
            <a href="#districts" className="public-nav-link">Districts</a>
            <a href="#notices" className="public-nav-link">Notices</a>
            <a href="#contact" className="public-nav-link">Contact</a>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-sm bg-[#e9a319] px-5 py-2.5 text-sm font-extrabold text-[#102f55] transition hover:bg-[#f4b833]">
            <LockKeyhole size={16} /> Official Login
          </Link>
        </div>
      </nav>

      <div className="border-b border-slate-200 bg-[#f8fafc] dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex min-h-11 max-w-[1440px] items-center px-4 md:px-8">
          <span className="flex self-stretch items-center gap-2 bg-[#b42318] px-4 text-xs font-bold text-white"><Bell size={14} /> Latest</span>
          <p className="min-w-0 flex-1 truncate px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
            {leadNotice?.title || "District Survey Report portal is available for authorised departmental users."}
          </p>
          <span className="hidden text-[11px] text-slate-500 sm:block">{leadNotice?.date || "Punjab"}</span>
        </div>
      </div>

      <main id="main-content">
        <section id="home" className="relative overflow-hidden bg-[#edf3f8] dark:bg-slate-950">
          <div className="absolute inset-y-0 right-0 hidden w-[54%] lg:block">
            <img src="/assets/sand_mining_scenery.png" alt="Riverbed survey landscape in Punjab" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#edf3f8] via-[#edf3f8]/25 to-transparent dark:from-slate-950" />
          </div>
          <div className="mx-auto grid min-h-[520px] max-w-[1440px] items-center px-4 py-16 md:px-8 lg:grid-cols-12">
            <div className="relative z-10 lg:col-span-7 xl:col-span-6">
              <span className="inline-flex items-center gap-2 border-l-4 border-[#e9a319] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[.13em] text-[#123c6e] shadow-sm dark:bg-slate-900 dark:text-blue-300">
                Digital Governance for Sustainable Mining
              </span>
              <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#102f55] md:text-5xl xl:text-[58px] dark:text-white">
                One trusted system for Punjab’s District Survey Reports
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg dark:text-slate-300">
                A unified departmental platform for structured preparation, technical review, approval and publication of district survey reports.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-sm bg-[#123c6e] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b315d]">
                  Access Department Workspace <ArrowRight size={17} />
                </Link>
                <a href="#services" className="inline-flex items-center gap-2 rounded-sm border border-[#123c6e] bg-white px-6 py-3.5 text-sm font-bold text-[#123c6e] transition hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-300">
                  Explore Services <ChevronRight size={17} />
                </a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-1 border border-slate-200 bg-white sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
                {["Standardised reporting", "Role-based review", "Traceable approvals"].map((item) => (
                  <div key={item} className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0 dark:border-slate-800 dark:text-slate-200">
                    <ShieldCheck size={16} className="text-emerald-600" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <SectionHeading eyebrow="Citizen & Department Services" title="Quick access" description="Frequently used services and information, organised for faster access." />
            <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: FileText, title: "Prepare a DSR", text: "Create and manage structured district survey report content.", link: "/login" },
                { icon: Workflow, title: "Review & Approval", text: "Track observations, submissions and approval stages.", link: "/login" },
                { icon: MapPinned, title: "District Coverage", text: "View Punjab districts covered by the reporting framework.", link: "#districts" },
                { icon: CircleHelp, title: "Help & Support", text: "Get guidance on portal access and report preparation.", link: "#contact" },
              ].map((service) => (
                <a key={service.title} href={service.link} className="service-tile group">
                  <span className="service-tile-icon"><service.icon size={24} /></span>
                  <span className="mt-5 text-lg font-extrabold text-[#102f55] dark:text-white">{service.title}</span>
                  <span className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{service.text}</span>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#123c6e] group-hover:gap-2 dark:text-blue-300">Open service <ArrowRight size={14} /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="bg-[#f4f7fa] py-16 dark:bg-slate-900">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-4 md:px-8 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <SectionHeading eyebrow="How it works" title="A clear, accountable DSR lifecycle" description="Every report moves through a defined departmental process with role-based responsibility and an auditable trail." />
              <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#123c6e] dark:text-blue-300">Go to workspace <ArrowRight size={16} /></Link>
            </div>
            <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-700">
              {[
                ["01", "Initiate", "Create the district project and assign authorised contributors."],
                ["02", "Prepare", "Complete chapters, annexures, maps and supporting datasets."],
                ["03", "Review", "Record observations and complete technical scrutiny."],
                ["04", "Approve", "Progress through the designated authority approval chain."],
              ].map(([number, title, text]) => (
                <div key={number} className="bg-white p-7 dark:bg-slate-950">
                  <span className="text-xs font-extrabold tracking-widest text-[#b45309]">STEP {number}</span>
                  <h3 className="mt-3 text-xl font-extrabold text-[#102f55] dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="notices" className="bg-white py-16 dark:bg-slate-950">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 md:px-8 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="flex items-end justify-between border-b-2 border-[#123c6e] pb-4">
                <div><p className="section-eyebrow">Updates</p><h2 className="section-title">Notices &amp; announcements</h2></div>
                <Bell className="text-[#123c6e]" size={24} />
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {(activeAnnouncements.length ? activeAnnouncements.slice(0, 4) : [{ title: "No new public notices are available at this time.", category: "Information", date: "—" }]).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex gap-4 py-5">
                    <div className="w-14 shrink-0 border-r border-slate-200 pr-4 text-center dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Notice</span>
                      <span className="mt-1 block text-lg font-extrabold text-[#123c6e] dark:text-blue-300">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.category || "General"} · {item.date || "Recent"}</p>
                    </div>
                    <ChevronRight size={17} className="mt-1 shrink-0 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t-4 border-[#e9a319] bg-[#123c6e] p-8 text-white">
              <BookOpenCheck size={32} className="text-[#f4b833]" />
              <h2 className="mt-5 text-2xl font-extrabold">About District Survey Reports</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">The portal supports consistent preparation and departmental scrutiny of district-level survey information for minor mineral planning and governance.</p>
              <div className="mt-7 border-t border-white/15 pt-6 text-xs leading-6 text-white/65">Authorised users should use their assigned departmental credentials. Activity within the system may be recorded for security and audit purposes.</div>
            </aside>
          </div>
        </section>

        <section id="districts" className="border-y border-slate-200 bg-[#f4f7fa] py-14 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <SectionHeading eyebrow="Statewide Coverage" title="Districts of Punjab" description="District-wise access to survey report projects and records." />
              <span className="text-sm font-bold text-[#123c6e] dark:text-blue-300">23 districts</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-6 dark:border-slate-700 dark:bg-slate-700">
              {districts.map((district) => <div key={district} className="flex items-center gap-2 bg-white px-4 py-3.5 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200"><MapPinned size={13} className="text-[#b45309]" />{district}</div>)}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-[#092746] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div>
            <div className="flex items-center gap-4"><img src="/assets/Emblem_of_India.svg.png" alt="Emblem" className="h-14 brightness-0 invert" /><div><p className="font-extrabold">District Survey Report Portal</p><p className="mt-1 text-xs text-white/60">Department of Mines &amp; Geology · Government of Punjab</p></div></div>
            <p className="mt-5 max-w-lg text-xs leading-6 text-white/60">This portal is intended to facilitate official preparation, review and management of District Survey Reports in Punjab.</p>
          </div>
          <div>
            <h3 className="footer-heading">Important Links</h3>
            <div className="mt-4 grid gap-3 text-xs text-white/65"><a href="#services">Portal Services</a><a href="#process">DSR Process</a><a href="#notices">Notices</a><a href="#districts">District Coverage</a></div>
          </div>
          <div>
            <h3 className="footer-heading">Helpdesk</h3>
            <div className="mt-4 space-y-3 text-xs text-white/65"><p className="flex gap-2"><Mail size={14} /> coe@sensrs.com</p><p className="flex gap-2"><CircleHelp size={14} /> Portal support and access assistance</p><a className="flex gap-2" href="https://www.iitrpr.ac.in/" target="_blank" rel="noreferrer"><ExternalLink size={14} /> IIT Ropar</a></div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#061e36]">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-4 text-[11px] text-white/50 md:flex-row md:px-8">
            <p>© 2026 Department of Mines &amp; Geology, Government of Punjab.</p>
            <p>Designed and developed with technical support from IIT Ropar · SEnSRS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-2xl"><p className="section-eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></div>;
}
