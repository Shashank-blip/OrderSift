-- Tiger Data (TimescaleDB / PostgreSQL) Schema for OrderSift
-- Managed via Tiger MCP on service i9n4pdf1ga

-- 1. Enable pgvector for semantic catalog search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Merchant Catalog Table
-- Stores official menu/inventory items, pricing, allergens, and vector embeddings
CREATE TABLE IF NOT EXISTS merchant_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  description TEXT,
  allergens TEXT[],
  embedding vector(384)
);

-- 3. Customer Orders Sync Table
-- Optional merchant cloud sync ledger while keeping extraction local-first
CREATE TABLE IF NOT EXISTS customer_orders_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  items_json JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  raw_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Initial Seed Inventory (Bakery, Catering, Beverages, Custom Apparel)
INSERT INTO merchant_catalog (item_code, name, category, unit_price, description, allergens)
VALUES 
  ('BK-CUP-01', 'Double Chocolate Fudge Cupcake', 'Bakery', 3.50, 'Rich dark cocoa cupcake with molten chocolate fudge frosting', ARRAY['dairy', 'eggs', 'gluten']),
  ('BK-CUP-06', 'Chocolate Fudge Cupcake Box (6 pack)', 'Bakery', 19.00, 'Box of six double chocolate fudge cupcakes', ARRAY['dairy', 'eggs', 'gluten']),
  ('BK-CUP-02', 'Red Velvet Birthday Cake (8-inch)', 'Bakery', 45.00, 'Classic velvet crumb layered with vanilla cream cheese frosting and gold accents', ARRAY['dairy', 'eggs', 'gluten']),
  ('CAT-PAN-01', 'Grilled Tuscan Chicken Sourdough Panini', 'Catering', 12.50, 'Marinated free-range grilled chicken with sundried tomatoes and pesto on sourdough', ARRAY['dairy', 'gluten']),
  ('CAT-WRP-01', 'Avocado & Herb Roasted Vegetable Wrap (Vegan)', 'Catering', 11.00, 'Hass avocado, roasted bell peppers, hummus, and baby greens wrapped in spinach tortilla', ARRAY['sesame']),
  ('BEV-CB-01', 'Artisan Cold Brew Coffee (16oz bottle)', 'Beverages', 4.50, 'Steeped for 18 hours, single-origin Ethiopian beans', ARRAY[]::TEXT[]),
  ('APP-HD-01', 'Custom Embroidered Heavyweight Hoodie', 'Apparel', 48.00, '400 GSM premium cotton hoodie with custom chest or back embroidery', ARRAY[]::TEXT[])
ON CONFLICT (item_code) DO NOTHING;
