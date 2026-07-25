// Dynamic Role Policy for Normalized RBAC

export function roleToFrontend(role: string) {
  return role === "STATE_ADMIN" ? "State Admin" : "State Admin";
}

export function permissionsFor(role: string): string[] {
  return []; // Replaced by dynamic Session permissions
}

// These legacy helpers are mapped loosely for compatibility with untouched files, 
// but the true authorization uses PermissionsGuard in routers.
export function canUpload(role: string) { return role === "STATE_ADMIN"; }
export function canReview(role: string) { return role === "STATE_ADMIN"; }
export function canAdmin(role: string) { return role === "STATE_ADMIN"; }
