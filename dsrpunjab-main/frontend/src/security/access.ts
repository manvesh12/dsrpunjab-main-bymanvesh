import type { User } from "./auth.types";

export const Permission = {
  ProjectView: "PROJECT_VIEW",
  ProjectCreate: "PROJECT_CREATE",
  ProjectEdit: "PROJECT_EDIT",
  ProjectDelete: "PROJECT_DELETE",
  ReportView: "REPORT_VIEW",
  ReportGenerate: "REPORT_GENERATE",
  ReportDownload: "REPORT_DOWNLOAD",
  ReportApprove: "REPORT_APPROVE",
  UserView: "USER_VIEW",
  UserCreate: "USER_CREATE",
  UserEdit: "USER_EDIT",
  UserDelete: "USER_DELETE",
  SectionFrontMatter: "SECTION_FRONT_MATTER_EDIT",
  SectionCertificate: "SECTION_CERTIFICATE_EDIT",
  SectionChaptersFirstHalf: "SECTION_CHAPTERS_1_5_EDIT",
  SectionChaptersSecondHalf: "SECTION_CHAPTERS_6_10_EDIT",
  SectionPlates: "SECTION_PLATES_EDIT",
  SectionCrossSections: "SECTION_CROSS_SECTIONS_EDIT",
  SectionReviewOnly: "SECTION_REVIEW_ONLY",
} as const;

export function normalizedRole(user?: Pick<User, "role"> | null) {
  return user?.role?.replace(/^ROLE_/, "") || "";
}

export function hasPermission(user: Pick<User, "permissions"> | null | undefined, permission: string) {
  return user?.permissions.includes(permission) ?? false;
}

export function hasAnyPermission(user: Pick<User, "permissions"> | null | undefined, permissions: string[]) {
  return permissions.length === 0 || permissions.some((permission) => hasPermission(user, permission));
}

export function hasAllPermissions(user: Pick<User, "permissions"> | null | undefined, permissions: string[]) {
  return permissions.every((permission) => hasPermission(user, permission));
}

export function isGlobalAdmin(user?: Pick<User, "role"> | null) {
  const role = normalizedRole(user);
  return role === "SUPER_ADMIN" || role === "STATE_ADMIN";
}
