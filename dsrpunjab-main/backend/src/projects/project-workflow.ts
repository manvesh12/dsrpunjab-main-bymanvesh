import type { Project } from "@prisma/client";
import type { AuthUser } from "../authentication/auth-user.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { readProjectState } from "./projects.validator.js";

export const WORKFLOW_STAGES = ["DMO", "COE_SENSRS", "REVIEWER", "HEAD_OFFICE", "COMPLETED"] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type ProjectWorkflow = {
  stage: WorkflowStage;
  revisionFor?: Exclude<WorkflowStage, "COMPLETED"> | null;
  updatedAt?: string;
  updatedBy?: number;
  remarks?: string;
};

export function workflowFor(project: Pick<Project, "projectState">): ProjectWorkflow {
  const state = readProjectState(project.projectState);
  const workflow = state.workflow && typeof state.workflow === "object" && !Array.isArray(state.workflow)
    ? state.workflow as Record<string, unknown>
    : {};
  const stage = WORKFLOW_STAGES.includes(String(workflow.stage) as WorkflowStage)
    ? String(workflow.stage) as WorkflowStage
    : "DMO";
  return { ...workflow, stage } as ProjectWorkflow;
}

export function canEditWorkflowStage(user: AuthUser, project: Pick<Project, "projectState" | "phaseLocked">) {
  if (user.role === "STATE_ADMIN") return true;
  if (project.phaseLocked) return false;
  return workflowFor(project).stage === user.role;
}

export function assertWorkflowEditable(user: AuthUser, project: Pick<Project, "projectState" | "phaseLocked">) {
  if (!canEditWorkflowStage(user, project)) {
    throw new ApiError(423, "PROJECT_STAGE_LOCKED", `Project is locked for ${user.role.replaceAll("_", " ")} at the current workflow stage.`);
  }
}

export function stateWithWorkflow(projectState: string | null, workflow: ProjectWorkflow) {
  return JSON.stringify({ ...readProjectState(projectState), workflow });
}
