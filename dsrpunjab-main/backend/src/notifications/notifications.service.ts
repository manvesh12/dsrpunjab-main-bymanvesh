import type { Prisma } from "@prisma/client";
import type { AuthUser } from "../authentication/auth-user.js";
import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { notificationsRepository, type NotificationsRepository } from "./notifications.repository.js";

type ProjectNotificationContext = {
  id: bigint;
  projectName: string;
  districtId: bigint | null;
  createdBy: bigint | null;
};

const GLOBAL_ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN"];
const DISTRICT_REVIEW_ROLES = ["DISTRICT_ADMIN", "REVIEWER"];
const DISTRICT_EDITOR_ROLES = ["OFFICER_1", "OFFICER_2", "GEOLOGIST", "DATA_ENTRY_OPERATOR"];
const DISTRICT_PUBLISH_ROLES = ["DISTRICT_ADMIN", "REPORT_GENERATOR"];
const REVIEW_RECIPIENT_ROLES = [
  "OFFICER_1",
  "OFFICER_2",
  "GEOLOGIST",
  "REVIEWER",
  "DISTRICT_ADMIN",
  "STATE_ADMIN",
  "REPORT_GENERATOR",
] as const;

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async inbox(userId: bigint, limit = 30) {
    const take = Math.min(Math.max(limit, 1), 100);
    const [items, unreadCount] = await Promise.all([
      this.repository.listForUser(userId, take),
      this.repository.unreadCount(userId),
    ]);
    return { items, unreadCount };
  }

  async markRead(userId: bigint, id: bigint) {
    const result = await this.repository.markRead(userId, id);
    if (!result.count) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
    return { success: true };
  }

  async markAllRead(userId: bigint) {
    const result = await this.repository.markAllRead(userId);
    return { success: true, updated: result.count };
  }

  async clearRead(userId: bigint) {
    const result = await this.repository.deleteRead(userId);
    return { success: true, deleted: result.count };
  }

  async sendReview(
    actor: AuthUser,
    input: {
      projectId: bigint;
      sectionId: string;
      sectionLabel: string;
      note: string;
      recipientRoles: string[];
    },
  ) {
    const sectionId = input.sectionId.trim().toLowerCase();
    const sectionLabel = input.sectionLabel.trim();
    const note = input.note.trim();
    const recipientRoles = [...new Set(input.recipientRoles.map((role) => role.trim().toUpperCase()))];
    const allowedRoles = new Set<string>(REVIEW_RECIPIENT_ROLES);

    if (!sectionId || !sectionLabel || !note) {
      throw new ApiError(400, "INVALID_REVIEW", "Section and review feedback are required");
    }
    if (sectionId.length > 80 || sectionLabel.length > 120 || note.length > 4000) {
      throw new ApiError(400, "INVALID_REVIEW", "Review feedback is too long");
    }
    if (!recipientRoles.length || recipientRoles.some((role) => !allowedRoles.has(role))) {
      throw new ApiError(400, "INVALID_RECIPIENTS", "Select at least one valid recipient role");
    }

    const project = await this.repository.findProject(input.projectId);
    assertProjectDistrictAccess(project, actor);

    const globalRoles = recipientRoles.filter((role) => GLOBAL_ADMIN_ROLES.includes(role));
    const districtRoles = recipientRoles.filter((role) => !GLOBAL_ADMIN_ROLES.includes(role));
    const roleConditions: Prisma.UserWhereInput[] = [];
    if (globalRoles.length) roleConditions.push({ role: { in: globalRoles } });
    if (districtRoles.length) {
      roleConditions.push(
        project.districtId
          ? { role: { in: districtRoles }, districtId: project.districtId }
          : { role: { in: districtRoles } },
      );
    }

    const recipients = await this.repository.findRecipientIds({
      id: { not: actor.id },
      OR: roleConditions,
    });
    const recipientIds = [...new Set(recipients.map((recipient) => recipient.id))];
    const message = `${actor.fullName} sent review feedback for ${sectionLabel} in "${project.projectName}": ${note}`;
    const result = await this.repository.createForUsers(
      recipientIds,
      `REVIEW_NOTE:${sectionId}:PROJECT_${project.id}`,
      message,
    );

    return { success: true, recipients: result.count };
  }

  async notifyWorkflow(action: string, actor: AuthUser, project: ProjectNotificationContext, remarks?: string) {
    const normalizedAction = action.trim().toUpperCase();
    const districtCondition = (roles: string[]): Prisma.UserWhereInput =>
      project.districtId ? { role: { in: roles }, districtId: project.districtId } : { role: { in: roles } };

    const stageTargetRoles: Record<string, string[]> = {
      SURVEY_OFFICER_APPROVED: ["GEOLOGIST"],
      GIS_EXPERT_APPROVED: ["GEOLOGIST"],
      GEOLOGIST_APPROVED: ["OFFICER_1", "OFFICER_2", "DISTRICT_ADMIN"],
      DISTRICT_OFFICER_APPROVED: ["REVIEWER"],
      REVIEWER_APPROVED: ["DISTRICT_ADMIN"],
      DISTRICT_ADMIN_APPROVED: ["STATE_ADMIN"],
      STATE_ADMIN_APPROVED: ["REPORT_GENERATOR"],
      FINAL_REPORT_GENERATED: ["DISTRICT_ADMIN", "REPORT_GENERATOR"],
    };

    let roleConditions: Prisma.UserWhereInput[];
    if (stageTargetRoles[normalizedAction]) {
      roleConditions = [
        { role: "SUPER_ADMIN" },
        districtCondition(stageTargetRoles[normalizedAction]),
      ];
    } else if (["SUBMIT", "RESUBMIT", "REVIEW"].includes(normalizedAction)) {
      roleConditions = [{ role: { in: GLOBAL_ADMIN_ROLES } }, districtCondition(DISTRICT_REVIEW_ROLES)];
    } else if (["APPROVE", "FORWARD"].includes(normalizedAction)) {
      roleConditions = [{ role: { in: GLOBAL_ADMIN_ROLES } }, districtCondition(DISTRICT_PUBLISH_ROLES)];
    } else if (["RETURN", "REJECT"].includes(normalizedAction)) {
      roleConditions = [{ role: { in: GLOBAL_ADMIN_ROLES } }, districtCondition(DISTRICT_EDITOR_ROLES)];
    } else {
      roleConditions = [districtCondition([...DISTRICT_REVIEW_ROLES, ...DISTRICT_EDITOR_ROLES])];
    }

    const explicitRecipientIds = project.createdBy ? [project.createdBy] : [];
    const where: Prisma.UserWhereInput = {
      id: { not: actor.id },
      OR: [
        ...roleConditions,
        ...(explicitRecipientIds.length ? [{ id: { in: explicitRecipientIds } }] : []),
        { projectMembers: { some: { projectId: project.id } } },
      ],
    };
    const recipients = await this.repository.findRecipientIds(where);
    const detail = remarks?.trim() ? ` Remarks: ${remarks.trim()}` : "";
    const message = `${actor.fullName} ${this.actionLabel(normalizedAction)} "${project.projectName}".${detail}`;
    await this.repository.createForUsers(
      [...new Set(recipients.map((recipient) => recipient.id))],
      `WORKFLOW_${normalizedAction}:PROJECT_${project.id}`,
      message,
    );
  }

  private actionLabel(action: string) {
    const labels: Record<string, string> = {
      SUBMIT: "submitted",
      RESUBMIT: "resubmitted",
      REVIEW: "started reviewing",
      APPROVE: "approved",
      FORWARD: "forwarded",
      RETURN: "returned",
      REJECT: "rejected",
      SURVEY_OFFICER_APPROVED: "completed survey officer approval for",
      GIS_EXPERT_APPROVED: "completed GIS expert approval for",
      GEOLOGIST_APPROVED: "completed geologist approval for",
      DISTRICT_OFFICER_APPROVED: "completed district officer approval for",
      REVIEWER_APPROVED: "completed reviewer approval for",
      DISTRICT_ADMIN_APPROVED: "completed district admin approval for",
      STATE_ADMIN_APPROVED: "completed state admin approval for",
      FINAL_REPORT_GENERATED: "generated the final report for",
    };
    return labels[action] || action.toLowerCase().replaceAll("_", " ");
  }
}

export const notificationsService = new NotificationsService(notificationsRepository);
