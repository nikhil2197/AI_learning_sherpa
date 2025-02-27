import { type User, type InsertUser, type Feedback, type InsertFeedback } from "@shared/schema";
import { Pool } from "pg";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getUserById(id: number): Promise<User | null>;
  setupTables(): Promise<void>;
}

// For development without a DB
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private feedbacks: Map<number, Feedback>;
  private currentUserId: number;
  private currentFeedbackId: number;

  constructor() {
    this.users = new Map();
    this.feedbacks = new Map();
    this.currentUserId = 1;
    this.currentFeedbackId = 1;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { 
      id, 
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const feedback = { 
      id, 
      ...insertFeedback,
      createdAt: new Date(),
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async setupTables(): Promise<void> {
    // No tables to set up for in-memory storage
    return;
  }
}

// For production with Postgres
export class PgStorage implements IStorage {
  private pool: Pool;

  constructor(connectionString?: string) {
    // Use environment variable or provided connection string
    const dbUrl = connectionString || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.warn("No DATABASE_URL found, using in-memory storage instead");
      throw new Error("No DATABASE_URL provided");
    }

    this.pool = new Pool({
      connectionString: dbUrl,
    });
  }

  async setupTables(): Promise<void> {
    // Create users and feedbacks tables if they don't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    const createFeedbacksTable = `
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        is_confident BOOLEAN NOT NULL,
        learned_new BOOLEAN NOT NULL,
        conversation TEXT,
        last_recommendation TEXT,
        chat_duration INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create sessions table for express-session
    const createSessionTable = `
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(createUsersTable);
      await client.query(createFeedbacksTable);
      await client.query(createSessionTable);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error("Error setting up tables:", e);
      throw e;
    } finally {
      client.release();
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const query = `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, created_at as "createdAt"
    `;
    const values = [insertUser.name, insertUser.email];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const query = `
      INSERT INTO feedbacks (
        user_id, is_confident, learned_new, conversation, 
        last_recommendation, chat_duration
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id as "userId", is_confident as "isConfident", 
                learned_new as "learnedNew", conversation, 
                last_recommendation as "lastRecommendation", 
                chat_duration as "chatDuration", 
                created_at as "createdAt"
    `;
    const values = [
      insertFeedback.userId, 
      insertFeedback.isConfident, 
      insertFeedback.learnedNew,
      insertFeedback.conversation,
      insertFeedback.lastRecommendation,
      insertFeedback.chatDuration
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserById(id: number): Promise<User | null> {
    const query = `
      SELECT id, name, email, created_at as "createdAt"
      FROM users
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

// Use environment variable to determine storage type
let storage: IStorage;

// This might be used by tests or development
export const createMemStorage = () => {
  return new MemStorage();
};

// This is used by the application
export const initStorage = async () => {
  try {
    if (process.env.DATABASE_URL) {
      const pgStorage = new PgStorage();
      // Initialize database tables
      await pgStorage.setupTables();
      storage = pgStorage;
      console.log("Using PostgreSQL storage");
    } else {
      storage = new MemStorage();
      console.log("Using in-memory storage");
    }
  } catch (e) {
    console.warn("Failed to initialize PgStorage:", e);
    console.log("Falling back to in-memory storage");
    storage = new MemStorage();
  }
  return storage;
};

// For backward compatibility, initialize with MemStorage
// Will be replaced when initStorage is called
storage = new MemStorage();