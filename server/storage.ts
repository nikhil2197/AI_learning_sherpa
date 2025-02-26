import { type Feedback, type InsertFeedback } from "@shared/schema";

export interface IStorage {
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
}

export class MemStorage implements IStorage {
  private feedbacks: Map<number, Feedback>;
  private currentId: number;

  constructor() {
    this.feedbacks = new Map();
    this.currentId = 1;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentId++;
    const feedback = { id, ...insertFeedback };
    this.feedbacks.set(id, feedback);
    return feedback;
  }
}

export const storage = new MemStorage();
