// Groq free tier: 30 RPM · 14,400 req/day · no credit card needed
// Get a free key at https://console.groq.com → API Keys
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

// Fallback: Gemini (kept for reference)
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

// llama-3.1-8b-instant: fast, free, great for conversational AI
export const GROQ_MODEL = 'llama-3.1-8b-instant';
