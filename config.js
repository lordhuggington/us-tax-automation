import fs from "fs";
import path from "path";
import morgan from "morgan";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const date = () =>
  new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

morgan.token("custom-date", date);
morgan.token("remote-addr", (req) => (req.ip.includes("::ffff:") ? req.ip.split("::ffff:")[1] : req.ip));

export const publicDir = path.join(__dirname, "public");
export const indexDir = path.join(__dirname, "public", "index.html");

export const uploadDir = path.join(__dirname, "assets/upload");
export const downloadDir = path.join(__dirname, "assets/download");
export const templateDir = path.join(__dirname, "assets/template");

export const uploadPath = (fileNmae) => path.join(__dirname, "assets/upload", fileNmae);
export const downloadPath = (fileNmae) => path.join(__dirname, "assets/download", fileNmae);

export const accessLogPath = path.join(__dirname, "access.log");
export const serverLogPath = path.join(__dirname, "server.log");

export const accessStream = fs.createWriteStream(accessLogPath, { flags: "a" });
export const serverStream = fs.createWriteStream(serverLogPath, { flags: "a" });

export const accessLog = morgan('[:custom-date] - :remote-addr ":method :url" :status :res[content-length] - :response-time ms' /*, { stream: accessStream }*/);
export const serverLog = (content) => console.log(`[${date()}] - ${content}\n`); //serverStream.write(`[${date()}] - ${content}\n`);
