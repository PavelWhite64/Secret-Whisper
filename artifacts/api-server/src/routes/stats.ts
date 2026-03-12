import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { whispersTable, globalStatsTable } from "@workspace/db";
import { gt, count } from "drizzle-orm";
import { ensureGlobalStats } from "../lib/cleanup";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  await ensureGlobalStats();
  const now = new Date();

  const [stats] = await db.select().from(globalStatsTable).limit(1);
  const [{ value: alive }] = await db
    .select({ value: count() })
    .from(whispersTable)
    .where(gt(whispersTable.expiresAt, now));

  res.json({
    totalDied: stats?.totalDied ?? 0,
    totalAlive: Number(alive),
    totalCreated: stats?.totalCreated ?? 0,
  });
});

export default router;
