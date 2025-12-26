import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { paintingsRouter } from "./routes/paintings.js";
import { cloudinaryRouter } from "./routes/cloudinary.js";

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// CORS
const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : true,
    credentials: true
  })
);

// Rate-limit auth a bit
app.use("/api/auth", rateLimit({ windowMs: 60_000, max: 30 }));

// DB connection per request (cached in db.js)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

// Health + root
app.get("/", (req, res) => res.json({ ok: true, name: "museum-api" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/paintings", paintingsRouter);
app.use("/api/cloudinary", cloudinaryRouter);

// Error handler LAST
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

export default app;
