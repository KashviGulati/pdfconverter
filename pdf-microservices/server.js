const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cron = require("node-cron");
const https = require("https");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const libreOfficePath = "soffice"; // change in docker if needed

// ================= HEALTH ROUTE (NO API KEY) =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date(),
  });
});

// ================= CORS =================
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "https://www.docuvio.co.in",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow mobile apps (no origin)
  if (!origin) {
    return next();
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Blocked by CORS" });
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ================= API KEY =================
app.use((req, res, next) => {
  // Skip API key for health check
  if (req.path === "/health") return next();

  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  next();
});

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// ================= CONVERT ROUTE =================
app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file" });

  const inputPath = req.file.path;
  const outputDir = path.resolve("output");

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const command = `${libreOfficePath} --headless --invisible --nocrashreport --nodefault --nolockcheck --nofirststartwizard --convert-to pdf:writer_pdf_Export "${inputPath}" --outdir "${outputDir}"`;

  exec(command, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Conversion failed" });
    }

    const pdfName = path.parse(req.file.filename).name + ".pdf";
    const pdfPath = path.join(outputDir, pdfName);

    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: "PDF not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);

    stream.on("end", () => {
      console.log("Stream finished, cleaning up");

      setTimeout(() => {
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(pdfPath);
        } catch (e) {
          console.error("Cleanup error", e);
        }
      }, 2000);
    });
  });
});

// ================= CRON SELF-PING =================
const SELF_URL = "https://your-render-url.onrender.com/health";

cron.schedule("*/10 * * * *", () => {
  console.log("Pinging self to stay awake...");

  https
    .get(SELF_URL, (res) => {
      console.log("Ping status:", res.statusCode);
    })
    .on("error", (err) => {
      console.error("Ping failed:", err.message);
    });
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});