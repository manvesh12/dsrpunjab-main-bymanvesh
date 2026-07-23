import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { PermissionGuard, ProtectedRoute, RoleGuard } from "../security/Guards";
import NotAccessible from "../components/layout/NotAccessible";

import PortalLayout from "../components/layout/PortalLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import CreateProjectPage from "../pages/projects/CreateProjectPage";
import ProjectsPage from "../pages/projects/ProjectsPage";
import AnnexureEditorPage from "../pages/annexures/AnnexureEditorPage";
import AdditionalAnnexureEditorPage from "../pages/annexures/AdditionalAnnexureEditorPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";
import ReplenishmentBuilderPage from "../pages/replenishment/ReplenishmentBuilderPage";
import ModelDsrPage from "../pages/replenishment/ModelDsrPage";
import ReviewerPage from "../pages/workflow/ReviewerPage";
import AnnexuresPage from "../pages/annexures/AnnexuresPage";
import ReportPreviewPage from "../pages/reports/ReportPreviewPage";
import FrontMatterPage from "../pages/dsr-builder/FrontMatterPage";
import ChaptersPage from "../pages/dsr-builder/ChaptersPage";
import PlatesPage from "../pages/dsr-builder/PlatesPage";
import CrossSectionGraphsPage from "../pages/dsr-builder/CrossSectionGraphsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/public/HomePage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AuditPage from "../pages/audit/AuditPage";
import UsersPage from "../pages/users/UsersPage";
import ReportsPage from "../pages/reports/ReportsPage";
import DistrictsPage from "../pages/districts/DistrictsPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import ImportDsrPage from "../pages/import-dsr/ImportDsrPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import { Permission } from "../security/access";
export default function AppRoutes() {
  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/complete" element={<RegisterPage />} />

      {/* Portal routes */}
      <Route element={
        <ProtectedRoute>
          <PortalLayout />
        </ProtectedRoute>
      }>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/projects"
          element={<ProjectsPage />}
        />

        <Route
          path="/projects/create"
          element={
            <PermissionGuard permissions={[Permission.ProjectCreate]} fallback={<NotAccessible />}>
              <CreateProjectPage />
            </PermissionGuard>
          }
        />

        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        
        {/* Data Entry & Project Editing Routes */}
        <Route element={<PermissionGuard permissions={[Permission.ProjectEdit]} fallback={<NotAccessible />}><Outlet /></PermissionGuard>}>
          <Route path="/projects/:projectId/front-matter" element={<PermissionGuard permissions={[Permission.SectionFrontMatter, Permission.SectionCertificate]} fallback={<NotAccessible />}><FrontMatterPage /></PermissionGuard>} />
          <Route path="/projects/:projectId/chapters" element={<PermissionGuard permissions={[Permission.SectionChaptersFirstHalf, Permission.SectionChaptersSecondHalf]} fallback={<NotAccessible />}><ChaptersPage /></PermissionGuard>} />
          <Route path="/projects/:projectId/plates" element={<PermissionGuard permissions={[Permission.SectionPlates]} fallback={<NotAccessible />}><PlatesPage /></PermissionGuard>} />
          <Route path="/projects/:projectId/cross-sections" element={<PermissionGuard permissions={[Permission.SectionCrossSections]} fallback={<NotAccessible />}><CrossSectionGraphsPage /></PermissionGuard>} />
          <Route path="/projects/:projectId/annexures" element={<AnnexuresPage />} />
          {["1","2","3","4","5","6","7"].map((annexure) => <Route key={annexure} path={`/projects/:projectId/annexures/${annexure}`} element={<AnnexureEditorPage annexure={annexure} />} />)}
          {["B","C","D","E","F","G","H","I","J","K"].map((letter) => <Route key={letter} path={`/projects/:projectId/annexures/additional/${letter.toLowerCase()}`} element={<AdditionalAnnexureEditorPage letter={letter} />} />)}
          <Route path="/projects/:projectId/replenishment" element={<ReplenishmentBuilderPage />} />
          <Route path="/projects/:projectId/model-dsr" element={<ModelDsrPage />} />
        </Route>

        <Route path="/projects/:projectId/preview" element={<ReportPreviewPage />} />
        <Route path="/projects/:projectId/generate" element={<PermissionGuard permissions={[Permission.ReportGenerate, Permission.ReportDownload]} fallback={<NotAccessible />}><ReportPreviewPage /></PermissionGuard>} />
        
        <Route path="/projects/:projectId/reviewer" element={<PermissionGuard permissions={[Permission.ReportApprove, Permission.SectionReviewOnly]} fallback={<NotAccessible />}><ReviewerPage /></PermissionGuard>} />
        <Route path="/reviewer" element={<PermissionGuard permissions={[Permission.ReportApprove, Permission.SectionReviewOnly]} fallback={<NotAccessible />}><ReviewerPage /></PermissionGuard>} />

        <Route
          path="/workflow"
          element={<PermissionGuard permissions={[Permission.ReportApprove, Permission.SectionReviewOnly]} fallback={<NotAccessible />}><ReviewerPage /></PermissionGuard>}
        />

        <Route
          path="/districts"
          element={<DistrictsPage />}
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="/analytics"
          element={<AnalyticsPage />}
        />

        <Route
          path="/notifications"
          element={<NotificationsPage />}
        />

        <Route
          path="/users"
          element={<UsersPage />}
        />
        <Route
          path="/audit"
          element={<AuditPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/import-previous-dsr"
          element={
            <RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN"]} fallback={<NotAccessible />}>
              <ImportDsrPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
