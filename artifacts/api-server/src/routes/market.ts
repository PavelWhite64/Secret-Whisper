import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, whispersTable, globalStatsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const MINUTES_PER_COIN = 15;

router.post("/extend/:id", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }

  const coins = parseInt(req.body?.coins);
  if (!coins || isNaN(coins) || coins < 1 || coins > 500) {
    res.status(400).json({ error: "Укажите количество монет от 1 до 500" });
    return;
  }

  const now = new Date();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }

  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже умер" });
    return;
  }

  if (user.coins < coins) {
    res.status(400).json({ error: `Недостаточно монет. Нужно ${coins}, есть ${user.coins}` });
    return;
  }

  const minutesAdded = coins * MINUTES_PER_COIN;
  const newExpiresAt = new Date(whisper.expiresAt.getTime() + minutesAdded * 60 * 1000);
  const newCoins = user.coins - coins;

  await db.update(whispersTable).set({ expiresAt: newExpiresAt }).where(eq(whispersTable.id, id));
  await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, userId));

  const hoursAdded = minutesAdded >= 60
    ? `${Math.floor(minutesAdded / 60)}ч ${minutesAdded % 60}мин`
    : `${minutesAdded} мин`;

  res.json({
    success: true,
    coinsSpent: coins,
    coinsRemaining: newCoins,
    newExpiresAt: newExpiresAt.toISOString(),
    message: `Шёпот защищён +${hoursAdded}. Потрачено ${coins} 🪙.`,
  });
});

router.post("/kill/:id", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Шёпот не найден" }); return; }

  const coins = parseInt(req.body?.coins ?? "0");
  if (isNaN(coins) || coins < 0 || coins > 500) {
    res.status(400).json({ error: "Укажите количество монет от 0 до 500" });
    return;
  }

  const now = new Date();
  const [whisper] = await db.select().from(whispersTable).where(eq(whispersTable.id, id)).limit(1);
  if (!whisper || whisper.expiresAt < now) {
    res.status(404).json({ error: "Шёпот не найден или уже умер" });
    return;
  }

  const isOwn = whisper.userId === userId;

  if (!isOwn && coins < 1) {
    res.status(400).json({ error: "Нужно потратить минимум 1 монету чтобы проклясть чужой шёпот" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }

  if (user.coins < coins) {
    res.status(400).json({ error: `Недостаточно монет. Нужно ${coins}, есть ${user.coins}` });
    return;
  }

  const minutesRemoved = coins * MINUTES_PER_COIN;
  const newExpiresAt = new Date(whisper.expiresAt.getTime() - minutesRemoved * 60 * 1000);
  const isDead = newExpiresAt <= now || (isOwn && coins === 0);

  const newCoins = user.coins - coins;
  if (coins > 0) {
    await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, userId));
  }

  if (isDead) {
    await db.delete(whispersTable).where(eq(whispersTable.id, id));
    await db.update(globalStatsTable)
      .set({ totalDied: sql`total_died + 1` })
      .where(eq(globalStatsTable.id, 1));

    if (whisper.userId) {
      await db.update(usersTable)
        .set({ totalDied: sql`total_died + 1` })
        .where(eq(usersTable.id, whisper.userId));
    }

    return res.json({
      success: true,
      coinsSpent: coins,
      coinsRemaining: newCoins,
      newExpiresAt: null,
      message: isOwn ? "Ваш шёпот убит навсегда." : `Шёпот проклят и умер! Потрачено ${coins} 🪙.`,
    });
  }

  await db.update(whispersTable).set({ expiresAt: newExpiresAt }).where(eq(whispersTable.id, id));

  const minutesStr = minutesRemoved >= 60
    ? `${Math.floor(minutesRemoved / 60)}ч ${minutesRemoved % 60}мин`
    : `${minutesRemoved} мин`;

  res.json({
    success: true,
    coinsSpent: coins,
    coinsRemaining: newCoins,
    newExpiresAt: newExpiresAt.toISOString(),
    message: `Шёпот проклят -${minutesStr}. Потрачено ${coins} 🪙.`,
  });
});

export default router;
