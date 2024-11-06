import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import router from "./router.js";
import { publicDir, indexDir, accessLog, serverLog } from "./config.js";

// Use express
const app = express();
const PORT = 3003;

// Middleware setup
app.use(accessLog);
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// Use the router for all routes
app.use("/api", router);

// Serve static file from the 'public' directory
app.use(express.static(publicDir));
app.get("*", (req, res) => {
  res.sendFile(indexDir);
});

// Start the server
app.listen(PORT, () => {
  serverLog(`Server is running on port ${PORT}`);
});
