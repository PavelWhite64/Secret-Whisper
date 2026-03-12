import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, whispersTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import { ExtendWhisperBody } from "@workspace/api-zod";

const router: IRouter = Router();

const EXTEND_COST_PER_HOUR = 5;
const KILL_COST = 20;

router.post("/extend/:id", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }

  const parsed = ExtendWhisperBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Укажите количество часов (1-24)" }); return; }

  const { hours } = parsed.data;
  const cost = hours * EXTEND_COST_PER_HOUR;
  const now = new Date();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }

  const isOwnWhisper = await db.select().from(whispersTable)
    .where(eq(whispersTable.id, id)).limit(1)
    .then(r => r[0]?.userId === userId);

  const effectiveCost = isOwnWhisper ? 0 : cost;

  if (user.coins < effectiveCost) {
    res.status(400).json({ error: `Недостаточно монет. Нужно ${effectiveCost}, есть ${user.coins}` });
    return;
  }

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже умер" });
    return;
  }

  const newExpiresAt = new Date(whisper.expiresAt.getTime() + hours * 60 * 60 * 1000);

  await db.update(whispersTable).set({ expiresAt: newExpiresAt }).where(eq(whispersTable.id, id));

  const newCoins = user.coins - effectiveCost;
  if (effectiveCost > 0) {
    await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, userId));
  }

  res.json({
    success: true,
    coinsSpent: effectiveCost,
    coinsRemaining: newCoins,
    newExpiresAt: newExpiresAt.toISOString(),
    message: `Шёпот продлён на ${hours}ч. Потрачено ${effectiveCost} монет.`,
  });
});

router.post("/kill/:id", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }

  const now = new Date();
  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже умер" });
    return;
  }

  const isOwn = whisper.userId === userId;
  const cost = isOwn ? 0 : KILL_COST;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }
  if (user.coins < cost) {
    res.status(400).json({ error: `Недостаточно монет. Нужно ${cost}, есть ${user.coins}` });
    return;
  }

  const killsAt = new Date(now.getTime() + 5 * 1000);
  await db.update(whispersTable).set({ expiresAt: killsAt }).where(eq(whispersTable.id, id));

  const newCoins = user.coins - cost;
  if (cost > 0) {
    await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, userId));
  }

  res.json({
    success: true,
    coinsSpent: cost,
    coinsRemaining: newCoins,
    message: isOwn ? "Ваш шёпот умрёт через 5 секунд." : `Шёпот приговорён! Потрачено ${cost} монет.`,
  });
});

export default router;
