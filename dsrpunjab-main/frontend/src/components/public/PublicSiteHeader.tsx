import { ChevronDown, ExternalLink, Headphones, Landmark, Mail, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import WebsiteLanguageSelector from "../ui/WebsiteLanguageSelector";

type PublicSiteHeaderProps = {
  loginActive?: boolean;
};

type NavChild = {
  label: string;
  href: string;
  description: string;
  external?: boolean;
};

type NavItem = {
  label: string;
  href?: string;
  children?: NavChild[];
};

const navigation: NavItem[] = [
  { label: "Home", href: "/#home" },
  {
    label: "About Portal",
    children: [
      { label: "Portal Overview", description: "Purpose and scope of the DSR Portal", href: "/#about" },
      { label: "Portal Objectives", description: "Key governance and reporting objectives", href: "/#about-objectives" },
      { label: "Mines & Geology Department", description: "Visit the official departmental website", href: "https://minesandgeology.punjab.gov.in/", external: true },
    ],
  },
  {
    label: "Online Services",
    children: [
      { label: "All Online Services", description: "View services available on this portal", href: "/#services" },
      { label: "DSR Project Workspace", description: "Prepare chapters, annexures and evidence", href: "/login" },
      { label: "Review & Approval", description: "Continue role-based review activities", href: "/login" },
      { label: "Report Library", description: "Access authorised project records", href: "/login" },
    ],
  },
  {
    label: "Workflow",
    children: [
      { label: "Workflow Overview", description: "See the complete DSR lifecycle", href: "/#workflow" },
      { label: "1. Initiate", description: "Create a district project", href: "/#workflow-initiate" },
      { label: "2. Prepare", description: "Complete report content", href: "/#workflow-prepare" },
      { label: "3. Review", description: "Resolve technical observations", href: "/#workflow-review" },
      { label: "4. Approve", description: "Verify and finalise the report", href: "/#workflow-approve" },
    ],
  },
  {
    label: "District",
    children: [
      { label: "Rupnagar Overview", description: "View current district coverage", href: "/#districts" },
      { label: "District Workspace", description: "Open the authorised district workspace", href: "/login" },
      { label: "District Support", description: "Contact the portal helpdesk", href: "mailto:coe@sensrs.com" },
    ],
  },
  {
    label: "Important Links",
    children: [
      { label: "Government of Punjab", description: "Official state government portal", href: "https://punjab.gov.in/", external: true },
      { label: "Mines & Geology", description: "Mineral management and monitoring system", href: "https://minesandgeology.punjab.gov.in/", external: true },
      { label: "IIT Ropar", description: "Knowledge and technical partner", href: "https://www.iitrpr.ac.in/", external: true },
    ],
  },
  { label: "Contact Us", href: "/#contact" },
];

export default function PublicSiteHeader({ loginActive = false }: PublicSiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setOpenDropdown(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMobileDropdown(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeMenus = () => {
    setOpenDropdown(null);
    setMobileDropdown(null);
    setMenuOpen(false);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="govt-topbar">
        <div className="govt-container flex min-h-10 items-center justify-between gap-4 py-1.5 text-[11px]">
          <span className="flex items-center gap-2 font-semibold">
            <Landmark size={13} aria-hidden="true" />
            Government of Punjab <span className="hidden opacity-40 sm:inline">|</span>
            <span className="hidden sm:inline">ਪੰਜਾਬ ਸਰਕਾਰ</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="tel:18001802422" className="hidden items-center gap-1.5 hover:underline lg:inline-flex"><Headphones size={13} aria-hidden="true" /> Toll Free 1800 180 2422</a>
            <span className="hidden opacity-40 lg:inline">|</span>
            <a href="mailto:coe@sensrs.com" className="hidden items-center gap-1.5 hover:underline md:inline-flex"><Mail size={13} aria-hidden="true" /> Portal Support</a>
            <WebsiteLanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="govt-container flex min-h-[104px] items-center justify-between gap-5 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 sm:gap-4" aria-label="District Survey Report Portal home">
            <img src="/assets/Emblem_of_India.svg.png" alt="State Emblem of India" className="h-16 w-auto shrink-0 object-contain transition-[filter] sm:h-[76px] dark:brightness-0 dark:invert" />
            <div className="hidden h-16 w-px bg-slate-200 sm:block dark:bg-slate-700" />
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#9a5708] sm:text-[11px]">Department of Mines &amp; Geology</p>
              <h1 className="mt-1 text-lg font-extrabold leading-tight text-[#123c6e] sm:text-2xl dark:text-white">District Survey Report Portal</h1>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block dark:text-slate-400">Government of Punjab</p>
            </div>
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            <div className="border-r border-slate-200 pr-4 text-right dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Knowledge &amp; Technical Support</p>
              <p className="mt-1 text-xs font-extrabold text-[#123c6e] dark:text-slate-200">IIT Ropar · SEnSRS</p>
            </div>
            <img src="/assets/sensrs-final-logo.webp" alt="SEnSRS" className="h-11 w-auto object-contain" />
          </div>
        </div>
      </header>

      <nav ref={navigationRef} aria-label="Primary navigation" className="sticky top-0 z-40 bg-[#004f78] text-white shadow-md">
        <div className="flex min-h-[58px] w-full items-stretch justify-between">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex min-h-[58px] items-center gap-2 border-r border-[#1183ad] px-5 text-xs font-semibold uppercase lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />} Menu
          </button>

          <div className="public-desktop-nav hidden min-w-0 flex-1 items-stretch justify-center lg:flex">
            <Link to="/login" className={`govt-nav ${loginActive ? "is-active" : ""}`}>Official Login</Link>
            {navigation.map((item, index) => item.children ? (
              <div
                key={item.label}
                className="public-nav-dropdown"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
                onFocus={() => setOpenDropdown(item.label)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setOpenDropdown(null);
                }}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === item.label}
                  aria-controls={`desktop-dropdown-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => setOpenDropdown((open) => open === item.label ? null : item.label)}
                  className="govt-nav gap-1.5"
                >
                  {item.label} <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === item.label && (
                  <div id={`desktop-dropdown-${item.label.replace(/\s+/g, "-").toLowerCase()}`} className="public-dropdown-menu">
                    {item.children.map((child) => (
                      <a key={child.label} href={child.href} target={child.external ? "_blank" : undefined} rel={child.external ? "noreferrer" : undefined} onClick={closeMenus} className="public-dropdown-link">
                        <span className="min-w-0 flex-1"><strong>{child.label}</strong><small>{child.description}</small></span>
                        {child.external ? <ExternalLink size={14} /> : <ChevronDown size={14} className="-rotate-90" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a key={item.label} href={item.href} className={`govt-nav ${index === 0 && !loginActive ? "is-active" : ""}`}>{item.label}</a>
            ))}
          </div>

          <Link to="/login" aria-current={loginActive ? "page" : undefined} className={`inline-flex items-center border-l border-[#1183ad] px-5 py-3 text-xs font-semibold uppercase text-white transition hover:bg-[#063d5e] lg:hidden ${loginActive ? "bg-[#2a1710]" : "bg-[#004f78]"}`}>
            Official Login
          </Link>
        </div>

        {menuOpen && (
          <div id="public-mobile-navigation" className="border-t border-[#1183ad] bg-[#004f78] lg:hidden">
            <div className="govt-container grid py-2">
              {navigation.map((item) => item.children ? (
                <div key={item.label} className="border-b border-white/10">
                  <button
                    type="button"
                    aria-expanded={mobileDropdown === item.label}
                    aria-controls={`mobile-dropdown-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => setMobileDropdown((open) => open === item.label ? null : item.label)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold hover:bg-white/10"
                  >
                    {item.label} <ChevronDown size={16} className={`transition-transform ${mobileDropdown === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {mobileDropdown === item.label && (
                    <div id={`mobile-dropdown-${item.label.replace(/\s+/g, "-").toLowerCase()}`} className="mb-2 border-l-2 border-[#e49b17] bg-black/10">
                      {item.children.map((child) => (
                        <a key={child.label} href={child.href} target={child.external ? "_blank" : undefined} rel={child.external ? "noreferrer" : undefined} onClick={closeMenus} className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3 text-xs text-white/80 last:border-b-0 hover:bg-white/10 hover:text-white">
                          <span><strong className="block text-white">{child.label}</strong><small className="mt-1 block leading-4 text-white/55">{child.description}</small></span>
                          {child.external && <ExternalLink size={13} className="shrink-0" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a key={item.label} href={item.href} onClick={closeMenus} className="border-b border-white/10 px-3 py-3 text-sm font-semibold last:border-b-0 hover:bg-white/10">{item.label}</a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
