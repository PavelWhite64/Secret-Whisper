import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { whispersTable } from "@workspace/db";
import { eq, gt, desc, sql } from "drizzle-orm";
import {
  CreateWhisperBody,
  GetWhispersQueryParams,
  ReactToWhisperBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getExpiresAt(lifetime: string): Date {
  const now = new Date();
  switch (lifetime) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function formatWhisper(w: typeof whispersTable.$inferSelect, userId?: number) {
  return {
    id: String(w.id),
    content: w.content,
    lifetime: w.lifetime,
    expiresAt: w.expiresAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    reactions: {
      fire: w.reactionFire,
      heart: w.reactionHeart,
      wow: w.reactionWow,
    },
    isOwn: userId !== undefined && w.userId === userId,
  };
}

router.get("/", async (req, res) => {
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

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(whispersTable)
    .where(gt(whispersTable.expiresAt, now));

  res.json({
    whispers: whispers.map((w) => formatWhisper(w, userId)),
    total: count,
    page,
    hasMore: offset + whispers.length < count,
  });
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
    .values({
      content,
      lifetime,
      expiresAt,
      userId: userId ?? null,
    })
    .returning();

  res.status(201).json(formatWhisper(whisper, userId));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Шёпот не найден" });
    return;
  }
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const now = new Date();

  const [whisper] = await db
    .select()
    .from(whispersTable)
    .where(eq(whispersTable.id, id))
    .limit(1);

  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже исчез" });
    return;
  }

  res.json(formatWhisper(whisper, userId));
});

router.post("/:id/react", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(404).json({ error: "Шёпот не найден" });
    return;
  }
  const parsed = ReactToWhisperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверный тип реакции" });
    return;
  }
  const { type } = parsed.data;
  const now = new Date();

  const [whisper] = await db
    .select()
    .from(whispersTable)
    .where(eq(whispersTable.id, id))
    .limit(1);

  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже исчез" });
    return;
  }

  const updates: Partial<typeof whispersTable.$inferInsert> = {};
  if (type === "fire") updates.reactionFire = whisper.reactionFire + 1;
  if (type === "heart") updates.reactionHeart = whisper.reactionHeart + 1;
  if (type === "wow") updates.reactionWow = whisper.reactionWow + 1;

  const [updated] = await db
    .update(whispersTable)
    .set(updates)
    .where(eq(whispersTable.id, id))
    .returning();

  res.json({
    reactions: {
      fire: updated.reactionFire,
      heart: updated.reactionHeart,
      wow: updated.reactionWow,
    },
  });
});

export default router;
