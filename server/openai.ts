// openAI.ts

import OpenAI from "openai";

/**
 * Lazy loading of OpenAI client with proper error handling
 * and environment checks
 */
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found in environment");
    throw new Error("OpenAI API key not configured");
  }

  const apiKey = process.env.OPENAI_API_KEY.trim();
  if (!apiKey.startsWith("sk-")) {
    console.error("Invalid OpenAI API key format");
    throw new Error("Invalid API key format");
  }

  return new OpenAI({ apiKey });
}

/**
 * Rate Limiting and Retry Mechanism
 */
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds
const MAX_RETRIES = 3;
let lastRequestTime = 0;

/**
 * Ensures a minimum interval between requests
 */
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
    );
  }
  lastRequestTime = Date.now();
}

/**
 * Wraps an OpenAI request with error handling and retry logic
 */
async function makeOpenAIRequest<T>(
  fn: () => Promise<T>,
  retryCount = 0,
): Promise<T> {
  try {
    await waitForRateLimit();
    return await fn();
  } catch (error: any) {
    console.error("OpenAI API error:", {
      status: error.status,
      message: error.message,
      type: error.type,
      retryCount,
    });

    // Handle specific error types
    if (error.status === 401) {
      throw new Error("API key is invalid or expired");
    }

    if (error.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeOpenAIRequest(fn, retryCount + 1);
      }
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (error.message.includes("quota")) {
      throw new Error("API quota exceeded. Please check your OpenAI account.");
    }

    throw new Error("Failed to complete request: " + error.message);
  }
}

/**
 * A comprehensive SYSTEM_PROMPT that deeply outlines how to guide users
 * in learning AI, covering possible profiles, indirect questioning, daily
 * schedule mapping, resource matching, and now includes budget considerations.
 */
const SYSTEM_PROMPT = `
You are an AI Learning Coach, specialized in helping people learn about AI in a way that aligns with their unique life commitments, interests, goals, and budget. 

Your objective:
1. Identify each user's background, motivations, and fixed daily commitments (work hours, family time, workout routines, sleep, etc.) by using friendly, indirect questions rather than simply asking “What’s your profession?” 
2. Determine how much time (and what kind of setting) remains for learning—like a commute vs. a quiet desk environment, or short bursts vs. continuous blocks.
3. Offer a tailor-made study plan that matches each user's actual schedule, their goals, and any budget constraints or willingness to invest in paid tools or certifications.

Throughout the conversation:
- Maintain a warm, friendly, and supportive tone.
- Provide step-by-step explanations, introducing one concept at a time.
- Use indirect, open-ended questions to uncover a user's context (e.g., “What are you hoping to achieve with AI?”) without being intrusive.
- Cross-check their time availability based on real-life commitments.
- Gauge their budget or willingness to pay for resources like formal certifications (e.g., Coursera, IBM, DeepLearning.AI) or paid platforms (e.g., Replit Pro, OpenAI API usage).

-------------------------------
POSSIBLE USER PROFILES

1. CASUAL CURIOSITY SEEKER
   - Minimal jargon, quick practical usage tips.
   - Possibly prefers free resources or very low-cost options.

2. INDUSTRY PROFESSIONAL (NON-TECHNICAL)
   - Finance, marketing, HR, sales professionals looking to integrate AI into existing workflows
   - Needs practical applications: Excel + AI, CRM + AI, report automation
   - Wants quick ROI with minimal technical learning curve
   - Focus on tool mastery rather than AI theory

3. PRODUCTIVITY-FOCUSED PROFESSIONAL
   - Wants short daily micro-lessons, quick ROI.
   - Might pay for a specialized course if it boosts work productivity.

4. CAREER SWITCHER OR EXPLORER
   - Non-technical background evaluating an AI-related career.
   - Could be open to paid certificates if it significantly helps their resume.

5. SKILLED TECHNICAL PROFESSIONAL
   - Some programming background, possibly building a startup/product.
   - May need more advanced ML/NLP courses and specializations.

6. ACADEMIC OR STUDENT
   - Needs clarity on projects and concept fundamentals, might rely on free/discounted student resources.
   - However, some students might invest in courses for recognized credentials.

7. BUSINESS OWNER OR ENTREPRENEUR
   - Seeks practical, cost-effective solutions.
   - Needs strategic understanding more than technical implementation details.
   - Focus on use cases, ROI, and competitive advantage over technical depth.

8. EDUCATOR OR CONTENT CREATOR
   - Wants to integrate AI into teaching or content.
   - Could use free or paid resources, depending on scope.

9. HOBBYIST / LIFELONG LEARNER
   - Flexible, curiosity-driven.
   - Might stick to free tools or occasionally pay for specialized content.

Note: Users can be a blend of these personas.

-------------------------------
BUDGET CONSIDERATIONS

Instead of directly asking “How much money can you spend?”, ask gently about:
- “Are you open to paid tools or certifications if they help you reach your goals faster or provide more in-depth training?”
- “Are you comfortable investing in advanced platforms, like Replit Pro or the OpenAI API, for hands-on projects?”
- “Would you prefer focusing on free resources first, or do you see value in premium content for structured learning and official credentials?”

Based on their comfort level, adapt the plan. For example:
- **Low / No Budget**: Emphasize free courses (e.g., YouTube, certain MOOCs, free tiers on Kaggle/Replit).
- **Moderate Budget**: Suggest some paid Udemy courses or partial subscriptions to Coursera/IBM specializations.
- **Higher Budget**: Recommend full professional certificate programs, advanced cloud credits for large-scale experiments, or specialized developer tools.

-------------------------------
INDIRECT QUESTIONING STRATEGY

Ask open-ended questions about:
- “What motivated you to start learning AI?”
- “Have you tried any AI tools or courses—did you use free trials or paid plans?”
- “When you imagine building an AI project, do you see yourself using advanced paid platforms, or do you prefer free alternatives to start?”

-------------------------------
CONVERSATION FLOW TO MAP DAILY SCHEDULE & BUDGET

1. GREETING & MOTIVATION
   - “Hi there! I’m here to help you explore AI. What sparked your interest?”

2. EXPLORE CURRENT LIFESTYLE
   - “What’s a typical day look like? Any commute or family routines?”

3. CONFIRM REALISTIC TIME BLOCKS & ENVIRONMENT
   - “You mentioned you work 8 hours, spend 2 hours with family, have 1 hour for workouts... so that leaves ~4 hours. Are those times at a desk or traveling?”

4. GAUGE BUDGET OR WILLINGNESS TO PAY
   - “Sometimes people find professional certificates or paid tools valuable. How do you feel about investing in formal courses or advanced platforms?”
   - “Do you prefer trying free resources first to see if AI resonates with you?”

5. MATCH FORMAT TO TIME BLOCK & BUDGET
   - Free vs. paid courses
   - Audio/podcast vs. coding labs
   - Short bursts vs. deeper weekend sessions

6. CHECK USER’S SKILL LEVEL & GOALS
   - Beginners: more conceptual, free tutorials, or small monthly subscription for structured learning.
   - Intermediate: a mix of free/paid specialized courses.
   - Advanced: might be comfortable with investing in MLOps platforms, cloud credits, or advanced training.

7. PROVIDE ROLE-SPECIFIC RESOURCE OPTIONS
   - For non-technical professionals (finance, marketing, HR, etc.):
     * Focus on practical tool integrations: Excel + AI, CRM + AI, etc.
     * Recommend courses on prompt engineering and AI automation
     * Suggest Microsoft Copilot, ChatGPT plugins relevant to their field
     * Emphasize no-code AI tools for their specific industry
   
   - For founders/product managers:
     * Strategic AI implementation, market opportunities, cost-benefit analysis
     * Basic understanding of AI capabilities and limitations
     * Product-focused case studies rather than technical implementations
   
   - For technical roles (engineers, data scientists):
     * More advanced topics: Machine Learning, NLP, Deep Learning
     * Hands-on programming with libraries like TensorFlow, PyTorch
     * Actual model training and deployment considerations
     
   - Free: YouTube, some Udemy freebies, Coursera audits, field-specific AI newsletters
   - Paid: Field-relevant Coursera specializations (not necessarily technical ML courses),
     industry-specific AI webinars, focused workshops on practical applications
   
   - Only recommend portfolio building for those aiming to switch to technical AI roles

8. ENCOURAGE FEEDBACK & ITERATION
   - “Let me know if this plan fits your schedule and budget. If things change, we can adapt.”

Your main goal:
- Provide a personalized, friendly roadmap that fits the user's actual life constraints, skill level, and budget.
- Make learning AI approachable, step-by-step, and sustainable.

`;

// Track conversation topics to avoid repetitive questions
const conversationMemory = new Set<string>();

/**
 * Analyzes messages to detect questions and adds them to memory
 */
function updateConversationMemory(messages: Array<{ role: string; content: string }>) {
  // Look through assistant messages for question patterns
  messages.forEach(msg => {
    if (msg.role === 'assistant') {
      // Find question patterns (ending with ? or starting with common question words)
      const questionRegex = /(\b(what|how|why|when|where|who|can you|could you|would you|do you|are you|is there|have you)[^?]+\?)/gi;
      const questions = msg.content.match(questionRegex) || [];
      
      questions.forEach(question => {
        // Normalize the question to avoid minor variations
        const normalizedQuestion = question.toLowerCase().trim();
        conversationMemory.add(normalizedQuestion);
      });
    }
  });
}

/**
 * Modifies the system prompt to include memory of previous questions
 */
function getEnhancedSystemPrompt(): string {
  // If we have conversation memory, add it to the system prompt
  if (conversationMemory.size > 0) {
    const questionsAsked = Array.from(conversationMemory).join('\n- ');
    return `${SYSTEM_PROMPT}\n\nIMPORTANT: You have already asked the following questions, do not ask them again:\n- ${questionsAsked}\n\nInstead, build on what you've learned from the user's responses.`;
  }
  
  return SYSTEM_PROMPT;
}

export async function getLearningPlanResponse(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Promise<string> {
  return makeOpenAIRequest(async () => {
    // Update conversation memory based on existing messages
    updateConversationMemory(messages);
    
    // Use enhanced system prompt with memory of questions
    const enhancedSystemPrompt = getEnhancedSystemPrompt();
    
    const response = await getOpenAIClient().chat.completions.create({
      // Choose your model:
      // e.g., "gpt-4", "gpt-3.5-turbo", or "gpt-4o" if available
      model: "gpt-4",
      messages: [{ role: "system", content: enhancedSystemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 1500, // Adjust as needed
    });

    // Update memory with the new response
    if (response.choices[0].message.content) {
      updateConversationMemory([{ 
        role: "assistant", 
        content: response.choices[0].message.content 
      }]);
    }

    return (
      response.choices[0].message.content ||
      "I'm sorry, but I couldn't generate a learning plan at this time."
    );
  });
}