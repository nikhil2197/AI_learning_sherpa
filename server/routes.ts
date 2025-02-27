import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { initStorage } from "./storage";
import { insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { ZodError } from "zod";
import * as http from "http";
import { getChatResponse } from "./openai"; // Add this import

// Extended WebSocket interface to store user information
interface UserWebSocket extends WebSocket {
  userId?: number;
  sessionId?: string;
  conversationHistory?: { type: string, message: string }[];
}

// Map to track active WebSocket connections by userId
const userConnections = new Map<number, UserWebSocket[]>();

export async function registerRoutes(app: Express, sessionMiddleware: any): Promise<Server> {
  // Get storage instance
  const storage = await initStorage();

  // API endpoint to get current user (if logged in)
  app.get("/api/current-user", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      console.log("No userId in session");
      return res.status(401).json({ message: "Not logged in" });
    }

    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        // User ID in session, but not in storage
        console.log(`User ${userId} not found in storage`);
        delete req.session.userId;
        return res.status(401).json({ message: "Invalid session" });
      }

      // Return user without sensitive info
      res.json({
        id: user.id,
        name: user.name,
        email: user.email
      });
    } catch (err) {
      console.error("Error fetching current user:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user creation to store user ID in session
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);

      // Store user ID in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.createdAt = new Date();
        console.log(`Created session for user ${user.id}`);
      }

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
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Please log in to submit feedback" });
      }

      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId // Include the userId from session
      });

      console.log(`Storing feedback for user ${userId}`);
      const result = await storage.createFeedback(feedbackData);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid feedback data" });
        return;
      }
      throw err;
    }
  });

  // Session debug endpoint - only available in development
  if (process.env.NODE_ENV !== 'production') {
    app.get("/api/debug/session", (req, res) => {
      if (!req.session) {
        return res.json({ message: "No session" });
      }

      // Return a safe version of the session (omitting any sensitive data)
      const safeSession = {
        id: req.session.id,
        userId: req.session.userId,
        createdAt: req.session.createdAt,
        cookie: req.session.cookie
      };

      res.json(safeSession);
    });
  }

  // Add logout endpoint
  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Not logged in" });
    }
  });

  // Get current user's conversation history
  app.get("/api/conversation-history", (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    // Find all WebSocket connections for this user
    const userWs = userConnections.get(userId);
    if (userWs && userWs.length > 0) {
      // Return the conversation history from the first active connection
      // (typically there's only one per user)
      return res.json({
        history: userWs[0].conversationHistory || [],
        sessionId: userWs[0].sessionId
      });
    }

    // No active WebSocket connections found
    res.json({ history: [], message: "No active conversations" });
  });

  // Add this new endpoint after other API routes
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


  const httpServer = createServer(app);

  // Setup WebSocket server with session integration
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    // Skip client verification
    verifyClient: false
  });

  wss.on('connection', async (ws: UserWebSocket, req) => {
    console.log('Client connected');

    // Initialize conversation history
    ws.conversationHistory = [];

    try {
      // Get session from the WebSocket request
      sessionMiddleware(req, {} as http.ServerResponse, () => {
        // @ts-ignore - accessing session property
        const session = req.session;
        if (session?.userId) {
          // Associate WebSocket with user ID from session
          ws.userId = session.userId;
          ws.sessionId = session.id;
          console.log(`Associated WebSocket with user ${ws.userId}`);
        }
      });

    } catch (err) {
      console.error('Error processing WebSocket session:', err);
    }

    // Send initial message
    const initialMessage = {
      type: 'bot',
      message: "Hello! I'm your Auto Insurance Advisor. I'll help you find the right insurance coverage. What type of vehicle do you own?"
    };
    ws.send(JSON.stringify(initialMessage));

    // Store message in conversation history
    if (ws.conversationHistory) {
      ws.conversationHistory.push(initialMessage);
    }

    ws.on('message', (data) => {
      const messageStr = data.toString();
      console.log('Received:', messageStr);

      try {
        // Parse the user message
        const userMessage = JSON.parse(messageStr);

        // Add to conversation history
        if (ws.conversationHistory && userMessage.message) {
          ws.conversationHistory.push({
            type: 'user',
            message: userMessage.message
          });
        }

        // Simple response logic - can be enhanced later
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const botResponse = {
              type: 'bot',
              message: "Thank you for sharing that information. Could you tell me about your typical annual mileage and primary use of the vehicle (personal/commercial)?"
            };

            ws.send(JSON.stringify(botResponse));

            // Add to conversation history
            if (ws.conversationHistory) {
              ws.conversationHistory.push(botResponse);
            }
          }
        }, 1000);
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      // Save conversation history to session if user is authenticated
      if (ws.userId && ws.conversationHistory && ws.conversationHistory.length > 0) {
        try {
          // Get the session for this WebSocket
          if (sessionMiddleware && req) {
            sessionMiddleware(req, {} as http.ServerResponse, () => {
              // @ts-ignore - accessing session property
              const session = req.session;
              if (session) {
                // Store the conversation history in the session
                session.lastConversation = ws.conversationHistory;
                session.save();
                console.log(`Saved conversation history for user ${ws.userId} to session ${session.id}`);
              }
            });
          }
        } catch (err) {
          console.error('Error processing conversation history on disconnect:', err);
        }
      }

      // Remove from tracked connections if associated with a user
      if (ws.userId) {
        const userWs = userConnections.get(ws.userId);
        if (userWs) {
          const index = userWs.indexOf(ws);
          if (index !== -1) {
            userWs.splice(index, 1);
          }

          // If no more connections for this user, remove the user entry
          if (userWs.length === 0) {
            userConnections.delete(ws.userId);
          }
        }
      }
    });
  });

  return httpServer;
}