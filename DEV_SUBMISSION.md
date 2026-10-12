# OrderSift — DEV "Side Hustle" Challenge Submission

> **From messy messages to orders you can act on.**  
> Local-first, privacy-preserving order extraction engine powered by open-weight AI (Ollama + Qwen 2.5 Instruct) and IndexedDB.

---

## 1. What I Built

**OrderSift** is an offline-ready, privacy-first order extraction app designed for solo entrepreneurs, home bakers, caterers, and craft sellers who receive messy orders scattered across WhatsApp, Instagram DMs, SMS, and emails.

Instead of paying recurring subscription fees or leaking sensitive customer names, addresses, and phone numbers to closed cloud LLMs, OrderSift extracts structured order data **100% locally** using the open-weight **Qwen 2.5 Instruct** model via **Ollama**, and stores orders client-side using **IndexedDB**.

### Key Capabilities:
- **Instant Unstructured Message Parsing**: Takes raw, messy customer chat text (e.g. *"2 boxes cupcakes for Saturday 2pm, call 555-0199, peanut allergy!"*) and parses items, quantities, prices, delivery schedules, and notes.
- **Deterministic Missing-Field Detection**: Runs Zod schema validation to instantly spot missing contact info, delivery dates, or fulfillment preferences.
- **1-Click Customer Clarification**: Automatically writes a polite WhatsApp/DM message ready to copy & paste back to the customer to clarify missing details.
- **Local Ledger & Export**: Full order status tracking (Draft, Confirmed, Preparing, Ready, Delivered) with 1-click **CSV** and **JSON** exports for spreadsheets and accounting.

---

## 2. Why Open Innovation Matters for OrderSift

Closed-source LLM APIs (OpenAI, Anthropic, Google) charge per token and send private data to external servers. For micro-businesses and side hustles:

1. **Zero Marginal Inference Cost**: A home baker or freelance caterer processing 200 message inquiries a month incurs **$0 in API bills**. The open-weight model runs directly on their laptop or desktop.
2. **Ironclad Customer Privacy by Design**: Customer PII—names, phone numbers, home delivery addresses, and dietary allergies—**never leaves the merchant's machine**. In a world of increasing data leaks, privacy is a major selling point.
3. **Offline & Resilient**: At farmer's markets, weekend craft fairs, or pop-up shops with spotty cellular reception, OrderSift works completely offline.
4. **No API Rate Limits or Vendor Lock-in**: The open-weight weights (`qwen2.5:latest`, `qwen2.5:3b`, etc.) are open-source and customizable.

---

## 3. Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **AI Inference Engine**: Ollama running `qwen2.5` with strict JSON Schema output enforcement
- **Fallback Engine**: Local regex-based heuristic extractor when Ollama is offline
- **Database**: IndexedDB via Dexie.js for client-side local persistence
- **Validation**: Zod schema validation

---

## 4. Partner Technology: Best Use of Tiger Data ($100 Track)

OrderSift integrates with **Tiger Cloud (Managed TimescaleDB & PostgreSQL with `pgvector`)** managed directly through **Tiger MCP**:

1. **Merchant Menu & Catalog with `pgvector`**:
   - OrderSift matches fuzzy, colloquial customer names (e.g. *"2 boxes fudge buns"*) against the merchant's official inventory (`BK-CUP-01: Double Chocolate Fudge Cupcake`) using semantic similarity and allergen auditing.
   - Initialized schema with `CREATE EXTENSION vector;` and table `merchant_catalog (id, item_code, name, category, unit_price, allergens, embedding vector(384))`.
2. **Cloud Order Sync & Ledger**:
   - Stores finalized orders in `customer_orders_sync` while preserving customer data sovereignty.
   - Fully provisioned, queried, and managed via **Tiger MCP** (`db_query`, `service_list`, `service_get`).

---

## 5. Source Code & Live Links

- **GitHub Repository**: [https://github.com/Shashank-blip/OrderSift](https://github.com/Shashank-blip/OrderSift)
- **Tiger Service ID**: `i9n4pdf1ga` (Region: `us-east-1`, PostgreSQL 18.6 + `pgvector`)
- **License**: MIT

