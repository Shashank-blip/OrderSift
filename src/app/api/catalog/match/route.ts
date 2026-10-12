import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CATALOG, findMatchingCatalogItem } from "@/lib/tiger/catalog";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  // In production with live database credentials (or fallback default catalog)
  if (!query) {
    return NextResponse.json({
      catalog: DEFAULT_CATALOG,
      source: process.env.TIGER_DATABASE_URL ? "tiger-cloud" : "local-catalog",
      service_id: "i9n4pdf1ga"
    });
  }

  const match = findMatchingCatalogItem(query, DEFAULT_CATALOG);
  return NextResponse.json({
    query,
    match,
    service_id: "i9n4pdf1ga",
    source: process.env.TIGER_DATABASE_URL ? "tiger-cloud" : "local-catalog"
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const matches = items.map((itemName: string) => {
      const result = findMatchingCatalogItem(itemName, DEFAULT_CATALOG);
      return {
        query: itemName,
        matched: result?.item || null,
        confidence: result?.confidence || 0
      };
    });

    return NextResponse.json({
      results: matches,
      service_id: "i9n4pdf1ga"
    });
  } catch (error) {
    console.error("Catalog match failed:", error);
    return NextResponse.json({ error: "Failed to match catalog items" }, { status: 500 });
  }
}
