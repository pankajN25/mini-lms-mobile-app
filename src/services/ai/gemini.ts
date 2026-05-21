import { GROQ_API_KEY, GROQ_MODEL } from '@/config/ai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CourseContext {
  title: string;
  description: string;
  category: string;
  instructorName: string;
  rating: number;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Extract retry seconds from error body
export function parseRetrySeconds(detail: string): number {
  const match = /retry after (\d+(?:\.\d+)?)/i.exec(detail) ?? /retry in (\d+(?:\.\d+)?)s/i.exec(detail);
  if (match) return Math.ceil(Number(match[1]));
  return 30;
}

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: CourseContext): string {
  return `You are an AI course assistant for MiniLMS, a mobile learning platform. You help students explore and get the most out of their courses.

Course you are assisting with:
- Title: ${ctx.title}
- Category: ${ctx.category}
- Instructor: ${ctx.instructorName}
- Rating: ${ctx.rating}/5 stars
- Description: ${ctx.description}

Guidelines:
- Be friendly, warm, and encouraging — like a knowledgeable study buddy
- Keep responses concise (under 120 words) unless detail is genuinely needed
- Help students understand what they will learn and whether the course suits them
- Suggest practical study tips and learning strategies relevant to the topic
- Never make up specific lesson names, prices, or details not mentioned above
- If you don't know something, say so honestly`;
}

// ─── Demo mode (fallback when API key is missing or quota hit) ───────────────

function demoReply(question: string, ctx: CourseContext): string {
  const q = question.toLowerCase();
  const cat = ctx.category;
  const title = ctx.title;

  if (/beginner|new|start|experience|know/i.test(q))
    return `"${title}" is great for all levels! It starts from the fundamentals, so no prior experience in ${cat} is needed. You'll build confidence step by step before tackling advanced concepts.`;
  if (/learn|cover|teach|topic|skill/i.test(q))
    return `In "${title}" you'll learn the core principles of ${cat}, apply them in hands-on exercises, and finish with real-world project experience. By the end you'll have practical skills you can use right away.`;
  if (/long|time|hour|week|finish|complete|duration/i.test(q))
    return `Most students complete "${title}" in 2–4 weeks studying about 1 hour a day. At a relaxed pace it fits easily into a busy schedule — you can pause and resume any lesson.`;
  if (/career|job|work|hire|salary|professional|industry/i.test(q))
    return `${cat} skills are in high demand right now. Completing "${title}" will strengthen your portfolio and give you talking points in interviews. Many learners land their first ${cat} role within months of finishing.`;
  if (/certificate|certif|badge|credential/i.test(q))
    return `Yes! You earn a certificate upon completing all lessons in "${title}". You can share it on LinkedIn or attach it to job applications to showcase your new ${cat} skills.`;
  if (/price|cost|free|pay|worth|value/i.test(q))
    return `"${title}" offers excellent value. Think of it as an investment — quality ${cat} skills pay back quickly in your career growth and job opportunities.`;
  if (/instructor|teacher|who|taught/i.test(q))
    return `"${title}" is taught by ${ctx.instructorName}, a seasoned ${cat} professional. The course holds a ${ctx.rating.toFixed(1)}/5 rating from thousands of satisfied students.`;
  if (/project|practice|exercise|hands.?on|build/i.test(q))
    return `Absolutely! "${title}" is packed with hands-on exercises and a capstone project. You won't just watch videos — you'll apply every concept immediately so the knowledge really sticks.`;

  return `"${title}" is a highly-rated (${ctx.rating.toFixed(1)}★) ${cat} course by ${ctx.instructorName}. It covers everything from the basics to advanced topics with a practical, project-based approach. Is there something specific you'd like to know?`;
}

// ─── Main send (Groq) ────────────────────────────────────────────────────────

export async function sendMessage(
  messages: ChatMessage[],
  context: CourseContext,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('NO_API_KEY');
  }

  // Groq uses OpenAI-compatible format with a top-level system message
  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text,
      })),
    ],
    max_tokens: 400,
    temperature: 0.75,
  };

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    const detail = err?.error?.message ?? '';
    console.error('[Groq] API error', response.status, detail);
    throw new Error(`${response.status}:${detail}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text.trim();
}

// ─── Demo fallback ───────────────────────────────────────────────────────────

export async function sendDemoMessage(
  messages: ChatMessage[],
  context: CourseContext,
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const question = lastUserMsg?.text ?? '';
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  return demoReply(question, context);
}
