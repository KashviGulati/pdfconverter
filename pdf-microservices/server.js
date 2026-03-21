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

// ⚠️ LibreOffice path (Windows)
const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

// ================= SECURITY =================
app.use(cors({
  origin: "http://localhost:3000"
}));

app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== "mysecretkey") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
});

// ================= MULTER =================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ================= ROUTE =================
app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const inputPath = req.file.path;
  const outputDir = path.resolve("output");

  // Ensure output folder exists
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

    // Send PDF
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

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("PDF Conversion Service Running 🚀");
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});