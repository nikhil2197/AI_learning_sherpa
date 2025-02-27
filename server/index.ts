import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initStorage } from "./storage";

// PostgreSQL session store for persistent sessions
let pgSession: any;
let sessionStore: any;

// Initialize the app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure session middleware
const SESSION_SECRET = process.env.SESSION_SECRET || 'insurance-advisor-secret';
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

// Basic session setup - will be enhanced with PostgreSQL store if available
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't create session until something stored
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_WEEK,
    httpOnly: true // Helps prevent XSS attacks
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize storage
  const storage = await initStorage();
  
  // Set up PostgreSQL session store if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      pgSession = require('connect-pg-simple')(session);
      sessionStore = new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session'
      });
      
      // Update session middleware with PostgreSQL store
      app.use(session({
        store: sessionStore,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { 
          secure: process.env.NODE_ENV === 'production',
          maxAge: ONE_WEEK
        }
      }));
      
      log("Using PostgreSQL session store");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL session store:", error);
      // Fall back to memory-based sessions
      app.use(sessionMiddleware);
      log("Using memory-based session store");
    }
  } else {
    // Use memory-based sessions
    app.use(sessionMiddleware);
    log("Using memory-based session store");
  }
  
  // Initialize routes and get the HTTP server
  const server = await registerRoutes(app, sessionMiddleware);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to serve the app on port 5000, fallback to other ports if needed
  const basePort = 5000;
  let port = basePort;
  
  const startServer = (attemptPort: number) => {
    server.listen({
      port: attemptPort,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${attemptPort}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${attemptPort} is in use, trying ${attemptPort + 1}...`);
        startServer(attemptPort + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };
  
  startServer(port);
})();
