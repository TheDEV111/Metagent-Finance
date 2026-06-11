import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import router from "./routes";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "16kb" }));

// 1 trade per 30 seconds per Bearer token (or IP as fallback)
const tradeLimiter = rateLimit({
  windowMs: 30_000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const h = req.headers.authorization;
    return h?.startsWith("Bearer ") ? h.slice(7, 39) : ipKeyGenerator(req.ip ?? "unknown");
  },
  message: { error: "Too many trade requests — please wait 30 seconds." },
});

const PORT = process.env.PORT || 3001;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/trade", tradeLimiter);
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
