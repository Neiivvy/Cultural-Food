import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes     from "./routes/authRoutes.js";
import userRoutes     from "./routes/userRoutes.js";
import postRoutes     from "./routes/postRoutes.js";
import commentRoutes  from "./routes/commentRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import answerRoutes   from "./routes/answerRoutes.js";
import cultureRoutes       from "./routes/cultureRoutes.js";
import notificationRoutes  from "./routes/notificationRoutes.js";
import foodRoutes           from "./routes/foodRoutes.js";
import adminRoutes          from "./routes/adminRoutes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ─────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/posts",     postRoutes);
app.use("/api/comments",  commentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers",   answerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cultures",  cultureRoutes);
app.use("/api/foods",     foodRoutes);
app.use("/api/admin",     adminRoutes);

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "Server is running 🚀" })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found." })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);