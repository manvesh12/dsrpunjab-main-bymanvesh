const fs = require("node:fs/promises");
const path = require("node:path");

async function removeLocalUploads() {
  const uploadsDirectory = path.resolve("uploads");
  await fs.rm(uploadsDirectory, { recursive: true, force: true });
  await fs.mkdir(uploadsDirectory, { recursive: true });
}

async function main() {
  let PrismaClient;
  try {
    PrismaClient = require("@prisma/client").PrismaClient;
  } catch {
    console.warn("Prisma client is not installed. Skipping database cleanup.");
    await removeLocalUploads();
    console.log("Local uploads folder cleared: uploads");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const [dsrFiles, replenishmentFiles, modelDsrFiles] = await prisma.$transaction([
      prisma.dsrFile.deleteMany(),
      prisma.replenishmentFile.deleteMany(),
      prisma.modelDsrFile.deleteMany(),
    ]);

    await removeLocalUploads();

    console.log("Uploaded file cleanup complete");
    console.log(`DsrFile records deleted: ${dsrFiles.count}`);
    console.log(`ReplenishmentFile records deleted: ${replenishmentFiles.count}`);
    console.log(`ModelDsrFile records deleted: ${modelDsrFiles.count}`);
    console.log("Local uploads folder cleared: uploads");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Uploaded file cleanup failed", error);
  process.exitCode = 1;
});
