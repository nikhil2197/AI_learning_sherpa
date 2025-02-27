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

// Configure CORS for cross-origin requests
app.use((req, res, next) => {
  // Allow the external chat app domain
  const allowedOrigins = ['https://insurance-wizard-rameshnikhil21.replit.app'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Configure session middleware
const SESSION_SECRET = process.env.SESSION_SECRET || "insurance-advisor-secret";
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

// Update session middleware configuration
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    httpOnly: true,
    sameSite: 'none', // Allow cross-origin with Secure
    path: '/',
    domain: process.env.NODE_ENV === "production" ? ".replit.app" : undefined
  },
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
      // Dynamic import for ESM compatibility
      const pgSessionModule = await import("connect-pg-simple");
      pgSession = pgSessionModule.default(session);
      sessionStore = new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: "session",
      });

      // Update PostgreSQL session store configuration
      app.use(
        session({
          store: sessionStore,
          secret: SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_WEEK,
            httpOnly: true,
            sameSite: 'none', // Allow cross-origin with Secure
            path: '/',
            domain: process.env.NODE_ENV === "production" ? ".replit.app" : undefined
          },
        }),
      );

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

  // Initialize routes
  const server = await registerRoutes(app, sessionMiddleware);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port 5000 for both production and development
  const port = 5000;

  server
    .listen(
      {
        port: port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    )
    .on("error", (err: any) => {
      console.error("Server error:", err);
    });
})();