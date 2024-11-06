import express from "express";
import { downloadPath, serverLog, uploadPath } from "./config.js";
import { mergeFiles, stage1, stage2, stage3 } from "./handler/handler.js";

const router = express.Router();

router.post("/upload/:name", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No files were uploaded." });
  }
  const fileNmae = req.params.name;
  const uploadedFile = req.files.file;
  uploadedFile.mv(uploadPath(fileNmae), (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json({ message: "File uploaded successfully" });
  });
});

router.get("/download/:name", async (req, res) => {
  try {
    const fileNmae = req.params.name;
    const { tab, index } = req.query;

    if (tab === "1") await stage1();
    if (tab === "2") await stage2();
    if (tab === "3") await stage3();
    if (tab === "0") await mergeFiles(index);
    res.download(downloadPath(fileNmae));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
