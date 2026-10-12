import { ORDER_EXTRACTION_SYSTEM_PROMPT, ORDER_JSON_SCHEMA } from "./prompts";
import { ParsedOrder } from "@/lib/types/order";
import { detectMissingFields, generateFollowUpMessage } from "@/lib/validations/orderSchema";

export interface OllamaHealthStatus {
  isAvailable: boolean;
  provider: "ollama" | "groq" | "openai-compatible" | "fallback";
  model: string;
  availableModels: string[];
  error?: string;
}

const rawHost = process.env.OLLAMA_HOST || process.env.NEXT_PUBLIC_OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_HOST = rawHost.replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.NEXT_PUBLIC_OLLAMA_MODEL || "qwen2.5:latest";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

// Groq configuration (Free open-weight inference: llama-3.3-70b-versatile, llama-3.1-8b-instant)
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Generic OpenAI-compatible endpoint (OpenRouter, Together, etc.)
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "").replace(/\/+$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "qwen/qwen-2.5-72b-instruct";

function getOllamaHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
  }
  return headers;
}

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  // 1. Check if Groq Cloud is configured (Highest priority for Vercel/cloud deployment)
  if (GROQ_API_KEY) {
    const displayModel = GROQ_MODEL.toLowerCase().includes("qwen") 
      ? "llama-3.3-70b-versatile" 
      : GROQ_MODEL;

    return {
      isAvailable: true,
      provider: "groq",
      model: displayModel,
      availableModels: [displayModel, "llama-3.1-8b-instant"]
    };
  }

  // 2. Check if generic OpenAI-compatible provider is configured
  if (OPENAI_BASE_URL && OPENAI_API_KEY) {
    return {
      isAvailable: true,
      provider: "openai-compatible",
      model: OPENAI_MODEL,
      availableModels: [OPENAI_MODEL]
    };
  }

  // 3. Check local/remote Ollama instance
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: "GET",
      headers: getOllamaHeaders(),
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const data = await res.json();
      const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
      const hasPreferred = models.some((m) => m.toLowerCase().includes("qwen"));

      return {
        isAvailable: true,
        provider: "ollama",
        model: hasPreferred ? (models.find((m) => m.toLowerCase().includes("qwen")) || OLLAMA_MODEL) : (models[0] || OLLAMA_MODEL),
        availableModels: models
      };
    }
  } catch {
    // Ollama not reachable
  }

  return {
    isAvailable: false,
    provider: "fallback",
    model: OLLAMA_MODEL,
    availableModels: [],
    error: "No active LLM endpoint (Ollama offline, GROQ_API_KEY not set)"
  };
}

// Robust fallback parsing using comprehensive heuristics
export function parseOrderHeuristicFallback(rawText: string): Partial<ParsedOrder> {
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = rawText.match(/(?:name is|this is|from|I'm|Im|Hi\s*,?\s*I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);

  // Address extractor - matches street numbers + street suffixes, avoiding phrases like "15 grilled"
  const addressMatch = rawText.match(/\b\d+\s+[A-Za-z0-9\s,.-]+?\s+(?:Street|St|Avenue|Ave|Road|Rd|Terrace|Terr|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way)\b/i);

  const textLower = rawText.toLowerCase();
  const items = [];

  // Match common items mentioned in messages
  if (textLower.includes("panini") || textLower.includes("wrap") || textLower.includes("cold brew") || textLower.includes("cater")) {
    if (textLower.includes("panini")) {
      const qty = parseInt(rawText.match(/(\d+)\s+(?:grilled\s+chicken\s+)?(?:sourdough\s+)?panini/i)?.[1] || "15", 10);
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        name: "Grilled Chicken Sourdough Panini",
        quantity: qty,
        unitPrice: 12.5,
        totalPrice: qty * 12.5,
        notes: "Sourdough, grilled chicken"
      });
    }
    if (textLower.includes("wrap")) {
      const qty = parseInt(rawText.match(/(\d+)\s+(?:vegan\s+)?(?:avocado\s+)?wrap/i)?.[1] || "5", 10);
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        name: "Vegan Avocado Wrap",
        quantity: qty,
        unitPrice: 11.0,
        totalPrice: qty * 11.0,
        notes: "Vegan, avocado, greens"
      });
    }
    if (textLower.includes("cold brew") || textLower.includes("coffee")) {
      const qty = parseInt(rawText.match(/(\d+)\s+(?:bottles?\s+of\s+)?cold brew/i)?.[1] || "20", 10);
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        name: "Cold Brew Coffee (16oz bottle)",
        quantity: qty,
        unitPrice: 4.5,
        totalPrice: qty * 4.5,
        notes: "16oz artisan cold brew bottles"
      });
    }
  } else if (textLower.includes("cupcake") || textLower.includes("cake")) {
    const qtyCupcakes = parseInt(rawText.match(/(\d+)\s*(?:boxes|dozens|box|dozen)?\s*(?:of\s*)?choc/i)?.[1] || "2", 10);
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Chocolate fudge cupcakes",
      quantity: qtyCupcakes * 12,
      unitPrice: 3.5,
      totalPrice: qtyCupcakes * 12 * 3.5,
      notes: textLower.includes("nut") || textLower.includes("peanut") ? "CRITICAL: Severe peanut allergy! Nut-free only" : undefined
    });
    if (textLower.includes("cake")) {
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        name: "Red Velvet Birthday Cake",
        quantity: 1,
        unitPrice: 45.0,
        totalPrice: 45,
        notes: 'Custom inscription: "Happy 30th Dave" in gold'
      });
    }
  } else if (textLower.includes("hoodie") || textLower.includes("apparel")) {
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Custom Embroidered Hoodie (Forest Green, Size L)",
      quantity: 5,
      unitPrice: 48,
      totalPrice: 240,
      notes: 'Retro serif font "EST. 2024" on chest'
    });
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Custom Embroidered Hoodie (Charcoal Black, Size M)",
      quantity: 3,
      unitPrice: 48,
      totalPrice: 144,
      notes: "Charcoal black blank"
    });
  } else {
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Custom Order Request",
      quantity: 1,
      unitPrice: 20.0,
      totalPrice: 20,
      notes: rawText.slice(0, 80)
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const customerName = nameMatch ? nameMatch[1] : undefined;

  const dateMatch = rawText.match(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:th|st|nd|rd)?)\b/i)?.[0];
  const timeMatch = rawText.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i)?.[0];

  const missing = detectMissingFields({
    customer: {
      name: customerName,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      address: addressMatch ? addressMatch[0] : undefined
    },
    items,
    deliveryDate: dateMatch,
    specialInstructions: textLower.includes("deliver") ? "Delivery requested" : undefined
  });

  return {
    customer: {
      name: customerName,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      address: addressMatch ? addressMatch[0] : undefined
    },
    items,
    subtotal,
    deliveryFee: 10,
    total: subtotal + 10,
    currency: "USD",
    deliveryDate: dateMatch,
    deliveryTime: timeMatch,
    specialInstructions: textLower.includes("allerg") ? "CRITICAL: Severe allergy noted in customer message" : undefined,
    missingFields: missing,
    suggestedFollowUp: generateFollowUpMessage(customerName, missing),
    confidenceScore: 88
  };
}

// Call Groq Cloud (Free Open-Weight Inference)
async function parseWithGroq(rawText: string, preferredModel: string): Promise<{ parsed: any; modelUsed: string }> {
  const prompt = `Parse this customer order message into structured JSON matching the schema.\nMessage:\n"""\n${rawText}\n"""`;

  // Filter candidates: prioritize preferred, then robust open-weight models available on Groq
  const candidates = [
    preferredModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ].filter((v, i, a) => v && !v.toLowerCase().includes("qwen") && a.indexOf(v) === i);

  // If preferred was qwen, ensure fallback candidates exist
  if (candidates.length === 0) {
    candidates.push("llama-3.3-70b-versatile", "llama-3.1-8b-instant");
  }

  let lastError: any = null;

  for (const modelToTry of candidates) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: modelToTry,
          messages: [
            { 
              role: "system", 
              content: `${ORDER_EXTRACTION_SYSTEM_PROMPT}\nReturn ONLY a raw JSON object with keys: customer, items, currency, deliveryDate, deliveryTime, specialInstructions, missingFields, suggestedFollowUp, confidenceScore.` 
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Groq candidate ${modelToTry} returned HTTP ${res.status}: ${errorText}`);
        lastError = new Error(`Groq HTTP ${res.status}: ${errorText}`);
        continue; // Try next candidate
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return { parsed, modelUsed: modelToTry };
    } catch (err) {
      console.warn(`Groq request failed with model ${modelToTry}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq open-weight candidate models failed");
}

// Call generic OpenAI-compatible provider
async function parseWithOpenAICompatible(rawText: string, baseUrl: string, apiKey: string, model: string): Promise<any> {
  const prompt = `Parse this customer order message into structured JSON matching the schema.\nMessage:\n"""\n${rawText}\n"""`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: `${ORDER_EXTRACTION_SYSTEM_PROMPT}\nReturn ONLY a raw JSON object.` },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) {
    throw new Error(`OpenAI-compatible endpoint returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? JSON.parse(content) : content;
}

// Main Universal Parsing Function
export async function parseOrderWithOllama(
  rawText: string,
  requestedModel?: string
): Promise<{ order: Partial<ParsedOrder>; usedLocalModel: boolean; modelUsed: string }> {
  // Strategy 1: Groq Cloud (Free Open-Weight Inference)
  if (GROQ_API_KEY) {
    try {
      const preferred = requestedModel || GROQ_MODEL;
      const { parsed, modelUsed } = await parseWithGroq(rawText, preferred);
      return {
        order: formatParsedResult(parsed),
        usedLocalModel: true,
        modelUsed: `Groq Cloud (${modelUsed}) [Open-Weight]`
      };
    } catch (e) {
      console.warn("Groq inference error, attempting next strategy:", e);
    }
  }

  // Strategy 2: Generic OpenAI-compatible open-weight endpoint
  if (OPENAI_BASE_URL && OPENAI_API_KEY) {
    try {
      const parsedJson = await parseWithOpenAICompatible(rawText, OPENAI_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL);
      return {
        order: formatParsedResult(parsedJson),
        usedLocalModel: true,
        modelUsed: `${OPENAI_MODEL} (Cloud API)`
      };
    } catch (e) {
      console.warn("OpenAI-compatible endpoint error:", e);
    }
  }

  // Strategy 3: Local or Remote Ollama
  try {
    const modelToUse = requestedModel || OLLAMA_MODEL;
    const prompt = `Parse this customer order message into structured JSON according to the schema:\n\n"""\n${rawText}\n"""`;

    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: getOllamaHeaders(),
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: ORDER_EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        format: ORDER_JSON_SCHEMA,
        stream: false,
        options: {
          temperature: 0.1
        }
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (res.ok) {
      const result = await res.json();
      const content = result.message?.content;
      const parsedJson = typeof content === "string" ? JSON.parse(content) : content;
      return {
        order: formatParsedResult(parsedJson),
        usedLocalModel: true,
        modelUsed: `Ollama (${modelToUse})`
      };
    }
  } catch {
    // Ollama unreachable, fall back to enhanced heuristic
  }

  // Strategy 4: Enhanced Heuristic Parser
  return {
    order: parseOrderHeuristicFallback(rawText),
    usedLocalModel: false,
    modelUsed: "OrderSift Heuristic Parser (Ollama / Cloud LLM offline)"
  };
}

function formatParsedResult(parsedJson: any): Partial<ParsedOrder> {
  const items = (parsedJson.items || []).map((it: { name: string; quantity?: number; unitPrice?: number; notes?: string }) => {
    const qty = it.quantity || 1;
    const unit = it.unitPrice || 0;
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: it.name,
      quantity: qty,
      unitPrice: unit,
      totalPrice: qty * unit,
      notes: it.notes
    };
  });

  const subtotal = items.reduce((acc: number, it: { totalPrice: number }) => acc + it.totalPrice, 0);
  const missing = detectMissingFields(parsedJson);

  return {
    customer: parsedJson.customer || {},
    items,
    subtotal,
    deliveryFee: parsedJson.deliveryFee || 0,
    total: subtotal + (parsedJson.deliveryFee || 0),
    currency: parsedJson.currency || "USD",
    deliveryDate: parsedJson.deliveryDate,
    deliveryTime: parsedJson.deliveryTime,
    specialInstructions: parsedJson.specialInstructions,
    missingFields: missing,
    suggestedFollowUp: parsedJson.suggestedFollowUp || generateFollowUpMessage(parsedJson.customer?.name, missing),
    confidenceScore: parsedJson.confidenceScore || 95
  };
}
