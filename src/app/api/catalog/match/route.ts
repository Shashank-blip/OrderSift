import { NextRequest, NextResponse } from "next/server";
import { CatalogItem, DEFAULT_CATALOG, findMatchingCatalogItem } from "@/lib/tiger/catalog";
import { fetchTigerCatalog, isTigerConfigured } from "@/lib/tiger/db";

export const dynamic = "force-dynamic";

async function loadCatalog(): Promise<{ catalog: CatalogItem[]; source: "tiger-cloud" | "built-in"; error?: string }> {
  if (!isTigerConfigured()) {
    return { catalog: DEFAULT_CATALOG, source: "built-in", error: "TIGER_DATABASE_URL is not set" };
  }
  try {
    return { catalog: await fetchTigerCatalog(), source: "tiger-cloud" };
  } catch (e) {
    console.error("Tiger catalog query failed, using built-in catalog:", e);
    return {
      catalog: DEFAULT_CATALOG,
      source: "built-in",
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get("q");
  const { catalog, source, error } = await loadCatalog();

  if (!query) {
    return NextResponse.json({ catalog, source, error });
  }

  return NextResponse.json({
    query,
    match: findMatchingCatalogItem(query, catalog),
    source,
    error
  });
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const { catalog, source, error } = await loadCatalog();
    const results = items.map((itemName: string) => {
      const result = findMatchingCatalogItem(itemName, catalog);
      return {
        query: itemName,
        matched: result?.item || null,
        confidence: result?.confidence || 0
      };
    });

    return NextResponse.json({ results, source, error });
  } catch (error) {
    console.error("Catalog match failed:", error);
    return NextResponse.json({ error: "Failed to match catalog items" }, { status: 500 });
  }
}
