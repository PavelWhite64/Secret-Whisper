import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Неверные данные" }); return; }
  const { username, password } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "Имя пользователя уже занято" }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash }).returning();
  (req.session as Record<string, unknown>).userId = user.id;
  res.status(201).json({ user: { id: user.id, username: user.username, coins: user.coins } });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Неверные данные" }); return; }
  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(401).json({ error: "Неверный логин или пароль" }); return; }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Неверный логин или пароль" }); return; }
  (req.session as Record<string, unknown>).userId = user.id;
  res.json({ user: { id: user.id, username: user.username, coins: user.coins } });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => { res.json({ success: true }); });
});

router.get("/me", async (req, res) => {
  const userId = (req.session as Record<string, unknown>).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Не авторизован" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Не авторизован" }); return; }
  res.json({ id: user.id, username: user.username, coins: user.coins });
});

export default router;
