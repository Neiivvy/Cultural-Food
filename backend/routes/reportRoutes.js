import { Router } from "express";
import protect    from "../middleware/authMiddleware.js";
import adminOnly  from "../middleware/adminMiddleware.js";
import {
  submitReport,
  getReports,
  dismissReport,
  deleteReportedContent,
} from "../controllers/reportController.js";

const router = Router();

/* User-facing */
router.post("/", protect, submitReport);

/* Admin-facing */
router.get("/",           protect, adminOnly, getReports);
router.put("/:id",        protect, adminOnly, dismissReport);
router.delete("/:id",     protect, adminOnly, deleteReportedContent);

export default router;