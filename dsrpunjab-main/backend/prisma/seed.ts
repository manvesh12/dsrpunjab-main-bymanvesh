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

const rolePermissionMap: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  STATE_ADMIN: ["*"],
  DISTRICT_ADMIN: ["DASHBOARD_VIEW", "PROJECT_VIEW", "REPORT_VIEW", "USER_VIEW"],
  OFFICER_1: [
    "DASHBOARD_VIEW",
    "PROJECT_VIEW",
    "PROJECT_EDIT",
    "SECTION_FRONT_MATTER_EDIT",
    "SECTION_CHAPTERS_1_5_EDIT",
  ],
  OFFICER_2: [
    "DASHBOARD_VIEW",
    "PROJECT_VIEW",
    "PROJECT_EDIT",
    "SECTION_CERTIFICATE_EDIT",
    "SECTION_CHAPTERS_1_5_EDIT",
  ],
  GEOLOGIST: [
    "DASHBOARD_VIEW",
    "PROJECT_VIEW",
    "PROJECT_EDIT",
    "SECTION_PLATES_EDIT",
    "SECTION_CROSS_SECTIONS_EDIT",
  ],
  REVIEWER: ["DASHBOARD_VIEW", "PROJECT_VIEW", "REPORT_VIEW", "REPORT_APPROVE", "SECTION_REVIEW_ONLY"],
  DATA_ENTRY_OPERATOR: ["DASHBOARD_VIEW", "PROJECT_VIEW", "PROJECT_EDIT", "SECTION_CHAPTERS_6_10_EDIT"],
  REPORT_GENERATOR: ["DASHBOARD_VIEW", "REPORT_VIEW", "REPORT_GENERATE", "REPORT_DOWNLOAD"],
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
  for (const [roleName, actions] of Object.entries(rolePermissionMap)) {
    const permissionIds = actions.includes("*")
      ? allPermissionIds
      : actions.map((action) => createdPermissions.get(action)).filter((id): id is bigint => Boolean(id));

    await prisma.role.create({
      data: {
        name: roleName,
        permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
      },
    });
  }

  const password = await bcrypt.hash("Gov@2026!Secure", 10);
  const createdUsers = [];

  createdUsers.push(await prisma.user.create({
    data: {
      username: "super.admin",
      email: "super.admin@punjab.gov.in",
      password,
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      stateId: state.id,
      active: true,
    },
  }));

  createdUsers.push(await prisma.user.create({
    data: {
      username: "state.admin",
      email: "state.admin@punjab.gov.in",
      password,
      fullName: "State Admin",
      role: "STATE_ADMIN",
      stateId: state.id,
      active: true,
    },
  }));

  for (const district of districts) {
    const code = district.code.toLowerCase();
    const districtUsers = [
      ["admin", "District Admin", "DISTRICT_ADMIN"],
      ["officer1", "Officer 1", "OFFICER_1"],
      ["officer2", "Officer 2", "OFFICER_2"],
      ["geologist", "Geologist", "GEOLOGIST"],
      ["reviewer", "Reviewer", "REVIEWER"],
      ["deo", "Data Entry Operator", "DATA_ENTRY_OPERATOR"],
      ["reportgen", "Report Generator", "REPORT_GENERATOR"],
    ] as const;

    for (const [usernamePrefix, displayRole, role] of districtUsers) {
      createdUsers.push(await prisma.user.create({
        data: {
          username: `${usernamePrefix}.${code}`,
          email: `${usernamePrefix}.${code}@punjab.gov.in`,
          password,
          fullName: `${displayRole} ${district.code}`,
          role,
          districtId: district.id,
          stateId: state.id,
          accessScope: district.name,
          active: true,
        },
      }));
    }

    const dsrProject = await prisma.project.create({
      data: {
        projectName: `DSR ${district.name} 2026`,
        projectCode: `DSR-${district.code}-2026`,
        districtId: district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS,
      },
    });

    const replenishmentProject = await prisma.project.create({
      data: {
        projectName: `Replenishment ${district.name} 2026`,
        projectCode: `REP-${district.code}-2026`,
        districtId: district.id,
        year: "2026",
        status: ProjectStatus.IN_PROGRESS,
      },
    });

    const usersForDistrict = createdUsers.filter((user) => String(user.districtId || "") === String(district.id));
    for (const user of usersForDistrict) {
      await prisma.projectMember.create({ data: { projectId: dsrProject.id, userId: user.id, role: user.role } });
      await prisma.projectMember.create({ data: { projectId: replenishmentProject.id, userId: user.id, role: user.role } });
    }
  }

  await prisma.systemSetting.createMany({
    data: [
      { key: "notice_text", value: "Welcome to Smart DSR Portal" },
      { key: "announcements", value: "[]" },
    ],
    skipDuplicates: true,
  });

  console.log(`Seed complete: ${createdUsers.length} users, ${districts.length} districts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
