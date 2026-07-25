import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stateAdmin = await prisma.user.findUnique({
    where: { username: "state.admin" },
    select: { id: true },
  });

  if (!stateAdmin) {
    throw new Error("state.admin does not exist; refusing to delete any user.");
  }

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
  });

  console.log(JSON.stringify(result));
}

main()
  .finally(async () => prisma.$disconnect());
