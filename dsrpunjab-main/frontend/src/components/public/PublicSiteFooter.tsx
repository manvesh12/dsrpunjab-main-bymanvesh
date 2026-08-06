import { ExternalLink, Headphones, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function PublicSiteFooter() {
  return (
    <footer id="contact" className="bg-[#082d49] text-white">
      <div className="govt-container grid gap-9 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.9fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/assets/Emblem_of_India.svg.png" alt="State Emblem of India" className="h-14 brightness-0 invert" />
            <div>
              <p className="text-sm font-extrabold">District Survey Report Portal</p>
              <p className="mt-1 text-xs text-white/60">Department of Mines &amp; Geology</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-xs leading-6 text-white/60">An official digital workspace for preparing, reviewing and managing District Survey Reports in Punjab.</p>
        </div>

        <div>
          <h2 className="footer-heading">Quick Links</h2>
          <div className="mt-4 grid gap-3 text-xs text-white/70">
            <a href="/#about" className="hover:text-white hover:underline">About Portal</a>
            <a href="/#services" className="hover:text-white hover:underline">Online Services</a>
            <a href="/#workflow" className="hover:text-white hover:underline">DSR Workflow</a>
            <Link to="/login" className="hover:text-white hover:underline">Official Login</Link>
          </div>
        </div>

        <div>
          <h2 className="footer-heading">Official Resources</h2>
          <div className="mt-4 grid gap-3 text-xs text-white/70">
            <a href="https://punjab.gov.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">Punjab Government <ExternalLink size={12} /></a>
            <a href="https://minesandgeology.punjab.gov.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">Mines &amp; Geology <ExternalLink size={12} /></a>
            <a href="https://www.iitrpr.ac.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">IIT Ropar <ExternalLink size={12} /></a>
          </div>
        </div>

        <div>
          <h2 className="footer-heading">Helpdesk</h2>
          <div className="mt-4 grid gap-3 text-xs leading-5 text-white/70">
            <a href="tel:18001802422" className="flex items-start gap-2 hover:text-white"><Headphones size={14} className="mt-0.5 shrink-0" /> 1800 180 2422</a>
            <a href="mailto:coe@sensrs.com" className="flex items-start gap-2 hover:text-white"><Mail size={14} className="mt-0.5 shrink-0" /> coe@sensrs.com</a>
            <span className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> Punjab, India</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#061f34]">
        <div className="govt-container flex flex-col justify-between gap-2 py-4 text-[11px] text-white/50 md:flex-row">
          <span>© {new Date().getFullYear()} Department of Mines &amp; Geology, Government of Punjab.</span>
          <span>Knowledge and technical support: IIT Ropar · SEnSRS</span>
        </div>
      </div>
    </footer>
  );
}
