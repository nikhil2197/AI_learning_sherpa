import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/users", async (req, res) => {
    try {
      const user = insertUserSchema.parse(req.body);
      const result = await storage.createUser(user);
      res.json(result);
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

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial message
    ws.send(JSON.stringify({
      type: 'bot',
      message: "Hello! I'm your Auto Insurance Advisor. I'll help you find the right insurance coverage. What type of vehicle do you own?"
    }));

    ws.on('message', (data) => {
      const message = data.toString();
      console.log('Received:', message);

      // Simple response logic - can be enhanced later
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'bot',
            message: "Thank you for sharing that information. Could you tell me about your typical annual mileage and primary use of the vehicle (personal/commercial)?"
          }));
        }
      }, 1000);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return httpServer;
}