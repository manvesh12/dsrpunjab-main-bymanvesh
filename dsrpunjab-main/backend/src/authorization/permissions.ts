

export type Permission =
  | "full_access"
  | "project_view"
  | "project_create"
  | "project_edit"
  | "project_delete"
  | "report_view"
  | "report_generate"
  | "report_download"
  | "report_approve"
  | "user_manage"
  | "section_front_matter"
  | "section_certificate"
  | "section_chapters_1_5"
  | "section_chapters_6_10"
  | "section_plates"
  | "section_cross_sections"
  | "section_review_only";

export const rolePermissions: Readonly<Record<string, Permission[]>> = Object.freeze({
  SUPER_ADMIN: ["full_access"],
  STATE_ADMIN: ["full_access"],
  DISTRICT_ADMIN: ["project_view", "report_view", "user_manage"],
  OFFICER_1: ["project_view", "project_edit", "section_front_matter", "section_chapters_1_5"],
  OFFICER_2: ["project_view", "project_edit", "section_certificate", "section_chapters_1_5"],
  GEOLOGIST: ["project_view", "project_edit", "section_plates", "section_cross_sections"],
  REVIEWER: ["project_view", "report_view", "report_approve", "section_review_only"],
  DATA_ENTRY_OPERATOR: ["project_view", "project_edit", "section_chapters_6_10"],
  REPORT_GENERATOR: ["report_view", "report_generate", "report_download"],
});

export function hasPermission(role: string, permission: Permission) {
  return rolePermissions[role]?.includes("full_access") || rolePermissions[role]?.includes(permission) || false;
}
