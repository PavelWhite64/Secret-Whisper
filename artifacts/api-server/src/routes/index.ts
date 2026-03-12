import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import whispersRouter from "./whispers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/whispers", whispersRouter);

export default router;
