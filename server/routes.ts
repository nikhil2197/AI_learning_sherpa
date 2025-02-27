import type { Express } from "express";
import { createServer, type Server } from "http";
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

  // Insurance advisor iframe endpoint
  app.get("/insurance-advisor", (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Insurance Advisor</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              overflow: hidden;
            }
            #chat-container {
              width: 100%;
              height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <div id="chat-container">
            <!-- Chat interface will be mounted here -->
          </div>
          <script>
            // Initialize chat interface
            window.addEventListener('load', () => {
              // TODO: Initialize your chat interface here
              document.getElementById('chat-container').innerHTML = '<h2>Chat interface loading...</h2>';
            });
          </script>
        </body>
      </html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}