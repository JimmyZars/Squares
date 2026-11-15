require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  rateLimit = require("express-rate-limit"),
  mongoose = require("mongoose");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(","),
  }),
);
app.use(express.json({ limit: "12kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/pools", require("./routes/Pools"));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in server/.env");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(process.env.PORT || 5000, () =>
      console.log(
        "Gridiron API listening on port " + (process.env.PORT || 5000),
      ),
    ),
  )
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
