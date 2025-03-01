import type { Express } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { initStorage } from "./storage";
import { insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { getLearningPlanResponse } from "./openai";

export async function registerRoutes(app: Express, sessionMiddleware: any): Promise<Server> {
  // Get storage instance
  const storage = await initStorage();

  // Add admin endpoint to fetch feedback data
  app.get("/api/admin/feedback", async (req, res) => {
    try {
      const result = await storage.getAllFeedback();
      const stats = await storage.getFeedbackStats();
      res.json({ feedbacks: result, stats });
    } catch (err) {
      console.error('Error fetching feedback:', err);
      res.status(500).json({ 
        message: err instanceof Error ? err.message : "Failed to fetch feedback" 
      });
    }
  });

  // Add chat endpoint - no authentication required
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Format conversation history for OpenAI
      const messages = context ? context.map((msg: { type: string; message: string }) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      })) : [];

      // Add the current message
      messages.push({ role: 'user', content: message });

      // Get response from OpenAI
      const botResponse = await getLearningPlanResponse(messages);

      res.json({
        type: 'bot',
        message: botResponse
      });
    } catch (err) {
      console.error('Chat error:', err);
      res.status(500).json({ 
        message: err instanceof Error ? err.message : "Failed to get response" 
      });
    }
  });

  // Store feedback without requiring session
  app.post("/api/users", async (req, res) => {
    try {
      console.log("Received user data:", req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log("Validated user data:", userData);
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user);
      res.json(user);
    } catch (err) {
      console.error("Error creating user:", err);
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: err.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      console.log("Received feedback data:", req.body);
      const feedbackData = insertFeedbackSchema.parse(req.body);
      console.log("Validated feedback data:", feedbackData);
      const result = await storage.createFeedback(feedbackData);
      console.log("Feedback stored successfully:", result);
      res.json(result);
    } catch (err) {
      console.error("Error storing feedback:", err);
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid feedback data", errors: err.errors });
        return;
      }
      res.status(500).json({ message: "Failed to store feedback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}