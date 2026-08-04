import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const rupnagar = await prisma.district.findFirst({ where: { name: { equals: "Rupnagar", mode: "insensitive" } } });
  if (!rupnagar) throw new Error("Rupnagar district is not configured.");

  const [kept, removable] = await Promise.all([
    prisma.project.count({ where: { districtId: rupnagar.id } }),
    prisma.project.count({ where: { OR: [{ districtId: null }, { districtId: { not: rupnagar.id } }] } }),
  ]);

  if (process.argv.includes("--apply")) {
    const deleted = await prisma.project.deleteMany({
      where: { OR: [{ districtId: null }, { districtId: { not: rupnagar.id } }] },
    });
    console.log(JSON.stringify({ rupnagarProjectsKept: kept, otherProjectsDeleted: deleted.count }));
  } else {
    console.log(JSON.stringify({ rupnagarProjects: kept, otherProjects: removable, mode: "preview" }));
  }
} finally {
  await prisma.$disconnect();
}
