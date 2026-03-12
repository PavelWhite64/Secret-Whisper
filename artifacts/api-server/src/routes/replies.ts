import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { repliesTable, whispersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateReplyBody } from "@workspace/api-zod";

const router: IRouter = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  const now = new Date();

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже исчез" });
    return;
  }

  const replies = await db
    .select()
    .from(repliesTable)
    .where(eq(repliesTable.whisperId, id))
    .orderBy(asc(repliesTable.createdAt));

  res.json({
    replies: replies.map(r => ({
      id: String(r.id),
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      isOwn: userId !== undefined && r.userId === userId,
    })),
  });
});

router.post("/", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }
  const parsed = CreateReplyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Неверные данные" }); return; }

  const now = new Date();
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже умер" });
    return;
  }

  const [reply] = await db
    .insert(repliesTable)
    .values({ whisperId: id, content: parsed.data.content, userId: userId ?? null })
    .returning();

  res.status(201).json({
    id: String(reply.id),
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
    isOwn: userId !== undefined && reply.userId === userId,
  });
});

export default router;
