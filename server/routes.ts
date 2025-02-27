import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { ZodError } from "zod";
import * as http from "http";

// Extended WebSocket interface to store user information
interface UserWebSocket extends WebSocket {
  userId?: number;
  sessionId?: string;
  conversationHistory?: { type: string, message: string }[];
}

// Map to track active WebSocket connections by userId
const userConnections = new Map<number, UserWebSocket[]>();

export async function registerRoutes(app: Express, sessionMiddleware: any): Promise<Server> {
  // API endpoint to get current user (if logged in)
  app.get("/api/current-user", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        // User ID in session, but not in storage
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

  // Add logout endpoint
  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Not logged in" });
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

  // Function to parse session from request
  const getSession = (req: http.IncomingMessage): Promise<any> => {
    return new Promise((resolve) => {
      // Apply session middleware to parse session
      sessionMiddleware(req, {} as http.ServerResponse, () => {
        // @ts-ignore - accessing session property
        const session = req.session;
        resolve(session);
      });
    });
  };

  wss.on('connection', async (ws: UserWebSocket, req) => {
    console.log('Client connected');
    
    // Initialize conversation history
    ws.conversationHistory = [];
    
    try {
      // Get session from the WebSocket request
      const session = await getSession(req);
      
      if (session?.userId) {
        // Associate WebSocket with user ID from session
        ws.userId = session.userId;
        ws.sessionId = session.id;
        
        // Track this connection
        if (!userConnections.has(ws.userId)) {
          userConnections.set(ws.userId, []);
        }
        userConnections.get(ws.userId)?.push(ws);
        
        console.log(`User ${ws.userId} connected via WebSocket`);
      } else {
        console.log('Anonymous WebSocket connection');
      }
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