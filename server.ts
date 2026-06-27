import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GeminiService } from "./server/geminiService.js";

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
  // PRODUCTION GEMINI INTELLIGENCE ROUTES
  // =========================================================================

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "Prahari AI Workspace Core",
      timestamp: new Date().toISOString(),
    });
  });

  // Real Risk Scoring Engine Endpoint
  // Real Risk Scoring Engine Endpoint
  app.post("/api/rescue/assess-risk", async (req, res) => {
    try {
      const { task, currentTime, userContext } = req.body;
      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      if (!task || !task.title) {
        return res.status(400).json({ success: false, error: "Task payload is required." });
      }
      console.log(`[Risk Engine] Assessing task: "${task.title}"`);
      const assessment = await GeminiService.assessTaskRisk(task, currentTime, userContext, customKey);
      res.json({ success: true, data: assessment });
    } catch (err: any) {
      console.error("API Error in assess-risk:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to assess risk." });
    }
  });

  // Real AI Rescue Plan Generation Endpoint
  app.post("/api/rescue/generate-plan", async (req, res) => {
    try {
      const { task, riskAssessment, currentTime, userContext } = req.body;
      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      if (!task || !task.title || !riskAssessment) {
        return res.status(400).json({ success: false, error: "Task and riskAssessment are required." });
      }
      console.log(`[Rescue Engine] Generating plan for: "${task.title}"`);
      const plan = await GeminiService.generateRescuePlan(task, riskAssessment, currentTime, userContext, customKey);
      res.json({ success: true, data: plan });
    } catch (err: any) {
      console.error("API Error in generate-plan:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate plan." });
    }
  });

  // Real Plan Compression Endpoint
  app.post("/api/rescue/compress-plan", async (req, res) => {
    try {
      const { task, originalPlan, remainingTimeContext, userContext } = req.body;
      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      if (!task || !originalPlan || !remainingTimeContext) {
        return res.status(400).json({ success: false, error: "Task, original plan and remaining time context are required." });
      }
      console.log(`[Compression Engine] Compressing plan for: "${task.title}"`);
      const compressed = await GeminiService.compressRescuePlan(task, originalPlan, remainingTimeContext, userContext, customKey);
      res.json({ success: true, data: compressed });
    } catch (err: any) {
      console.error("API Error in compress-plan:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to compress plan." });
    }
  });

  // Real Reprioritization Endpoint
  app.post("/api/rescue/reprioritize", async (req, res) => {
    try {
      const { selectedTask, taskList, currentTime } = req.body;
      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      if (!selectedTask || !taskList) {
        return res.status(400).json({ success: false, error: "Selected task and task list are required." });
      }
      console.log(`[Reprioritize Engine] Reprioritizing around task: "${selectedTask.title}"`);
      const reprioritized = await GeminiService.reprioritizeTasks(selectedTask, taskList, currentTime, customKey);
      res.json({ success: true, data: reprioritized });
    } catch (err: any) {
      console.error("API Error in reprioritize:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to reprioritize." });
    }
  });

  // Real Personalized Recommendations Endpoint
  app.post("/api/rescue/recommendations", async (req, res) => {
    try {
      const { tasks, currentTime, userContext } = req.body;
      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ success: false, error: "Tasks list array is required." });
      }
      console.log(`[Recommendations Engine] Generating recommendations for ${tasks.length} tasks.`);
      const recommendations = await GeminiService.generatePersonalizedRecommendations(
        tasks,
        currentTime || new Date().toISOString(),
        userContext,
        customKey
      );
      res.json({ success: true, data: recommendations });
    } catch (err: any) {
      console.error("API Error in recommendations:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate recommendations." });
    }
  });

  // Placeholder: FCM Web Push Token Registration (Phase 1 Placeholder preserved)
  app.post("/api/notifications/register", (req, res) => {
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
