import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedback = insertFeedbackSchema.parse(req.body);
      const result = await storage.createFeedback(feedback);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid feedback data" });
        return;
      }
      throw err;
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
