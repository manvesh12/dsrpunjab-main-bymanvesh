import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  Landmark,
  LockKeyhole,
  Mail,
  MapPinned,
  ShieldCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import { settingsApi } from "../../api/settings.api";
import PublicSiteFooter from "../../components/public/PublicSiteFooter";
import PublicSiteHeader from "../../components/public/PublicSiteHeader";

type Announcement = {
  title: string;
  date?: string;
  category?: string;
  active?: boolean;
};

const fallbackNotices: Announcement[] = [
  { title: "District Survey Report portal is available for authorised departmental users.", category: "Portal update", date: "Current" },
  { title: "Rupnagar district workspace is enabled for structured DSR preparation and review.", category: "District update", date: "Current" },
  { title: "Users should keep their assigned login credentials confidential.", category: "Security advisory", date: "Advisory" },
  { title: "For access or workflow assistance, contact the portal helpdesk.", category: "Helpdesk", date: "Support" },
];

const services = [
  { icon: FileText, title: "DSR Project Workspace", text: "Create and maintain chapter-wise District Survey Report content.", href: "/login", action: "Open workspace" },
  { icon: Workflow, title: "Review & Approval", text: "Submit reports, record observations and complete authority-level review.", href: "/login", action: "Continue to login" },
  { icon: FolderOpen, title: "Report Library", text: "Access approved reports and role-specific project records.", href: "/login", action: "View reports" },
  { icon: MapPinned, title: "District Directory", text: "View district coverage and the active DSR reporting workspace.", href: "#districts", action: "View district" },
  { icon: ShieldCheck, title: "Audit & Accountability", text: "Maintain traceable actions across preparation, review and approval.", href: "/login", action: "Access records" },
  { icon: CircleHelp, title: "Portal Helpdesk", text: "Get assistance with portal access, projects and report preparation.", href: "mailto:coe@sensrs.com", action: "Email support" },
];

const workflowSteps = [
  { number: "1", title: "Initiate", label: "Create District\nProject", image: "/assets/sand_mining_scenery.png", position: "56% center" },
  { number: "2", title: "Prepare", label: "Prepare Report\nContent", image: "/assets/punjab-reference-map.png", position: "58% center" },
  { number: "3", title: "Review", label: "Review and\nResolve", image: "/assets/esa-trees.png", position: "center" },
  { number: "4", title: "Approve", label: "Approve\nFinal DSR", image: "/assets/dsr-logo.png", position: "center" },
];

export default function HomePage() {
  const [showAllNotices, setShowAllNotices] = useState(false);
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

  const configuredNotices = announcements.filter((item) => item.active && item.title?.trim());
  const notices = configuredNotices.length ? configuredNotices : fallbackNotices;
  const visibleNotices = showAllNotices ? notices : notices.slice(0, 4);

  return (
    <div className="public-portal min-h-screen bg-[#f4f6f8] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <PublicSiteHeader />

      <main id="main-content">
        <section id="home" className="relative isolate overflow-hidden bg-[#e7edf2] dark:bg-slate-900">
          <img src="/assets/sand_mining_scenery.png" alt="Riverbed survey and mineral management landscape" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf0f4] via-[#eaf0f4]/95 to-[#eaf0f4]/30 dark:from-slate-950 dark:via-slate-950/92 dark:to-slate-950/40" />
          <div className="govt-container relative grid min-h-[470px] items-center py-12 lg:grid-cols-[1.08fr_.92fr]">
            <div className="max-w-2xl border-l-4 border-[#e49b17] bg-white/88 p-6 shadow-[0_14px_40px_rgba(9,40,67,.13)] backdrop-blur-sm sm:p-8 dark:bg-slate-950/85">
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#995808]">Official digital service · Government of Punjab</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#103b67] sm:text-4xl lg:text-[2.8rem] dark:text-white">District Survey Reports for responsible mineral governance</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">A secure, role-based platform for preparing, reviewing and approving District Survey Reports through a clear and accountable departmental workflow.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/login" className="govt-button-primary">Access the portal <ArrowRight size={16} /></Link>
                <a href="#services" className="govt-button-secondary">Explore online services <ChevronRight size={16} /></a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#0b6685]" /> Role-based access</span>
                <span className="inline-flex items-center gap-2"><Workflow size={16} className="text-[#0b6685]" /> Traceable workflow</span>
                <span className="inline-flex items-center gap-2"><FileCheck2 size={16} className="text-[#0b6685]" /> Standardised reports</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Important portal links" className="bg-[#082f4c] text-white">
          <div className="govt-container grid sm:grid-cols-2 lg:grid-cols-4">
            <a href="#notices" className="portal-alert-link"><span className="portal-alert-badge">NEW</span><span>Portal Notices</span><ChevronRight size={15} /></a>
            <a href="#workflow" className="portal-alert-link"><span className="portal-alert-badge">4</span><span>Workflow Stages</span><ChevronRight size={15} /></a>
            <a href="#districts" className="portal-alert-link"><MapPinned size={16} /><span>Rupnagar District</span><ChevronRight size={15} /></a>
            <a href="mailto:coe@sensrs.com" className="portal-alert-link"><Mail size={16} /><span>Portal Helpdesk</span><ChevronRight size={15} /></a>
          </div>
        </section>

        <section id="about" className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
          <div className="govt-container grid gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <article>
              <SectionHeading eyebrow="About the portal" title="Welcome to the Punjab District Survey Report Portal" />
              <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">The portal supports the Department of Mines &amp; Geology in the structured preparation and management of District Survey Reports. It brings project data, supporting documents and review actions into one controlled workspace.</p>
              <div id="about-objectives" className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Consistent district-wise report preparation"],
                  ["02", "Defined responsibility at every stage"],
                  ["03", "Transparent review and approval history"],
                ].map(([number, text]) => (
                  <div key={number} className="border border-slate-200 bg-[#f8fafb] p-4 dark:border-slate-700 dark:bg-slate-900">
                    <span className="text-xs font-extrabold text-[#a25e09]">{number}</span>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#123c6e] dark:text-slate-100">{text}</p>
                  </div>
                ))}
              </div>
              <a href="#workflow" className="mt-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">See how the process works <ChevronRight size={14} /></a>
            </article>

            <aside id="notices" aria-labelledby="notices-heading" className="border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,47,85,.1)] dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 bg-[#5e849c] px-5 py-4 text-white">
                <Bell size={18} />
                <h2 id="notices-heading" className="text-lg font-extrabold">What&apos;s New</h2>
              </div>
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {visibleNotices.map((notice, index) => (
                  <li key={`${notice.title}-${index}`} className="flex gap-3 px-5 py-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e49b17]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200">{notice.title}</span>
                      <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">{notice.date || "New"} · {notice.category || "Information"}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {notices.length > 4 && (
                <button type="button" onClick={() => setShowAllNotices((show) => !show)} className="flex w-full items-center justify-center gap-1.5 border-t border-slate-200 px-4 py-3 text-xs font-extrabold text-[#123c6e] hover:bg-slate-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800">
                  {showAllNotices ? "Show latest notices" : "View all notices"} <ChevronRight size={14} className={showAllNotices ? "rotate-90" : ""} />
                </button>
              )}
            </aside>
          </div>
        </section>

        <section id="workflow" className="how-it-works-section bg-[#073b5b] py-16 text-white">
          <div className="govt-container">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold sm:text-5xl">How It Works</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-xl">Prepare, review and approve District Survey Reports on this portal</p>
              <span className="mx-auto mt-6 block h-1 w-[74px] bg-[#e78c25]" />
            </div>
            <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {workflowSteps.map((step) => (
                <li id={`workflow-${step.title.toLowerCase()}`} key={step.number} className="scroll-mt-20 text-center">
                  <div className="how-step-image-wrap">
                    <img src={step.image} alt={`${step.title} DSR workflow`} className="how-step-image" style={{ objectPosition: step.position }} />
                    <span className="how-step-number">{step.number}</span>
                  </div>
                  <h3 className="mt-7 whitespace-pre-line text-2xl font-normal leading-tight">{step.label}</h3>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="services" className="bg-[#f4f6f8] py-12 dark:bg-slate-900">
          <div className="govt-container">
            <SectionHeading eyebrow="Digital services" title="Online Services" subtitle="Use the portal for authorised DSR preparation, review and reporting activities." />
            <div className="mt-7 grid border-l border-t border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-700 dark:bg-slate-950">
              {services.map((service) => {
                const content = <><span className="govt-service-icon"><service.icon size={23} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#123c6e] dark:text-white">{service.title}</span><span className="mt-1.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{service.text}</span><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#9a5708] dark:text-amber-300">{service.action} <ChevronRight size={13} /></span></span></>;
                return service.href.startsWith("/") ? <Link key={service.title} to={service.href} className="govt-service-row items-start">{content}</Link> : <a key={service.title} href={service.href} className="govt-service-row items-start">{content}</a>;
              })}
            </div>
          </div>
        </section>

        <section id="districts" className="border-y border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
          <div className="govt-container grid gap-9 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <SectionHeading eyebrow="Coverage" title="District Directory" subtitle="District currently covered by this DSR portal." />
              <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">The system currently supports the Rupnagar district workspace, including controlled project preparation, technical review and final reporting.</p>
              <Link to="/login" className="govt-button-primary mt-6">Access district workspace <ArrowRight size={16} /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-[1.05fr_.95fr]">
              <div className="relative overflow-hidden border border-slate-200 bg-[#edf3f7] p-6 dark:border-slate-700 dark:bg-slate-900">
                <MapPinned size={30} className="text-[#0b6685]" />
                <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#a25e09]">Active district</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#123c6e] dark:text-white">Rupnagar</h3>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">District Survey Report project and departmental workflow coverage.</p>
              </div>
              <div className="grid grid-cols-2 border-l border-t border-slate-200 dark:border-slate-700">
                {[["1", "District"], ["4", "Workflow stages"], ["24×7", "Portal access"], ["100%", "Role controlled"]].map(([value, label]) => (
                  <div key={label} className="border-b border-r border-slate-200 p-5 dark:border-slate-700">
                    <strong className="block text-xl text-[#123c6e] dark:text-white">{value}</strong>
                    <span className="mt-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f6f8] py-12 dark:bg-slate-900">
          <div className="govt-container">
            <SectionHeading eyebrow="Trusted sources" title="Important Official Links" subtitle="Continue to verified government and institutional websites." />
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                { icon: Landmark, title: "Government of Punjab", text: "Official Punjab Government portal", href: "https://punjab.gov.in/" },
                { icon: Building2, title: "Mines & Geology Department", text: "Mineral sale and monitoring portal", href: "https://minesandgeology.punjab.gov.in/" },
                { icon: UsersRound, title: "Indian Institute of Technology Ropar", text: "Knowledge and technical partner", href: "https://www.iitrpr.ac.in/" },
              ].map((item) => (
                <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="group flex items-center gap-4 border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#8aa8be] hover:shadow-md dark:border-slate-700 dark:bg-slate-950">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#eaf0f5] text-[#123c6e] dark:bg-slate-800 dark:text-blue-300"><item.icon size={22} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#123c6e] dark:text-white">{item.title}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.text}</span></span>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-[#123c6e]" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
          <div className="govt-container flex flex-col items-start justify-between gap-6 border-l-4 border-[#e49b17] bg-[#eaf0f5] p-6 md:flex-row md:items-center dark:bg-slate-900">
            <div><p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#995808]">Authorised departmental users</p><h2 className="mt-2 text-xl font-extrabold text-[#123c6e] dark:text-white">Ready to continue your District Survey Report work?</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in with your assigned portal credentials or contact support if you need access assistance.</p></div>
            <div className="flex shrink-0 flex-wrap gap-3"><a href="mailto:coe@sensrs.com" className="govt-button-secondary">Contact support <Mail size={15} /></a><Link to="/login" className="govt-button-primary">Official login <LockKeyhole size={15} /></Link></div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#a25e09]">{eyebrow}</p>}
      <div className="mt-2 flex items-center gap-3"><span className="h-7 w-1 bg-[#e49b17]" /><h2 className="text-2xl font-extrabold text-[#123c6e] dark:text-white">{title}</h2></div>
      {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}
