# OrderSift

> **From messy messages to orders you can act on.**  
> Local-first, privacy-preserving order extraction engine powered by open-weight AI (Ollama + Qwen 2.5 Instruct) and IndexedDB.

Built for the **DEV "Side Hustle" Challenge: Open-Source AI Edition**.

---

## The Problem

Solo creators, home bakers, caterers, custom craftsmen, and micro-merchants receive order requests scattered across:
- **WhatsApp chats**
- **Instagram Direct Messages**
- **SMS & Email threads**

These messages are notoriously messy:
> *"Hey! Need 2 dozen choc fudge cupcakes for Saturday 3pm please. No nuts my nephew is allergic! Pls deliver to 742 Evergreen Terr, Springfield. Call me at 555-0199 when outside."*

Merchants spend hours manually transcribing, deciphering, checking missing fields, and calculating totals—or worse, lose customer data in chaotic chat histories. Existing tools require sending customer data to closed proprietary cloud LLMs with expensive per-token fees and privacy risks.

---

## The Solution: OrderSift

OrderSift parses raw, messy conversation fragments into structured, validated JSON orders in seconds, with **zero cloud data leakage** and **zero marginal API costs**:

1. **Local-First Inference**: Runs 100% locally using **Ollama** and **Qwen 2.5 Instruct** (or built-in fallback engine). Customer names, phone numbers, and delivery addresses never leave the device.
2. **Deterministic Schema Validation**: Validates extracted orders via **Zod schemas**, flagging missing essential fields (e.g. delivery date, phone number).
3. **Smart Follow-Up Generator**: Generates 1-click polite clarification messages to send back to customers when details are missing.
4. **Local IndexedDB Persistence**: Zero-setup local database stored directly in the merchant's browser with Dexie.js.
5. **Actionable Exports**: 1-click export to **CSV**, **Structured JSON**, or direct printable receipt views.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Local AI Engine**: Ollama running `qwen2.5:latest` (or `qwen2.5:3b`, `qwen2.5:7b`) with native JSON Schema output mode
- **Data Persistence**: IndexedDB via Dexie.js (offline-ready, zero-cloud storage)
- **Validation**: Zod runtime schema validation and missing-field auditor

---

## Getting Started

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org/)
- Optional (for real local AI inference): [Ollama](https://ollama.com/)

```bash
# Pull and start Qwen 2.5
ollama run qwen2.5:latest
```

### 2. Install & Run OrderSift

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
