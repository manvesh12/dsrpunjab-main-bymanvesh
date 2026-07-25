import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rolePermissions: Record<string, string[]> = {
  DMO: [
    "DASHBOARD_VIEW", "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_EDIT",
    "SECTION_FRONT_MATTER_EDIT", "SECTION_CERTIFICATE_EDIT",
    "SECTION_CHAPTERS_1_5_EDIT", "SECTION_CHAPTERS_6_10_EDIT",
    "SECTION_PLATES_EDIT", "SECTION_CROSS_SECTIONS_EDIT", "SECTION_REPLENISHMENT_EDIT",
    "REPORT_VIEW", "REPORT_GENERATE", "REPORT_DOWNLOAD",
  ],
  COE_SENSRS: ["DASHBOARD_VIEW", "PROJECT_VIEW", "SECTION_REPLENISHMENT_EDIT"],
  REVIEWER: ["DASHBOARD_VIEW", "PROJECT_VIEW", "SECTION_REVIEW_ONLY", "REPORT_VIEW"],
  HEAD_OFFICE: [
    "DASHBOARD_VIEW", "PROJECT_VIEW", "PROJECT_EDIT",
    "SECTION_FRONT_MATTER_EDIT", "SECTION_CERTIFICATE_EDIT",
    "SECTION_CHAPTERS_1_5_EDIT", "SECTION_CHAPTERS_6_10_EDIT",
    "SECTION_PLATES_EDIT", "SECTION_CROSS_SECTIONS_EDIT", "SECTION_REPLENISHMENT_EDIT",
    "REPORT_VIEW", "REPORT_GENERATE", "REPORT_DOWNLOAD",
  ],
};

async function main() {
  const sectionModule = await prisma.module.upsert({
    where: { name: "SECTION" },
    update: {},
    create: { name: "SECTION" },
  });
  const replenishmentPermission = await prisma.permission.upsert({
    where: { action: "SECTION_REPLENISHMENT_EDIT" },
    update: { moduleId: sectionModule.id, description: "SECTION REPLENISHMENT EDIT" },
    create: { moduleId: sectionModule.id, action: "SECTION_REPLENISHMENT_EDIT", description: "SECTION REPLENISHMENT EDIT" },
  });

  const allPermissions = await prisma.permission.findMany({ select: { id: true, action: true } });
  const permissionByAction = new Map(allPermissions.map((permission) => [permission.action, permission.id]));

  await prisma.$transaction(async (tx) => {
    const admin = await tx.role.upsert({ where: { name: "STATE_ADMIN" }, update: {}, create: { name: "STATE_ADMIN" } });
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: replenishmentPermission.id } },
      update: {},
      create: { roleId: admin.id, permissionId: replenishmentPermission.id },
    });

    for (const [roleName, actions] of Object.entries(rolePermissions)) {
      const role = await tx.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
      const permissionIds = actions.map((action) => {
        const permissionId = permissionByAction.get(action);
        if (!permissionId) throw new Error(`Missing permission: ${action}`);
        return permissionId;
      });
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      await tx.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })) });
    }
  });

  console.log("Role access synchronized without changing users or projects.");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
