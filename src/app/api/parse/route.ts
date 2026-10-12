import { NextRequest, NextResponse } from "next/server";
import { checkOllamaHealth, parseOrderWithOllama } from "@/lib/ai/ollama";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkOllamaHealth();
  return NextResponse.json(health);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, model } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text field is required" }, { status: 400 });
    }

    const result = await parseOrderWithOllama(text, model);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Order parsing failed:", error);
    return NextResponse.json(
      { error: "Failed to parse message into order" },
      { status: 500 }
    );
  }
}
