import { ApiError } from "../common/exceptions/api-error.js";
import { canAdmin } from "../authorization/role.policy.js";

export function normalizeRole(value: unknown) {
  const role = String(value || "REVIEWER").toUpperCase().trim().replace(/[\s-]+/g, "_");
  const supported = ["STATE_ADMIN", "DMO", "COE_SENSRS", "REVIEWER", "HEAD_OFFICE"];
  if (!supported.includes(role)) throw new ApiError(400, "INVALID_ROLE", `Supported roles: ${supported.join(", ")}`);
  return role;
}

export function requiresDistrict(role: string) { return !canAdmin(role); }

export function requiredDistrict(value: unknown, role: string): bigint | null {
  const districtId = String(value || "").trim();
  if (requiresDistrict(role) && !districtId) {
    throw new ApiError(400, "DISTRICT_REQUIRED", "District is required for every non-admin account.");
  }
  return districtId ? BigInt(districtId) : null;
}

export function userId(value: string | string[] | undefined) {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "INVALID_USER_ID", "Invalid user id");
  return BigInt(normalized);
}

export function normalizedBulkRole(rawRole: string) {
  const compact = rawRole.toUpperCase().trim().replace(/[\s_-]+/g, "");
  const roles: Record<string, string> = {
    STATEADMIN: "STATE_ADMIN", DMO: "DMO", COESENSRS: "COE_SENSRS",
    REVIEWER: "REVIEWER", HEADOFFICE: "HEAD_OFFICE",
  };
  return roles[compact] || rawRole;
}

export function rowValue(row: any, targetKey: string) {
  if (!row || typeof row !== "object") return "";
  const target = targetKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === target) return String(row[key] || "").trim();
  }
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "").includes(target)) return String(row[key] || "").trim();
  }
  return "";
}
