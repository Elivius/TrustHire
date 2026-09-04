export function parseGonkaJson<T = unknown>(
  content: string,
): T {
  if (!content || typeof content !== "string") {
    throw new Error(
      "Gonka returned an empty response",
    );
  }

  const text = content.trim();

  // --------------------------------------------------
  // 1. Try the response directly first.
  // --------------------------------------------------

  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue with extraction.
  }

  // --------------------------------------------------
  // 2. Remove common reasoning blocks.
  // --------------------------------------------------

  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();

  // --------------------------------------------------
  // 3. Try again after removing reasoning.
  // --------------------------------------------------

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue with JSON extraction.
  }

  // --------------------------------------------------
  // 4. Remove markdown code fences.
  // --------------------------------------------------

  const withoutCodeFence = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutCodeFence) as T;
  } catch {
    // Continue with object extraction.
  }

  // --------------------------------------------------
  // 5. Find the first JSON object.
  // --------------------------------------------------

  const start = withoutCodeFence.indexOf("{");
  const end = withoutCodeFence.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    throw new Error(
      `Gonka returned invalid JSON: ${content}`,
    );
  }

  const jsonText = withoutCodeFence.slice(
    start,
    end + 1,
  );

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error(
      `Gonka returned invalid JSON: ${jsonText}`,
    );
  }
}