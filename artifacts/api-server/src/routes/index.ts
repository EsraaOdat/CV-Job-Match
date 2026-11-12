import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import matchRouter from "./match";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(matchRouter);

export default router;
