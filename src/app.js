import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { paintingsRouter } from "./routes/paintings.js";
import { cloudinaryRouter } from "./routes/cloudinary.js";


export const app = express();

// Security basics
app.use(helmet());
app.use(cookieParser());

// JSON body
app.use(express.json({ limit: "1mb" }));

// CORS (we'll tighten this later when we know final domains)
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

// Rate limit auth routes (basic protection)
app.use(
  "/api/auth",
  rateLimit({ windowMs: 60_000, max: 30 })
);

// Ensure DB connected for every request (cached connection)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/paintings", paintingsRouter);
app.use("/api/cloudinary", cloudinaryRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});



