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

  const permissionIds = (actions: string[]) =>
    actions
      .map((action) => createdPermissions.get(action))
      .filter((permissionId): permissionId is bigint => permissionId !== undefined);

  const rolePermissions = {
    STATE_ADMIN: Array.from(createdPermissions.keys()),
    DMO: [
      "DASHBOARD_VIEW",
      "PROJECT_VIEW",
      "PROJECT_CREATE",
      "PROJECT_EDIT",
      "REPORT_VIEW",
      "REPORT_GENERATE",
      "REPORT_DOWNLOAD",
    ],
    COE_SENSRS: [
      "DASHBOARD_VIEW",
      "PROJECT_VIEW",
      "PROJECT_EDIT",
      "SECTION_FRONT_MATTER_EDIT",
      "SECTION_CERTIFICATE_EDIT",
      "SECTION_CHAPTERS_1_5_EDIT",
      "SECTION_CHAPTERS_6_10_EDIT",
      "SECTION_PLATES_EDIT",
      "SECTION_CROSS_SECTIONS_EDIT",
      "REPORT_VIEW",
      "REPORT_GENERATE",
      "REPORT_DOWNLOAD",
    ],
    REVIEWER: [
      "DASHBOARD_VIEW",
      "PROJECT_VIEW",
      "SECTION_REVIEW_ONLY",
      "REPORT_VIEW",
      "REPORT_APPROVE",
    ],
    HEAD_OFFICE: [
      "DASHBOARD_VIEW",
      "PROJECT_VIEW",
      "SECTION_REVIEW_ONLY",
      "REPORT_VIEW",
      "REPORT_GENERATE",
      "REPORT_DOWNLOAD",
      "REPORT_APPROVE",
    ],
  } as const;

  await Promise.all(
    Object.entries(rolePermissions).map(([name, actions]) =>
      prisma.role.create({
        data: {
          name,
          permissions: {
            create: permissionIds([...actions]).map((permissionId) => ({ permissionId })),
          },
        },
      })
    )
  );

  const password = await bcrypt.hash("Gov@2026!Secure", 10);
  await prisma.user.create({
    data: {
      username: "state.admin",
      email: "manvesh.sv@gmail.com",
      password,
      fullName: "State Admin",
      role: "STATE_ADMIN",
      stateId: state.id,
      active: true,
    },
  });

  const jalandhar = districts.find((district) => district.code === "JAL");
  if (!jalandhar) throw new Error("Jalandhar district was not created.");

  await prisma.user.createMany({
    data: [
      {
        username: "dmo.jalandhar",
        email: "dmo.jalandhar@punjab.gov.in",
        password,
        fullName: "DMO Jalandhar",
        role: "DMO",
        stateId: state.id,
        districtId: jalandhar.id,
        active: true,
      },
      {
        username: "coe.sensrs",
        email: "coe.sensrs@punjab.gov.in",
        password,
        fullName: "COE SENSRS",
        role: "COE_SENSRS",
        stateId: state.id,
        districtId: jalandhar.id,
        active: true,
      },
      {
        username: "reviewer.dsr",
        email: "reviewer.dsr@punjab.gov.in",
        password,
        fullName: "DSR Reviewer",
        role: "REVIEWER",
        stateId: state.id,
        districtId: jalandhar.id,
        active: true,
      },
      {
        username: "head.office",
        email: "head.office@punjab.gov.in",
        password,
        fullName: "Head Office",
        role: "HEAD_OFFICE",
        stateId: state.id,
        active: true,
      },
    ],
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

  console.log(
    `Seed complete: 5 users and ${Object.keys(rolePermissions).length} roles; ${districts.length} districts created.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
