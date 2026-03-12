import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { whispersTable, repliesTable, usersTable, globalStatsTable } from "@workspace/db";
import { eq, gt, desc, sql, count } from "drizzle-orm";
import {
  CreateWhisperBody,
  GetWhispersQueryParams,
  GetTopWhispersQueryParams,
  ReactToWhisperBody,
} from "@workspace/api-zod";
import { cleanupExpiredWhispers, ensureGlobalStats } from "../lib/cleanup";

const router: IRouter = Router();

function getExpiresAt(lifetime: string): Date {
  const now = new Date();
  switch (lifetime) {
    case "1h": return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h": return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

async function formatWhisper(w: typeof whispersTable.$inferSelect, userId?: number) {
  const [{ value: replyCount }] = await db
    .select({ value: count() })
    .from(repliesTable)
    .where(eq(repliesTable.whisperId, w.id));
  return {
    id: String(w.id),
    content: w.content,
    lifetime: w.lifetime,
    expiresAt: w.expiresAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    reactions: { fire: w.reactionFire, heart: w.reactionHeart, wow: w.reactionWow },
    isOwn: userId !== undefined && w.userId === userId,
    replyCount: Number(replyCount),
  };
}

router.get("/top", async (req, res) => {
  await cleanupExpiredWhispers();
  const parsed = GetTopWhispersQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const now = new Date();

  const whispers = await db
    .select()
    .from(whispersTable)
    .where(gt(whispersTable.expiresAt, now))
    .orderBy(desc(sql`reaction_fire + reaction_heart + reaction_wow`))
    .limit(limit);

  const formatted = await Promise.all(whispers.map(w => formatWhisper(w, userId)));
  res.json({ whispers: formatted, total: formatted.length, page: 1, hasMore: false });
});

router.get("/", async (req, res) => {
  await cleanupExpiredWhispers();
  const parsed = GetWhispersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const now = new Date();

  const whispers = await db
    .select()
    .from(whispersTable)
    .where(gt(whispersTable.expiresAt, now))
    .orderBy(desc(whispersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(whispersTable)
    .where(gt(whispersTable.expiresAt, now));

  const formatted = await Promise.all(whispers.map(w => formatWhisper(w, userId)));
  res.json({ whispers: formatted, total: Number(total), page, hasMore: offset + whispers.length < Number(total) });
});

router.post("/", async (req, res) => {
  const parsed = CreateWhisperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const { content, lifetime } = parsed.data;
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const expiresAt = getExpiresAt(lifetime);

  const [whisper] = await db
    .insert(whispersTable)
    .values({ content, lifetime, expiresAt, userId: userId ?? null })
    .returning();

  if (userId) {
    await db
      .update(usersTable)
      .set({ totalWhispersCreated: sql`total_whispers_created + 1` })
      .where(eq(usersTable.id, userId));
  }

  await ensureGlobalStats();
  await db
    .update(globalStatsTable)
    .set({ totalCreated: sql`total_created + 1` })
    .where(eq(globalStatsTable.id, 1));

  res.status(201).json(await formatWhisper(whisper, userId));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const now = new Date();

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже исчез" });
    return;
  }
  res.json(await formatWhisper(whisper, userId));
});

router.post("/:id/react", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }
  const parsed = ReactToWhisperBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Неверный тип реакции" }); return; }

  const { type } = parsed.data;
  const now = new Date();
  const reactorUserId = (req.session as Record<string, unknown>).userId as number | undefined;

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже исчез" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (type === "fire") updates.reactionFire = whisper.reactionFire + 1;
  if (type === "heart") updates.reactionHeart = whisper.reactionHeart + 1;
  if (type === "wow") updates.reactionWow = whisper.reactionWow + 1;

  const [updated] = await db
    .update(whispersTable)
    .set(updates as Parameters<typeof db.update>[0])
    .where(eq(whispersTable.id, id))
    .returning();

  if (whisper.userId && whisper.userId !== reactorUserId) {
    await db
      .update(usersTable)
      .set({
        coins: sql`coins + 1`,
        totalReactionsReceived: sql`total_reactions_received + 1`,
      })
      .where(eq(usersTable.id, whisper.userId));
  }

  let coinsUpdated: number | undefined;
  if (reactorUserId) {
    const [me] = await db.select({ coins: usersTable.coins }).from(usersTable).where(eq(usersTable.id, reactorUserId)).limit(1);
    coinsUpdated = me?.coins;
  }

  res.json({
    reactions: { fire: updated.reactionFire, heart: updated.reactionHeart, wow: updated.reactionWow },
    coins: coinsUpdated,
  });
});

export default router;
