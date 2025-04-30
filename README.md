## AI Learning Guide

My first AI project.

## 🎯 Project Goal

This project was designed to pilot a new kind of customer journey — where AI acts as a **personal learning concierge**. Instead of simply offering static recommendations, the goal was to build an AI that:

- Learns deeply about a user's current lifestyle, professional goals, and constraints
- Understands their time availability and motivation
- Builds a **customized, achievable learning path**

The broader vision was to make meaningful upskilling easier for busy individuals by shifting from generic course catalogs to context-aware learning guidance.

## 🖼️ What It Includes

- A single-page app (`index.html`) that presents information about AI topics
- Simple structure that can be extended for additional topics or demos
- `.replit` file for instant deployment on Replit

## 🚀 How to Use on Replit

1. Fork the project into your Replit account
2. Click "Run"

The site will be served automatically — no backend setup required.

## 🧠 How It Works

The AI backend is powered by OpenAI. Here's what it does behind the scenes:

- **System Prompt Design**: A comprehensive `SYSTEM_PROMPT` is used to guide the AI's behavior. It teaches the AI how to understand a user’s background, life schedule, and motivation — without asking overly direct or robotic questions.
- **Context-Aware Coaching**: The AI helps users discover how much time they can realistically devote to learning (e.g., while commuting or after work), and builds learning paths accordingly.
- **Rate Limiting & Retry Logic**: Built-in guards ensure the OpenAI API is used responsibly, with automatic retries, exponential backoff, and quota error detection.
- **Secure API Management**: The app validates your OpenAI API key format and prevents accidental calls without it.

This makes the app a smart concierge rather than just a static assistant — helping users plan, not just search.

## 📂 File Structure

- `client/index.html` – Static HTML page with all content and layout
- `.replit` – Tells Replit how to launch the project

## 🪪 License

Internal educational prototype – not intended for commercial use or public deployment.

