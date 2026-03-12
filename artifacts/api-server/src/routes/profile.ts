import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, whispersTable, repliesTable } from "@workspace/db";
import { eq, gt, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }

  const now = new Date();
  const whispers = await db
    .select()
    .from(whispersTable)
    .where(eq(whispersTable.userId, userId))
    .orderBy(desc(whispersTable.createdAt));

  const activeWhispers = whispers.filter(w => w.expiresAt > now);

  const formatted = await Promise.all(activeWhispers.map(async w => {
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
      isOwn: true,
      replyCount: Number(replyCount),
    };
  }));

  res.json({
    user: { id: user.id, username: user.username, coins: user.coins },
    whispers: formatted,
    stats: {
      totalCreated: user.totalWhispersCreated,
      totalDied: user.totalWhispersDied,
      totalReactionsReceived: user.totalReactionsReceived,
    },
  });
});

export default router;
