import bcrypt from "bcryptjs";
import { logger } from "../common/logging/logger.js";
import { prisma } from "../database/prisma.client.js";

const DEFAULT_AUTHORITY_PASSWORD = "Gov@2026!Secure";

const RUPNAGAR_AUTHORITIES = [
  {
    username: "dmo.rupnagar",
    email: "dmo.rupnagar@punjab.gov.in",
    fullName: "District Mining Officer Rupnagar",
    role: "DMO",
  },
  {
    username: "coe.rupnagar",
    email: "coe.rupnagar@punjab.gov.in",
    fullName: "COE SEnSRS Rupnagar",
    role: "COE_SENSRS",
  },
  {
    username: "reviewer.rupnagar",
    email: "reviewer.rupnagar@punjab.gov.in",
    fullName: "Government Reviewer Rupnagar",
    role: "REVIEWER",
  },
  {
    username: "head.office.rupnagar",
    email: "head.office.rupnagar@punjab.gov.in",
    fullName: "Head Office Authority Rupnagar",
    role: "HEAD_OFFICE",
  },
] as const;

/**
 * Keep the public Rupnagar demo credentials usable without running the
 * destructive full seed on every production deployment.
 */
export async function ensureRupnagarAuthorityAccounts() {
  const state = await prisma.state.findFirst({ where: { OR: [{ code: "PB" }, { name: "Punjab" }] } });
  if (!state) throw new Error("Punjab state is missing; cannot provision Rupnagar authority accounts.");

  const district = await prisma.district.upsert({
    where: { code: "RPN" },
    create: { name: "Rupnagar", code: "RPN", stateId: state.id },
    update: { name: "Rupnagar", stateId: state.id },
  });

  const password = await bcrypt.hash(DEFAULT_AUTHORITY_PASSWORD, 10);
  await prisma.$transaction(
    RUPNAGAR_AUTHORITIES.map((account) =>
      prisma.user.upsert({
        where: { username: account.username },
        create: {
          ...account,
          password,
          stateId: state.id,
          districtId: district.id,
          accessScope: "Rupnagar District",
          active: true,
        },
        update: {
          email: account.email,
          fullName: account.fullName,
          role: account.role,
          password,
          stateId: state.id,
          districtId: district.id,
          accessScope: "Rupnagar District",
          active: true,
        },
      })
    )
  );

  logger.info("rupnagar_authority_accounts_ready", { count: RUPNAGAR_AUTHORITIES.length });
}
