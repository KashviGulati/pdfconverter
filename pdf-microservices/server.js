const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ================= CONFIG =================
const PORT = process.env.PORT || 5000;

const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

// ================= STRICT CORS =================

// 🔥 Only allow these origins
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "https://www.docuvio.co.in/"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // ❌ Block if no origin (Postman, curl, etc.)
  if (!origin) {
    return res.status(403).json({ message: "Blocked: No origin" });
  }

  // ❌ Block if origin not allowed
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Blocked by CORS" });
  }

  // ✅ Manually set headers
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ================= API KEY =================

app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  next();
});

// ================= MULTER =================

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Allowed file types
const allowedTypes = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain"
];

// ================= ROUTE =================

app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // File validation
  if (!allowedTypes.includes(req.file.mimetype)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Unsupported file type" });
  }

  const inputPath = req.file.path;
  const outputDir = path.resolve("output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const command = `${libreOfficePath} --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

  exec(command, (err) => {
    if (err) {
      console.error("Conversion error:", err);
      return res.status(500).json({ message: "Conversion failed" });
    }

    const pdfName = path.parse(req.file.filename).name + ".pdf";
    const pdfPath = path.join(outputDir, pdfName);

    res.download(pdfPath, (downloadErr) => {
      if (downloadErr) {
        console.error("Download error:", downloadErr);
      }

      // Cleanup
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    });
  });
});

// ================= HEALTH =================

app.get("/", (req, res) => {
  res.send("PDF Microservice Running 🚀");
});

// ================= START =================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});