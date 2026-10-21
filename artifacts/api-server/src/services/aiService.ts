import OpenAI from "openai";
import { DataStatistics, buildDataSummary } from "./dataProcessor.js";

function getOpenAIClient(): OpenAI {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

  if (!baseURL || !apiKey) {
    throw new Error(
      "AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY must be set"
    );
  }

  return new OpenAI({ baseURL, apiKey });
}

export interface GeneratedInsight {
  type: "summary" | "growth" | "risk" | "opportunity" | "trend";
  title: string;
  content: string;
}

export async function generateInsightsFromData(
  businessName: string,
  businessDescription: string,
  industry: string,
  datasetName: string,
  statistics: DataStatistics
): Promise<GeneratedInsight[]> {
  const openai = getOpenAIClient();
  const dataSummary = buildDataSummary(statistics);

  const prompt = `You are a business data analyst. Analyze the following dataset from "${businessName}" (${industry}) and generate 5 business insights.

Business Description: ${businessDescription}
Dataset: ${datasetName}

${dataSummary}

Generate exactly 5 insights in the following JSON format. Each insight must have a "type" (one of: summary, growth, risk, opportunity, trend), "title" (short, under 10 words), and "content" (2-4 sentences of detailed analysis).

Respond ONLY with a valid JSON array, no markdown:
[
  {"type": "summary", "title": "...", "content": "..."},
  {"type": "growth", "title": "...", "content": "..."},
  {"type": "risk", "title": "...", "content": "..."},
  {"type": "opportunity", "title": "...", "content": "..."},
  {"type": "trend", "title": "...", "content": "..."}
]`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content ?? "[]";

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as GeneratedInsight[];
  } catch {
    return [
      {
        type: "summary",
        title: "Data Analysis Complete",
        content: `Analyzed ${statistics.rowCount} rows across ${statistics.columnCount} columns for ${businessName}. The dataset provides a comprehensive view of business metrics.`,
      },
    ];
  }
}

export async function answerBusinessQuestion(
  businessName: string,
  businessDescription: string,
  industry: string,
  question: string,
  existingInsights: { type: string; title: string; content: string }[],
  datasetSummaries: string[]
): Promise<string> {
  const openai = getOpenAIClient();

  const insightsContext =
    existingInsights.length > 0
      ? `\nExisting AI Insights:\n${existingInsights.map((i) => `- [${i.type.toUpperCase()}] ${i.title}: ${i.content}`).join("\n")}`
      : "";

  const dataContext =
    datasetSummaries.length > 0
      ? `\nDataset Information:\n${datasetSummaries.join("\n---\n")}`
      : "";

  const prompt = `You are a business intelligence analyst helping users understand "${businessName}" (${industry}).

Business Description: ${businessDescription}
${insightsContext}
${dataContext}

User Question: ${question}

Provide a clear, data-driven answer (2-4 paragraphs) based on the available information. Be specific and actionable. If the data doesn't fully address the question, acknowledge that while providing the best possible answer from what's available.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  return (
    response.choices[0]?.message?.content ??
    "I was unable to generate an answer at this time. Please try again."
  );
}
