import { db } from "@workspace/db";
import { whispersTable, globalStatsTable, usersTable } from "@workspace/db";
import { lt, sql } from "drizzle-orm";

export async function cleanupExpiredWhispers() {
  const now = new Date();

  const expired = await db
    .select({ id: whispersTable.id, userId: whispersTable.userId })
    .from(whispersTable)
    .where(lt(whispersTable.expiresAt, now));

  if (expired.length === 0) return 0;

  for (const w of expired) {
    if (w.userId) {
      await db
        .update(usersTable)
        .set({ totalWhispersDied: sql`total_whispers_died + 1` })
        .where(sql`id = ${w.userId}`);
    }
  }

  const count = expired.length;

  await db
    .delete(whispersTable)
    .where(lt(whispersTable.expiresAt, now));

  await db
    .insert(globalStatsTable)
    .values({ id: 1, totalDied: count, totalCreated: 0 })
    .onConflictDoUpdate({
      target: globalStatsTable.id,
      set: { totalDied: sql`global_stats.total_died + ${count}` },
    });

  return count;
}

export async function ensureGlobalStats() {
  await db
    .insert(globalStatsTable)
    .values({ id: 1, totalDied: 0, totalCreated: 0 })
    .onConflictDoNothing();
}
