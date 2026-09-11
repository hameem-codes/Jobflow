import { Groq } from "groq-sdk";
import { env } from "../config/env.js";

// Singleton Groq client initialized with validated configuration
export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});
