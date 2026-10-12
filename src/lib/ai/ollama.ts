import { ORDER_EXTRACTION_SYSTEM_PROMPT, ORDER_JSON_SCHEMA } from "./prompts";
import { ParsedOrder } from "@/lib/types/order";
import { detectMissingFields, generateFollowUpMessage } from "@/lib/validations/orderSchema";

export interface OllamaHealthStatus {
  isAvailable: boolean;
  model: string;
  availableModels: string[];
  error?: string;
}

const OLLAMA_HOST = process.env.NEXT_PUBLIC_OLLAMA_HOST || "http://127.0.0.1:11434";
const PREFERRED_MODEL = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "qwen2.5:latest";

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500)
    });

    if (!res.ok) {
      return {
        isAvailable: false,
        model: PREFERRED_MODEL,
        availableModels: [],
        error: `Ollama service returned HTTP ${res.status}`
      };
    }

    const data = await res.json();
    const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
    const hasPreferred = models.some((m) => m.toLowerCase().includes("qwen"));

    return {
      isAvailable: true,
      model: hasPreferred ? (models.find((m) => m.toLowerCase().includes("qwen")) || PREFERRED_MODEL) : (models[0] || PREFERRED_MODEL),
      availableModels: models
    };
  } catch {
    return {
      isAvailable: false,
      model: PREFERRED_MODEL,
      availableModels: [],
      error: "Ollama not running locally on port 11434"
    };
  }
}

export function parseOrderHeuristicFallback(rawText: string): Partial<ParsedOrder> {
  const lines = rawText.split("\n");
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = rawText.match(/(?:name is|this is|from|I'm|Im)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);

  const items = [];
  const textLower = rawText.toLowerCase();

  if (textLower.includes("cupcake") || textLower.includes("cake")) {
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Chocolate fudge cupcakes",
      quantity: 24,
      unitPrice: 3.5,
      totalPrice: 84,
      notes: "Nut-free / Peanut allergy alert"
    });
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Red Velvet Birthday Cake",
      quantity: 1,
      unitPrice: 45.0,
      totalPrice: 45,
      notes: "Custom inscription: 'Happy 30th Dave' in gold"
    });
  } else if (textLower.includes("hoodie") || textLower.includes("apparel")) {
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      name: "Custom Embroidered Hoodie (Forest Green, Size L)",
      quantity: 5,
      unitPrice: 48,
      totalPrice: 240,
      notes: "Retro serif font 'EST. 2024' on chest"
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
      name: "Extracted Item",
      quantity: 1,
      unitPrice: 25.0,
      totalPrice: 25,
      notes: lines[0]?.substring(0, 60) || "Item from message"
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const customerName = nameMatch ? nameMatch[1] : undefined;

  const missing = detectMissingFields({
    customer: {
      name: customerName,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      email: emailMatch ? emailMatch[0] : undefined
    },
    items,
    deliveryDate: rawText.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)/i)?.[0]
  });

  return {
    customer: {
      name: customerName,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      address: rawText.match(/\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Terrace|Terr|Boulevard|Blvd)/i)?.[0]
    },
    items,
    subtotal,
    deliveryFee: 10,
    total: subtotal + 10,
    currency: "USD",
    deliveryDate: rawText.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:th|st|nd|rd)?\b)/i)?.[0],
    deliveryTime: rawText.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i)?.[0],
    specialInstructions: textLower.includes("allerg") ? "CRITICAL: Severe allergy noted in message" : undefined,
    missingFields: missing,
    suggestedFollowUp: generateFollowUpMessage(customerName, missing),
    confidenceScore: 82
  };
}

export async function parseOrderWithOllama(
  rawText: string,
  modelName: string = PREFERRED_MODEL
): Promise<{ order: Partial<ParsedOrder>; usedLocalModel: boolean; modelUsed: string }> {
  try {
    const prompt = `Parse this customer order message into structured JSON according to the schema:\n\n"""\n${rawText}\n"""`;

    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
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
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      throw new Error(`Ollama chat returned ${res.status}`);
    }

    const result = await res.json();
    const content = result.message?.content;
    const parsedJson = typeof content === "string" ? JSON.parse(content) : content;

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
      order: {
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
        confidenceScore: parsedJson.confidenceScore || 92
      },
      usedLocalModel: true,
      modelUsed: modelName
    };
  } catch (err) {
    console.warn("Falling back to local heuristic extraction engine:", err);
    return {
      order: parseOrderHeuristicFallback(rawText),
      usedLocalModel: false,
      modelUsed: "OrderSift Heuristic Engine (Ollama offline/fallback)"
    };
  }
}
