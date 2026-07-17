// Dynamic Role Policy for Normalized RBAC

export function roleToFrontend(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    STATE_ADMIN: "State Admin",
    DISTRICT_ADMIN: "District Admin",
    OFFICER_1: "Officer 1",
    OFFICER_2: "Officer 2",
    GEOLOGIST: "Geologist",
    REVIEWER: "Reviewer",
    DATA_ENTRY_OPERATOR: "Data Entry Operator",
    REPORT_GENERATOR: "Report Generator",
  };
  return labels[role] || role.replaceAll("_", " ");
}

export function permissionsFor(role: string): string[] {
  return []; // Replaced by dynamic Session permissions
}

// These legacy helpers are mapped loosely for compatibility with untouched files, 
// but the true authorization uses PermissionsGuard in routers.
export function canUpload(role: string) { return role === 'SUPER_ADMIN' || role === 'STATE_ADMIN' || role === 'OFFICER_1' || role === 'OFFICER_2' || role === 'DATA_ENTRY_OPERATOR' || role === 'GEOLOGIST'; }
export function canReview(role: string) { return role === 'SUPER_ADMIN' || role === 'STATE_ADMIN' || role === 'REVIEWER'; }
export function canAdmin(role: string) { return role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'; }
