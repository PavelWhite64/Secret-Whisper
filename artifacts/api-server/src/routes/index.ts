import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import whispersRouter from "./whispers";
import repliesRouter from "./replies";
import statsRouter from "./stats";
import profileRouter from "./profile";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/whispers", whispersRouter);
router.use("/whispers/:id/replies", repliesRouter);
router.use("/stats", statsRouter);
router.use("/profile", profileRouter);
router.use("/market", marketRouter);

export default router;
