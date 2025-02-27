import type { Express } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { initStorage } from "./storage";
import { insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { getChatResponse } from "./openai";

export async function registerRoutes(app: Express, sessionMiddleware: any): Promise<Server> {
  // Get storage instance
  const storage = await initStorage();

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
      const botResponse = await getChatResponse(messages);

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
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid user data" });
        return;
      }
      throw err;
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
        res.status(400).json({ message: "Invalid feedback data" });
        return;
      }
      throw err;
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}