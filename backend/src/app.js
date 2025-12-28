import express, { json } from "express";
import cookieParser from "cookie-parser"
import cors from "cors"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - allow all origins in development
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())

// Serve static files from frontend
const frontendPath = path.join(__dirname, "../../Final frontend");
app.use(express.static(frontendPath));

app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

import mainRoutes from "./routes/main.routes.js";
app.use("/api",mainRoutes);

// Serve frontend HTML files (single page app with user/admin views)
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Also serve admin route to same file (handled by frontend routing)
app.get("/admin", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Error handling middleware (must be last)
import errorHandler from "./middleware/error.middleware.js";
app.use(errorHandler);

export default app;