import pg from "pg";
const { Pool } = pg;

import { type User, type InsertUser, type Feedback, type InsertFeedback } from "@shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getUserById(id: number): Promise<User | null>;
  getAllFeedback(): Promise<Array<Feedback & { user: User }>>;
  getFeedbackStats(): Promise<{
    total: number;
    confidentPercentage: number;
    learnedNewPercentage: number;
    averageDuration: number;
    totalChats: number;  // Added new stat
  }>;
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
  async getAllFeedback(): Promise<Array<Feedback & { user: User }>> {
    const feedbackWithUsers = [];
    for (const feedback of this.feedbacks.values()) {
      const user = await this.getUserById(feedback.userId);
      if (user) {
        feedbackWithUsers.push({ ...feedback, user });
      }
    }
    return feedbackWithUsers.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getFeedbackStats(): Promise<{
    total: number;
    confidentPercentage: number;
    learnedNewPercentage: number;
    averageDuration: number;
    totalChats: number;
  }> {
    const feedbacks = Array.from(this.feedbacks.values());
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        confidentPercentage: 0,
        learnedNewPercentage: 0,
        averageDuration: 0,
        totalChats: 0
      };
    }

    const confident = feedbacks.filter(f => f.isConfident).length;
    const learnedNew = feedbacks.filter(f => f.learnedNew).length;
    const totalDuration = feedbacks.reduce((sum, f) => sum + (f.chatDuration || 0), 0);

    return {
      total,
      confidentPercentage: (confident / total) * 100,
      learnedNewPercentage: (learnedNew / total) * 100,
      averageDuration: totalDuration / total,
      totalChats: total // In this case, total chats equals total feedback
    };
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
    console.log("PgStorage: Storing feedback data:", insertFeedback);
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

    try {
      const result = await this.pool.query(query, values);
      console.log("PgStorage: Feedback stored successfully:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("PgStorage: Error storing feedback:", error);
      throw error;
    }
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
  async getAllFeedback(): Promise<Array<Feedback & { user: User }>> {
    const query = `
      SELECT 
        f.*,
        u.name,
        u.email,
        u.created_at as user_created_at
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `;

    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      isConfident: row.is_confident,
      learnedNew: row.learned_new,
      conversation: row.conversation,
      lastRecommendation: row.last_recommendation,
      chatDuration: row.chat_duration,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        createdAt: row.user_created_at
      }
    }));
  }

  async getFeedbackStats(): Promise<{
    total: number;
    confidentPercentage: number;
    learnedNewPercentage: number;
    averageDuration: number;
    totalChats: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        ROUND(AVG(CASE WHEN is_confident THEN 100 ELSE 0 END), 2) as confident_percentage,
        ROUND(AVG(CASE WHEN learned_new THEN 100 ELSE 0 END), 2) as learned_new_percentage,
        ROUND(AVG(COALESCE(chat_duration, 0)), 2) as avg_duration,
        COUNT(*) as total_chats
      FROM feedbacks
    `;

    const result = await this.pool.query(query);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total),
      confidentPercentage: parseFloat(stats.confident_percentage),
      learnedNewPercentage: parseFloat(stats.learned_new_percentage),
      averageDuration: parseFloat(stats.avg_duration),
      totalChats: parseInt(stats.total_chats)
    };
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