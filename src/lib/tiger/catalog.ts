export interface CatalogItem {
  id?: string;
  item_code: string;
  name: string;
  category: string;
  unit_price: number;
  description: string;
  allergens: string[];
}

// Built-in seed items matching Tiger Cloud database table
export const DEFAULT_CATALOG: CatalogItem[] = [
  {
    item_code: "BK-CUP-01",
    name: "Double Chocolate Fudge Cupcake",
    category: "Bakery",
    unit_price: 3.5,
    description: "Rich dark cocoa cupcake with molten chocolate fudge frosting",
    allergens: ["dairy", "eggs", "gluten"],
  },
  {
    item_code: "BK-CUP-02",
    name: "Red Velvet Birthday Cake (8-inch)",
    category: "Bakery",
    unit_price: 45.0,
    description: "Classic velvet crumb layered with vanilla cream cheese frosting and gold accents",
    allergens: ["dairy", "eggs", "gluten"],
  },
  {
    item_code: "CAT-PAN-01",
    name: "Grilled Tuscan Chicken Sourdough Panini",
    category: "Catering",
    unit_price: 12.5,
    description: "Marinated free-range grilled chicken with sundried tomatoes and pesto on sourdough",
    allergens: ["dairy", "gluten"],
  },
  {
    item_code: "CAT-WRP-01",
    name: "Avocado & Herb Roasted Vegetable Wrap (Vegan)",
    category: "Catering",
    unit_price: 11.0,
    description: "Hass avocado, roasted bell peppers, hummus, and baby greens wrapped in spinach tortilla",
    allergens: ["sesame"],
  },
  {
    item_code: "BEV-CB-01",
    name: "Artisan Cold Brew Coffee (16oz bottle)",
    category: "Beverages",
    unit_price: 4.5,
    description: "Steeped for 18 hours, single-origin Ethiopian beans",
    allergens: [],
  },
  {
    item_code: "APP-HD-01",
    name: "Custom Embroidered Heavyweight Hoodie",
    category: "Apparel",
    unit_price: 48.0,
    description: "400 GSM premium cotton hoodie with custom chest or back embroidery",
    allergens: [],
  },
];

export function findMatchingCatalogItem(query: string, catalog: CatalogItem[] = DEFAULT_CATALOG): { item: CatalogItem; confidence: number } | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let bestMatch: CatalogItem | null = null;
  let highestScore = 0;

  for (const item of catalog) {
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    let score = 0;

    if (nameLower === q) score += 100;
    else if (nameLower.includes(q)) score += 70;
    else {
      const qWords = q.split(/\s+/);
      const matchedWords = qWords.filter(w => w.length > 2 && (nameLower.includes(w) || descLower.includes(w)));
      score += (matchedWords.length / Math.max(qWords.length, 1)) * 60;
    }

    if (score > highestScore && score >= 30) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return { item: bestMatch, confidence: Math.min(Math.round(highestScore), 98) };
  }
  return null;
}
