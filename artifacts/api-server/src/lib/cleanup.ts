import { db } from "@workspace/db";
import { whispersTable, globalStatsTable, usersTable } from "@workspace/db";
import { lt, sql } from "drizzle-orm";

function survivalBonus(reactions: number, lifetime: string): number {
  if (reactions < 3) return 0;
  const base = reactions >= 10 ? 10 : reactions >= 5 ? 5 : 3;
  if (lifetime === "1h") return base * 2;
  if (lifetime === "24h") return base;
  return Math.floor(base / 2);
}

export async function cleanupExpiredWhispers() {
  const now = new Date();

  const expired = await db
    .select()
    .from(whispersTable)
    .where(lt(whispersTable.expiresAt, now));

  if (expired.length === 0) return 0;

  for (const w of expired) {
    if (w.userId) {
      const totalReactions = w.reactionFire + w.reactionHeart + w.reactionWow;
      const bonus = survivalBonus(totalReactions, w.lifetime);

      await db
        .update(usersTable)
        .set({
          totalWhispersDied: sql`total_whispers_died + 1`,
          ...(bonus > 0 ? { coins: sql`coins + ${bonus}` } : {}),
        })
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
