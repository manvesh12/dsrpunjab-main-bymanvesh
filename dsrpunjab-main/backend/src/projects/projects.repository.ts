import type { DsrFile, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

type PhasePersistenceInput = {
  sourceId: bigint;
  lockedSourceState: string;
  nextProject: Prisma.ProjectUncheckedCreateInput;
  files: DsrFile[];
  workflow: Prisma.WorkflowHistoryUncheckedCreateInput;
};

export class ProjectsRepository {
  constructor(private readonly database: PrismaClient) {}

  list(districtId: bigint | null) {
    return this.database.project.findMany({ where: districtId ? { districtId } : {}, include: { files: true }, orderBy: { createdAt: "desc" } });
  }

  listAccessible(userId: bigint, districtId: bigint | null, globalAccess: boolean) {
    return this.database.project.findMany({
      where: globalAccess
        ? {}
        : {
            OR: [
              { projectMembers: { some: { userId } } },
              ...(districtId ? [{ districtId }] : []),
            ],
          },
      include: { files: true },
      orderBy: { createdAt: "desc" },
    });
  }

  deleteAll() { return this.database.project.deleteMany({}); }

  create(data: Prisma.ProjectUncheckedCreateInput, includeFiles = false) {
    return this.database.project.create({ data, ...(includeFiles ? { include: { files: true } } : {}) });
  }

  createWorkflow(data: Prisma.WorkflowHistoryUncheckedCreateInput) {
    return this.database.workflowHistory.create({ data });
  }

  async assignWorkflowMembers(projectId: bigint, districtId: bigint | null, creatorId: bigint) {
    const users = await this.database.user.findMany({
      where: {
        active: true,
        role: { in: ["DMO", "COE_SENSRS", "REVIEWER", "HEAD_OFFICE"] },
        OR: [
          { id: creatorId },
          { role: "HEAD_OFFICE" },
          ...(districtId ? [{ districtId }] : []),
        ],
      },
      select: { id: true, role: true },
    });
    if (!users.length) return { count: 0 };
    return this.database.projectMember.createMany({
      data: users.map((user) => ({ projectId, userId: user.id, role: user.role })),
      skipDuplicates: true,
    });
  }

  find(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  findWithFiles(id: bigint) { return this.database.project.findUnique({ where: { id }, include: { files: true, projectDraft: true, projectSections: true } }); }

  update(id: bigint, data: Prisma.ProjectUncheckedUpdateInput, includeFiles = false) {
    return this.database.project.update({ where: { id }, data, ...(includeFiles ? { include: { files: true } } : {}) });
  }

  files(projectId: bigint) { return this.database.dsrFile.findMany({ where: { projectId } }); }

  delete(id: bigint) { return this.database.project.delete({ where: { id } }); }

  findDistrictByName(name: string) {
    return this.database.district.findFirst({ where: { name } });
  }

  createNextPhase(input: PhasePersistenceInput) {
    return this.database.$transaction(async tx => {
      await tx.project.update({
        where: { id: input.sourceId },
        data: { phaseLocked: true, projectState: input.lockedSourceState }
      });
      const nextProject = await tx.project.create({ data: input.nextProject });
      const sourceMembers = await tx.projectMember.findMany({
        where: { projectId: input.sourceId },
        select: { userId: true, role: true },
      });
      if (sourceMembers.length) {
        await tx.projectMember.createMany({
          data: sourceMembers.map((member) => ({
            projectId: nextProject.id,
            userId: member.userId,
            role: member.role,
          })),
          skipDuplicates: true,
        });
      }
      if (input.files.length) {
        await tx.dsrFile.createMany({
          data: input.files.map(file => ({
            projectId: nextProject.id,
            annexureId: file.annexureId,
            fileName: file.fileName,
            objectKey: file.objectKey,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes
          })),
          skipDuplicates: true
        });
      }
      await tx.workflowHistory.create({ data: { ...input.workflow, reportId: nextProject.id } });
      return tx.project.findUnique({ where: { id: nextProject.id }, include: { files: true } });
    });
  }
}

export type ProjectsRepositoryContract = Pick<
  ProjectsRepository,
  "list" | "listAccessible" | "deleteAll" | "create" | "createWorkflow" | "assignWorkflowMembers" | "find" | "findWithFiles" | "update" | "files" | "delete" | "createNextPhase" | "findDistrictByName"
>;

export const projectsRepository = new ProjectsRepository(prisma);
