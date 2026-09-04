import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

export const gonka = new OpenAI({
  apiKey: process.env.GONKA_API_KEY,
  baseURL: "https://api.gonkarouter.io/v1",
  timeout: 60_000,
});

export async function createGonkaChatCompletion(
  request: Parameters<
    typeof gonka.chat.completions.create
  >[0],
) {
  const result =
    await gonka.chat.completions.create(
      request,
    );

  return result;
}