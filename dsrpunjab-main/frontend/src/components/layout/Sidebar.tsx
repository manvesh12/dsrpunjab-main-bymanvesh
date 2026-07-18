import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  adminNavigationItems,
  navigationItems,
} from "../../utils/constants";
import { useAuth } from "../../security/auth.context";
import { AccessControl } from "../auth/AccessControl";
import { Permission } from "../../security/access";
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link flex items-center gap-3 border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? "border-[#f59e0b] bg-[#12396b] text-white dark:bg-blue-800"
        : "border-transparent text-slate-700 hover:border-[#12396b] hover:bg-blue-50 hover:text-[#12396b] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
        className={`gov-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-300 bg-white transition-all duration-300 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${collapsed ? "w-20" : "w-72"} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-[112px] items-center border-b-4 border-[#f59e0b] bg-[#f8fafc] px-4 dark:border-amber-500 dark:bg-slate-900 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src="/assets/dsr-logo.png" 
            alt="Smart DSR Portal" 
            className={`shrink-0 object-contain transition-all ${collapsed ? "w-full h-8" : "w-10 h-10"} dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`} 
          />
          
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Punjab Government</span>
              <span className="text-[15px] font-extrabold text-[#12396b] dark:text-white leading-tight truncate">District Survey</span>
              <span className="text-[15px] font-extrabold text-[#12396b] dark:text-blue-300 leading-tight truncate">Report Portal</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} className="absolute -right-3 top-32 hidden size-7 items-center justify-center rounded-sm border border-slate-300 bg-white text-[#12396b] shadow lg:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 hide-scrollbar">
          <p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${collapsed ? "hidden" : ""}`}>
            Portal
          </p>

          {navigationItems.map((item) => (
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

          <p className={`mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${collapsed ? "hidden" : ""}`}>
            Administration
          </p>

          {adminNavigationItems.map((item) => (
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

        <div className={`border-t border-slate-200 ${collapsed ? "p-2" : "p-4"}`}>
        </div>
      </aside>
    </>
  );
}
