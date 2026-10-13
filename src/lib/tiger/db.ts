import { Pool } from "pg";
import { CatalogItem } from "./catalog";

const globalForPg = globalThis as unknown as { tigerPool?: Pool };

export function isTigerConfigured(): boolean {
  return Boolean(process.env.TIGER_DATABASE_URL);
}

export function getTigerPool(): Pool {
  if (!process.env.TIGER_DATABASE_URL) {
    throw new Error("TIGER_DATABASE_URL is not set");
  }
  if (!globalForPg.tigerPool) {
    const url = new URL(process.env.TIGER_DATABASE_URL);
    url.searchParams.delete("sslmode");
    const ca = process.env.TIGER_CA_CERT?.replace(/\\n/g, "\n");
    globalForPg.tigerPool = new Pool({
      connectionString: url.toString(),
      // Matches libpq sslmode=require (encrypted, unverified) unless a CA is provided for verify-full.
      ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000
    });
  }
  return globalForPg.tigerPool;
}

let catalogCache: { items: CatalogItem[]; fetchedAt: number } | null = null;

export async function fetchTigerCatalog(): Promise<CatalogItem[]> {
  if (catalogCache && Date.now() - catalogCache.fetchedAt < 60_000) {
    return catalogCache.items;
  }
  const { rows } = await getTigerPool().query(
    `SELECT id, item_code, name, category, unit_price::float8 AS unit_price, description, COALESCE(allergens, '{}') AS allergens
     FROM merchant_catalog
     ORDER BY item_code`
  );
  catalogCache = { items: rows as CatalogItem[], fetchedAt: Date.now() };
  return catalogCache.items;
}
