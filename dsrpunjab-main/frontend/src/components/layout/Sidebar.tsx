import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  adminNavigationItems,
  navigationItems,
} from "../../utils/constants";
import { useAuth } from "../../security/auth.context";
import { AccessControl } from "../auth/AccessControl";
import { normalizedRole, Permission } from "../../security/access";
const RoutePermissionMap: Record<string, string[]> = {
  "/dashboard": [],
  "/projects": [Permission.ProjectView],
  "/workflow": [Permission.ReportApprove, Permission.SectionReviewOnly],
  "/districts": [],
  "/reports": [Permission.ReportView, Permission.ReportGenerate, Permission.ReportDownload],
  "/analytics": [],
  "/notifications": [],
  "/users": [Permission.UserView],
  "/audit": [Permission.UserView],
  "/settings": [Permission.UserEdit],
  "/import-previous-dsr": [Permission.ProjectDelete],
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export default function Sidebar({ open, onClose, collapsed, onCollapsedChange }: SidebarProps) {
  const { user } = useAuth();
  const role = normalizedRole(user);
  const visiblePaths: Record<string, string[]> = {
    COE_SENSRS: ["/dashboard", "/projects", "/notifications"],
    REVIEWER: ["/dashboard", "/projects", "/workflow", "/notifications"],
    DMO: ["/dashboard", "/projects", "/districts", "/reports", "/notifications"],
    HEAD_OFFICE: ["/dashboard", "/projects", "/reports", "/notifications"],
  };
  const canShowPath = (path: string) => role === "STATE_ADMIN" || (visiblePaths[role] || []).includes(path);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link flex items-center gap-3 border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? "border-[#e49b17] bg-[#00527a] text-white shadow-sm"
        : "border-transparent text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden dark:bg-black/60"
        />
      )}

      <aside
        className={`gov-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[#073b5b] text-white shadow-xl transition-all duration-300 lg:translate-x-0 lg:shadow-none ${collapsed ? "w-20" : "w-72"} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-[112px] items-center border-b-4 border-[#e49b17] bg-[#082f4c] px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img
            src="/assets/Emblem_of_India.svg.png"
            alt="State Emblem of India"
            className={`shrink-0 object-contain brightness-0 invert transition-all ${collapsed ? "h-10 w-8" : "h-14 w-11"}`}
          />
          
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Punjab Government</span>
              <span className="truncate text-[15px] font-extrabold leading-tight text-white">District Survey</span>
              <span className="truncate text-[15px] font-extrabold leading-tight text-white">Report Portal</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} className="absolute -right-3 top-32 hidden size-7 items-center justify-center border border-[#e49b17] bg-[#082f4c] text-white shadow lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 hide-scrollbar">
          <p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-amber-300 ${collapsed ? "hidden" : ""}`}>
            Portal
          </p>

          {navigationItems.filter((item) => canShowPath(item.path)).map((item) => (
            <AccessControl key={item.path} requiredPermissions={RoutePermissionMap[item.path] || []}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon size={19} />
                {!collapsed && item.label}
              </NavLink>
            </AccessControl>
          ))}

          {role === "STATE_ADMIN" && <p className={`mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-amber-300 ${collapsed ? "hidden" : ""}`}>Administration</p>}

          {adminNavigationItems.filter((item) => canShowPath(item.path)).map((item) => (
            <AccessControl key={item.path} requiredPermissions={RoutePermissionMap[item.path] || []}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon size={19} />
                {!collapsed && item.label}
              </NavLink>
            </AccessControl>
          ))}
        </nav>

        <div className={`border-t border-white/10 bg-[#082f4c] ${collapsed ? "p-2" : "p-4"}`}>
          {!collapsed && <p className="text-center text-[10px] leading-4 text-white/55">Official administrative workspace</p>}
        </div>
      </aside>
    </>
  );
}
