import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

export const gonka = new OpenAI({
  apiKey: process.env.GONKA_API_KEY,
  baseURL: "https://api.gonkarouter.io/v1",
});