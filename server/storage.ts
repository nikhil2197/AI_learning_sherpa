import { type User, type InsertUser, type Feedback, type InsertFeedback } from "@shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
}

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
}

export const storage = new MemStorage();