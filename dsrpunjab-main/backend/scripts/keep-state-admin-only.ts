import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Gov@2026!Secure", 10);
  const stateAdmin = await prisma.$transaction(async (tx) => {
    const state = await tx.state.upsert({
      where: { code: "PB" },
      update: { name: "Punjab" },
      create: { code: "PB", name: "Punjab" },
    });
    const role = await tx.role.upsert({
      where: { name: "STATE_ADMIN" },
      update: {},
      create: { name: "STATE_ADMIN", description: "Full state administration access" },
    });
    const permissions = await tx.permission.findMany({ select: { id: true } });
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length) {
      await tx.rolePermission.createMany({
        data: permissions.map(({ id }) => ({ roleId: role.id, permissionId: id })),
        skipDuplicates: true,
      });
    }
    return tx.user.upsert({
      where: { username: "state.admin" },
      update: {
        email: "state.admin@punjab.gov.in",
        fullName: "State Admin",
        role: "STATE_ADMIN",
        stateId: state.id,
        districtId: null,
        active: true,
      },
      create: {
        username: "state.admin",
        email: "state.admin@punjab.gov.in",
        password,
        fullName: "State Admin",
        role: "STATE_ADMIN",
        stateId: state.id,
        active: true,
      },
      select: { id: true },
    });
  }, { maxWait: 10_000, timeout: 30_000 });

  const obsoleteUsers = await prisma.user.findMany({
    where: { id: { not: stateAdmin.id } },
    select: { id: true },
  });
  const obsoleteUserIds = obsoleteUsers.map(({ id }) => id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.invitation.deleteMany({
      where: {
        OR: [
          { role: { not: "STATE_ADMIN" } },
          ...(obsoleteUserIds.length ? [{ createdBy: { in: obsoleteUserIds } }] : []),
        ],
      },
    });
    if (obsoleteUserIds.length) {
      await tx.permissionHistory.deleteMany({
        where: { changedBy: { in: obsoleteUserIds } },
      });
    }
    const users = await tx.user.deleteMany({
      where: { id: { not: stateAdmin.id } },
    });
    const roles = await tx.role.deleteMany({
      where: { name: { not: "STATE_ADMIN" } },
    });
    await tx.user.update({
      where: { id: stateAdmin.id },
      data: { role: "STATE_ADMIN", districtId: null, active: true },
    });
    return { usersDeleted: users.count, rolesDeleted: roles.count };
  }, { maxWait: 10_000, timeout: 30_000 });

  console.log(JSON.stringify(result));
}

main()
  .finally(async () => prisma.$disconnect());
