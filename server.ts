import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads
  app.use(express.json());

  // =========================================================================
  // API PLACEHOLDERS FOR LATER PHASES (To be implemented in Phase 2)
  // =========================================================================

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "Prahari AI Workspace Core",
      timestamp: new Date().toISOString(),
    });
  });

  // Placeholder: Risk Scoring Engine Endpoint
  app.post("/api/rescue/assess-risk", (req, res) => {
    // Phase 1 Placeholder
    res.json({
      success: true,
      message: "assess-risk endpoint placeholder active (Phase 1).",
      data: {
        riskScore: 0.15,
        riskLevel: "LOW",
        factors: ["Workspace setup initialized successfully"],
        detectedDeadlinesCount: 0,
      }
    });
  });

  // Placeholder: AI Rescue Plan Generation
  app.post("/api/rescue/generate-plan", (req, res) => {
    // Phase 1 Placeholder
    res.json({
      success: true,
      message: "generate-plan endpoint placeholder active (Phase 1).",
      data: {
        planId: "placeholder-plan-id",
        status: "draft",
        compressionRatio: "100%",
        rescueSteps: [],
      }
    });
  });

  // Placeholder: FCM Web Push Token Registration
  app.post("/api/notifications/register", (req, res) => {
    // Phase 1 Placeholder
    res.json({
      success: true,
      message: "Notification token registered (Workspace stub active)."
    });
  });

  // =========================================================================
  // VITE MIDDLEWARE CONFIGURATION
  // =========================================================================
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Prahari AI workspace server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting the workspace server:", err);
  process.exit(1);
});
