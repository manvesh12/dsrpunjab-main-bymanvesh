import { useState } from "react";
import { Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ReviewerFloatingPanel from "../ui/ReviewerFloatingPanel";
import SectionReviewWidget from "../ui/SectionReviewWidget";
import { ArrowLeft } from "lucide-react";

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  const location = useLocation();

  // Show floating panels only when inside a project
  const hasProject = !!params.projectId;

  // Show the section review widget only on actual DSR section pages
  // (not on project overview, not on reviewer page)
  const sectionPaths = [
    "front-matter", "chapters", "plates", "cross-sections",
    "annexures", "replenishment", "model-dsr", "preview", "generate",
  ];
  const isOnSectionPage =
    hasProject &&
    sectionPaths.some((p) => location.pathname.includes(`/${p}`));

  return (
    <div className="gov-portal min-h-screen bg-[#f3f4f6] dark:bg-slate-950 transition-colors">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div className={collapsed ? "lg:pl-20" : "lg:pl-72"}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main id="main-content" className="p-4 md:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
          <Outlet />
        </main>
      </div>

      {/* Bottom-right: Send review / notification panel (all project pages) */}
      {hasProject && <ReviewerFloatingPanel />}

      {/* Bottom-left: Context-aware section review widget (on DSR section pages only) */}
      {isOnSectionPage && <SectionReviewWidget />}

      {/* Left-edge: Floating Back to Project arrow tab (visible on section pages only) */}
      {isOnSectionPage && <BackToProjectTab projectId={params.projectId!} />}
    </div>
  );
}

/** Floating left-edge tab that navigates back to the project details page. */
function BackToProjectTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/projects/${projectId}`)}
      title="Back to Project"
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 0,
        overflow: "hidden",
        width: "2.5rem",           /* collapsed: just the arrow */
        maxWidth: "2.5rem",
        transition: "max-width 0.3s ease, background 0.2s ease, box-shadow 0.2s ease",
        padding: "0.75rem 0",
        borderRadius: "0 0.875rem 0.875rem 0",
        background: "#12396b",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: "2px 2px 12px rgba(37,99,235,0.35)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.maxWidth = "11rem";
        el.style.width = "11rem";
        el.style.boxShadow = "4px 4px 18px rgba(37,99,235,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.maxWidth = "2.5rem";
        el.style.width = "2.5rem";
        el.style.boxShadow = "2px 2px 12px rgba(37,99,235,0.35)";
      }}
    >
      {/* Arrow icon — always visible */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: "2.5rem",
          height: "100%",
        }}
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </span>
      {/* Label — revealed on hover via parent width expansion */}
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.01em",
          paddingRight: "0.875rem",
          opacity: 1,
        }}
      >
        Back to Project
      </span>
    </button>
  );
}
