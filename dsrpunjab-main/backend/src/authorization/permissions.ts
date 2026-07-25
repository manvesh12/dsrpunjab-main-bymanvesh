

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
  STATE_ADMIN: ["full_access"],
});

export function hasPermission(role: string, permission: Permission) {
  return rolePermissions[role]?.includes("full_access") || rolePermissions[role]?.includes(permission) || false;
}
