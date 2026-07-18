import { ArrowRight, FileText, LifeBuoy, Map, Search, Bell, MapPin, Mail, Phone, Shield, ChevronRight, CheckCircle, Star, TrendingUp, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "../../api/settings.api";
import ThemeToggle from "../../components/ui/ThemeToggle";

export default function HomePage() {
  const { data: announcementsSetting } = useQuery({
    queryKey: ["settings", "announcements"],
    queryFn: () => settingsApi.get("announcements"),
  });

  let announcements: any[] = [];
  if (announcementsSetting?.value) {
    try {
      announcements = JSON.parse(announcementsSetting.value);
    } catch (e) {
      console.error("Failed to parse announcements", e);
    }
  }

  const activeAnnouncements = announcements.filter((a) => a.active);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors">
      {/* Pre-header */}
      <div className="bg-[#1a3a6b] text-white px-4 py-2 flex justify-between items-center text-xs font-semibold z-50 relative">
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">भारत सरकार</span>
          <span className="text-white/60">|</span>
          <span>Government of Punjab</span>
        </div>
        <div className="hidden md:flex items-center gap-5">
          <a href="#main-content" className="hover:text-amber-300 transition-colors">Skip to Main Content</a>
          <span className="text-white/40">|</span>
          <a href="#" className="hover:text-amber-300 transition-colors">Sitemap</a>
          <span className="text-white/40">|</span>
          <div className="flex gap-2 font-bold">
            <button className="hover:text-amber-300 transition-colors">A+</button>
            <button className="hover:text-amber-300 transition-colors">A</button>
            <button className="hover:text-amber-300 transition-colors text-xs">A-</button>
          </div>
          <span className="text-white/40">|</span>
          <span className="text-amber-300 font-bold">English</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-900 py-5 px-4 md:px-8 border-b-4 border-[#1a3a6b] z-40 relative shadow-lg transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src="/assets/Emblem_of_India.svg.png"
                alt="Punjab Emblem"
                className="h-20 w-auto object-contain drop-shadow-md"
              />
            </div>
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent hidden md:block"></div>
            <div>
              <div className="text-[10px] font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-[0.3em] mb-1">
                Government of Punjab · Department of Mining & Geology
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                District Survey Report Portal
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-8 h-0.5 bg-amber-500 block"></span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Smart DSR Management System</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="hidden lg:block">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Technical Partner</div>
              <div className="font-black text-slate-900 dark:text-white text-sm">IIT Ropar · SEnSRS</div>
              <div className="text-xs text-slate-500 mt-0.5">EMGSM 2020</div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <img src="/assets/sensrs-final-logo.webp" alt="IIT Ropar" className="h-14 w-auto object-contain" />
              <img src="/assets/dsr-logo.png" alt="Smart DSR" className="h-12 object-contain dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
            </div>
          </div>
        </div>
      </header>

      {/* Navbar */}
      <nav className="bg-[#1a3a6b] sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex justify-between items-center">
          <ul className="flex items-center gap-1 h-full">
            {[
              { label: "Home", href: "#" },
              { label: "About DSR", href: "#about" },
              { label: "Services", href: "#services" },
              { label: "District Reports", href: "#reports" },
              { label: "Helpdesk", href: "#helpdesk" },
            ].map((item, i) => (
              <li key={i} className="h-full flex items-center">
                <a
                  href={item.href}
                  className={`px-4 py-2 text-sm font-bold transition-all rounded-sm whitespace-nowrap ${
                    i === 0
                      ? "text-amber-400 border-b-2 border-amber-400"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="bg-amber-500 hover:bg-amber-400 text-[#1a3a6b] px-6 py-2 rounded-lg font-black text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all hidden md:flex items-center gap-2"
            >
              <Shield size={15} />
              Official Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Login */}
      <Link to="/login" className="md:hidden flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-[#1a3a6b] py-3 font-black text-sm sticky top-14 z-20 shadow-sm">
        <Shield size={15} /> Official Login
      </Link>

      <main id="main-content">
        {/* ===== HERO SECTION ===== */}
        <section className="relative overflow-hidden bg-slate-950">
          <img
            src="/assets/sand_mining_scenery.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-[#0f2455]/90 to-[#1a3a6b]/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/35"></div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px] opacity-20"></div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left - Hero Text */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest w-fit">
                  <Star size={12} className="fill-amber-400" />
                  Digital Public Service Platform · Punjab
                </div>

                <h2 className="text-4xl md:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
                  District Survey{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                    Reports
                  </span>
                  <br />
                  <span className="text-white/60 font-normal text-3xl md:text-4xl xl:text-5xl">
                    for a Transparent Punjab
                  </span>
                </h2>

                <p className="text-lg text-white/70 max-w-xl leading-relaxed font-medium">
                  Access, prepare and monitor District Survey Reports through a unified, secure portal for the Department of Mining and Geology, Government of Punjab.
                </p>

                <div className="flex flex-wrap gap-3 mt-2">
                  {["Sand Mining Reports", "E-Signatures", "Role-based Access", "Real-time Validation"].map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">
                      <CheckCircle size={11} className="text-emerald-400" /> {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Link
                    to="/login"
                    className="group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#1a3a6b] px-8 py-4 rounded-xl font-black text-base shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-3"
                  >
                    <Shield size={20} />
                    Access DSR Portal
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a
                    href="#reports"
                    className="group bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                  >
                    <FileText size={20} />
                    View Public Reports
                  </a>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6 mt-4 pt-6 border-t border-white/10">
                  {[
                    { val: "22+", label: "Districts Covered" },
                    { val: "500+", label: "Reports Generated" },
                    { val: "5-Level", label: "E-Signature Chain" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-2xl font-black text-amber-400">{s.val}</span>
                      <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Notice Board */}
              <div className="lg:col-span-5 relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-amber-400/10 rounded-3xl blur-2xl"></div>

                <div className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Notice header */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Bell size={18} className="text-white animate-[pulse_2s_ease-in-out_infinite]" />
                      </div>
                      <div>
                        <span className="text-[#1a3a6b] font-black text-sm uppercase tracking-wider">Notice Board</span>
                        <p className="text-[#1a3a6b]/70 text-[10px] font-bold">Official Announcements</p>
                      </div>
                    </div>
                    <span className="bg-[#1a3a6b] text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </div>

                  <div className="h-[340px] overflow-hidden relative bg-slate-900/60">
                    <div className="absolute inset-0 flex flex-col hover:[animation-play-state:paused] animate-[marquee-vertical_22s_linear_infinite] px-6">
                      {activeAnnouncements.length === 0 ? (
                        <div className="py-8 text-center text-white/50 text-sm">No notices at the moment.</div>
                      ) : (
                        [...activeAnnouncements, ...activeAnnouncements].map((ann, idx) => (
                          <div key={idx} className="py-5 border-b border-white/10 last:border-0 flex gap-3 items-start">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              ann.category === 'Maintenance' ? 'bg-red-400' :
                              ann.category === 'Information' ? 'bg-amber-400' :
                              'bg-blue-400'
                            }`}></div>
                            <div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1.5 inline-block ${
                                ann.category === 'Maintenance' ? 'text-red-400 bg-red-400/15' :
                                ann.category === 'Information' ? 'text-amber-400 bg-amber-400/15' :
                                'text-blue-400 bg-blue-400/15'
                              }`}>
                                {ann.category}
                              </span>
                              <p className="font-bold text-white text-sm leading-snug hover:text-amber-400 cursor-pointer transition-colors">
                                {ann.title}
                              </p>
                              <p className="text-xs text-white/40 mt-1 font-medium">{ann.date}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border-t border-white/10 p-4 text-center">
                    <a href="#" className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                      View All Notices <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 text-white dark:text-slate-950" preserveAspectRatio="none">
              <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="currentColor" />
            </svg>
          </div>
        </section>

        {/* ===== ANNOUNCEMENTS ===== */}
        {activeAnnouncements.length > 0 && (
          <section className="bg-white dark:bg-slate-950 py-16 px-4 md:px-8 transition-colors" id="about">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-0.5 bg-[#1a3a6b]"></div>
                    <span className="text-xs font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-widest">Latest Updates</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                    Public Notices & Announcements
                  </h2>
                </div>
                <a href="#" className="hidden md:flex items-center gap-2 text-sm font-bold text-[#1a3a6b] dark:text-blue-400 hover:gap-3 transition-all">
                  View All <ArrowRight size={16} />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAnnouncements.map((ann, idx) => (
                  <div
                    key={idx}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-2xl hover:border-[#1a3a6b]/30 dark:hover:border-blue-500/30 transition-all hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {ann.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{ann.date}</span>
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-base leading-snug mb-3 group-hover:text-[#1a3a6b] dark:group-hover:text-blue-400 transition-colors">
                      {ann.title}
                    </h3>
                    <a href="#" className="text-xs font-bold text-[#1a3a6b] dark:text-blue-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read Details <ArrowRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== SERVICES GRID ===== */}
        <section id="services" className="py-20 bg-slate-50 dark:bg-slate-900 px-4 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-0.5 bg-[#1a3a6b] dark:bg-blue-400"></div>
                <span className="text-xs font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-widest">Core Offerings</span>
                <div className="w-8 h-0.5 bg-[#1a3a6b] dark:bg-blue-400"></div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Portal Services</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                A comprehensive digital platform to manage the complete lifecycle of District Survey Reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  title: "Create DSR",
                  desc: "Start or continue a district survey report with structured workflows.",
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                  border: "border-blue-200 dark:border-blue-800",
                  shadow: "hover:shadow-blue-500/10",
                },
                {
                  icon: Map,
                  title: "View Reports",
                  desc: "Browse district-wise published report records.",
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                  border: "border-emerald-200 dark:border-emerald-800",
                  shadow: "hover:shadow-emerald-500/10",
                },
                {
                  icon: Search,
                  title: "Guidelines",
                  desc: "Check official formats, instructions and compliance templates.",
                  color: "text-purple-600 dark:text-purple-400",
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                  border: "border-purple-200 dark:border-purple-800",
                  shadow: "hover:shadow-purple-500/10",
                },
                {
                  icon: LifeBuoy,
                  title: "Support",
                  desc: "Raise a portal support request. Our team responds in 24 hours.",
                  color: "text-amber-600 dark:text-amber-400",
                  bg: "bg-amber-50 dark:bg-amber-900/20",
                  border: "border-amber-200 dark:border-amber-800",
                  shadow: "hover:shadow-amber-500/10",
                },
              ].map((svc, i) => (
                <div
                  key={i}
                  className={`group bg-white dark:bg-slate-900 border-2 ${svc.border} p-8 rounded-3xl hover:shadow-2xl ${svc.shadow} transition-all duration-300 cursor-pointer hover:-translate-y-2`}
                >
                  <div className={`w-14 h-14 ${svc.bg} ${svc.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                    <svc.icon size={28} />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xl mb-3">{svc.title}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{svc.desc}</p>
                  <div className={`mt-5 flex items-center gap-1.5 text-xs font-bold ${svc.color} group-hover:gap-3 transition-all`}>
                    Learn More <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ABOUT / WHY SECTION ===== */}
        <section id="about" className="py-20 bg-white dark:bg-slate-950 px-4 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-0.5 bg-[#1a3a6b] dark:bg-blue-400"></div>
                  <span className="text-xs font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-widest">About the Portal</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                  India's first fully digital DSR management platform
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">
                  Developed by IIT Ropar's SEnSRS Research Cell in collaboration with the Department of Mining & Geology, this platform digitizes the entire District Survey Report workflow — from data entry to sequential e-signing — for Punjab's sand mining governance.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: TrendingUp, title: "Real-time Analytics", desc: "Live dashboards and progress tracking" },
                    { icon: Shield, title: "Secure E-Signatures", desc: "5-level authority verification chain" },
                    { icon: Users, title: "Multi-role Access", desc: "Coordinators, reviewers & authorities" },
                    { icon: Award, title: "Compliance Ready", desc: "Fully EMGSM 2020 compliant reports" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer">
                      <div className="w-10 h-10 bg-[#1a3a6b]/10 dark:bg-blue-900/30 text-[#1a3a6b] dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                {/* Large decorative card */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a6b]/5 to-amber-500/5 rounded-3xl"></div>
                <div className="relative bg-gradient-to-br from-[#1a3a6b] to-[#0d1f45] rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <img src="/assets/dsr-logo.png" alt="DSR" className="h-10 object-contain brightness-0 invert" />
                      <div>
                        <div className="font-black text-sm">Smart DSR Portal</div>
                        <div className="text-white/50 text-xs">Government of Punjab</div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black mb-6 leading-tight">
                      The Complete{" "}
                      <span className="text-amber-400">DSR Workflow</span>{" "}
                      in One Platform
                    </h3>

                    <div className="space-y-3">
                      {[
                        "Project initialization & district setup",
                        "Chapter-wise data entry & plate uploads",
                        "Automated graph & annexure generation",
                        "Professional PDF report generation",
                        "Sequential 5-level e-signature workflow",
                        "Final published DSR with audit trail",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[9px] font-black text-[#1a3a6b]">{i + 1}</span>
                          </div>
                          <span className="text-white/80 text-sm font-medium">{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <Link to="/login" className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-[#1a3a6b] px-6 py-3.5 rounded-xl font-black text-sm shadow-lg shadow-amber-500/30 transition-all group">
                        Get Started Now
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== DISTRICTS STRIP ===== */}
        <section id="reports" className="py-14 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 px-4 md:px-8 overflow-hidden transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-widest">Coverage</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">Districts of Punjab</h2>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur",
                "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa",
                "Moga", "Mohali", "Muktsar", "Nawanshahr", "Pathankot", "Patiala",
                "Rupnagar", "Sangrur", "Tarn Taran", "Barnala"
              ].map((district, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1a3a6b] dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-[#1a3a6b] dark:hover:text-blue-400 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <MapPin size={10} />
                  {district}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section id="helpdesk" className="py-20 bg-gradient-to-br from-[#0f2455] via-[#1a3a6b] to-[#0d1f45] px-4 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Star size={12} className="fill-amber-400" /> Ready to Get Started?
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Streamline your DSR workflow today
            </h2>
            <p className="text-white/60 text-lg font-medium mb-10 max-w-2xl mx-auto">
              Join officials from across Punjab already using the Smart DSR Portal to prepare and manage district survey reports efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="group bg-amber-500 hover:bg-amber-400 text-[#1a3a6b] px-10 py-4 rounded-xl font-black text-base shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-3">
                <Shield size={20} />
                Login to Portal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="mailto:coe@sensrs.com" className="bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white px-10 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                <Mail size={20} /> Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0d1f45] text-white" id="footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 py-16 px-4 md:px-8">
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img alt="IIT Ropar" className="h-12 w-auto object-contain brightness-200" src="/assets/sensrs-final-logo.webp" />
              <img alt="Punjab Emblem" className="h-12 w-auto object-contain brightness-200" src="/assets/state-emblem.png" />
            </div>
            <div>
              <h3 className="text-base font-black text-white mb-2">District Survey Report Portal</h3>
              <p className="text-sm text-white/50 font-medium leading-relaxed">
                A digital platform by the Department of Mining and Geology, Government of Punjab, with technical support from IIT Ropar.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: "Fb", href: "https://www.facebook.com/coesensrs/" },
                { label: "Ig", href: "https://www.instagram.com/coesensrs/" },
                { label: "In", href: "https://www.linkedin.com/company/coesensrs/" },
                { label: "X", href: "https://x.com/coesensrs" },
                { label: "Yt", href: "https://youtube.com/@coe.sensrs" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-amber-500 text-white hover:text-[#1a3a6b] flex items-center justify-center transition-all font-black text-[10px]">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Institute Links */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5">Institute Links</h4>
            <ul className="flex flex-col gap-3 text-sm font-medium text-white/50">
              {[
                { label: "IIT Ropar", href: "https://www.iitrpr.ac.in/" },
                { label: "Guest House", href: "https://www.iitrpr.ac.in/guest-house" },
                { label: "Medical Center", href: "https://iitrpr.ac.in/medical-center/" },
                { label: "Download Forms", href: "https://www.iitrpr.ac.in/RnD/download-form.php" },
                { label: "List of Holidays", href: "https://www.iitrpr.ac.in/list-holidays" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                    <ChevronRight size={12} className="text-amber-500/50" /> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5">Quick Links</h4>
            <ul className="flex flex-col gap-3 text-sm font-medium text-white/50">
              {[
                { label: "Publications", href: "https://sensrs.com/publications/" },
                { label: "Careers", href: "https://sensrs.com/opportunities/" },
                { label: "Events", href: "https://sensrs.com/events/" },
                { label: "Gallery", href: "https://sensrs.com/gallery/" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                    <ChevronRight size={12} className="text-amber-500/50" /> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-5">Contact Us</h4>
            <ul className="flex flex-col gap-4 text-sm font-medium text-white/50">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <a href="https://www.google.com/maps/search/?api=1&query=IIT+Ropar+Punjab" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors leading-snug">
                  Indian Institute of Technology Ropar,<br />Punjab, India
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-amber-500 shrink-0" />
                <a href="mailto:coe@sensrs.com" className="hover:text-amber-400 transition-colors">coe@sensrs.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-amber-500 shrink-0" />
                <a href="tel:+01881-232632" className="hover:text-amber-400 transition-colors">+01881-232632</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-white/10 py-5 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-white/30 font-medium text-center">
            <p>© 2026 Department of Mines & Geology, Government of Punjab. All rights reserved.</p>
            <p>Technical Support, Design & Development by <span className="text-amber-400/60">IIT Ropar · SEnSRS</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
