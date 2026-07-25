import { PrismaClient, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PUNJAB_DISTRICTS = [
  ["Amritsar", "AMR"],
  ["Barnala", "BNL"],
  ["Bathinda", "BTI"],
  ["Faridkot", "FDK"],
  ["Fatehgarh Sahib", "FGS"],
  ["Fazilka", "FZK"],
  ["Ferozepur", "FZR"],
  ["Gurdaspur", "GDP"],
  ["Hoshiarpur", "HSP"],
  ["Jalandhar", "JAL"],
  ["Kapurthala", "KPT"],
  ["Ludhiana", "LDH"],
  ["Malerkotla", "MLK"],
  ["Mansa", "MNS"],
  ["Moga", "MOG"],
  ["Pathankot", "PTK"],
  ["Patiala", "PTA"],
  ["Rupnagar", "RPN"],
  ["Sahibzada Ajit Singh Nagar", "SAS"],
  ["Sangrur", "SGR"],
  ["Shaheed Bhagat Singh Nagar", "SBS"],
  ["Sri Muktsar Sahib", "SMS"],
  ["Tarn Taran", "TNT"],
] as const;

const modulePermissions = {
  DASHBOARD: ["VIEW"],
  PROJECT: ["VIEW", "CREATE", "EDIT", "DELETE"],
  SECTION: [
    "FRONT_MATTER_EDIT",
    "CERTIFICATE_EDIT",
    "CHAPTERS_1_5_EDIT",
    "CHAPTERS_6_10_EDIT",
    "PLATES_EDIT",
    "CROSS_SECTIONS_EDIT",
    "REVIEW_ONLY",
  ],
  REPORT: ["VIEW", "GENERATE", "DOWNLOAD", "APPROVE"],
  USER: ["VIEW", "CREATE", "EDIT", "DELETE"],
  ROLE: ["VIEW", "CREATE"],
};

async function main() {
  console.log("Clearing old seed data...");
  await prisma.notification.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.replenishmentStudy.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.module.deleteMany();
  await prisma.district.deleteMany();
  await prisma.state.deleteMany();
  await prisma.systemSetting.deleteMany();

  const state = await prisma.state.create({ data: { name: "Punjab", code: "PB" } });

  const districts = await Promise.all(
    PUNJAB_DISTRICTS.map(([name, code]) => prisma.district.create({ data: { name, code, stateId: state.id } }))
  );

  const createdPermissions = new Map<string, bigint>();
  for (const [moduleName, permissions] of Object.entries(modulePermissions)) {
    const mod = await prisma.module.create({
      data: {
        name: moduleName,
        permissions: {
          create: permissions.map((permission) => ({
            action: `${moduleName}_${permission}`,
            description: `${moduleName} ${permission}`,
          })),
        },
      },
      include: { permissions: true },
    });
    for (const permission of mod.permissions) {
      createdPermissions.set(permission.action, permission.id);
    }
  }

  const allPermissionIds = Array.from(createdPermissions.values());
  await prisma.role.create({
    data: {
      name: "STATE_ADMIN",
      permissions: { create: allPermissionIds.map((permissionId) => ({ permissionId })) },
    },
  });

  const password = await bcrypt.hash("Gov@2026!Secure", 10);
  await prisma.user.create({
    data: {
      username: "state.admin",
      email: "state.admin@punjab.gov.in",
      password,
      fullName: "State Admin",
      role: "STATE_ADMIN",
      stateId: state.id,
      active: true,
    },
  });

  for (const district of districts) {
    await prisma.project.create({
      data: {
        projectName: `DSR ${district.name} 2026`,
        projectCode: `DSR-${district.code}-2026`,
        districtId: district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS,
      },
    });

    await prisma.project.create({
      data: {
        projectName: `Replenishment ${district.name} 2026`,
        projectCode: `REP-${district.code}-2026`,
        districtId: district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS,
      },
    });

  }

  await prisma.systemSetting.createMany({
    data: [
      { key: "notice_text", value: "Welcome to Smart DSR Portal" },
      { key: "announcements", value: "[]" },
    ],
    skipDuplicates: true,
  });

  console.log(`Seed complete: state.admin is the only user and STATE_ADMIN is the only role; ${districts.length} districts created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
