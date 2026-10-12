# OrderSift

OrderSift turns messy customer messages into clean, structured orders that a merchant can act on quickly.

> Turn chaotic chats into organized, valid orders with AI-powered extraction, local-first processing, and zero cloud leakage.

OrderSift is built for solo businesses, home bakers, caterers, and micro-merchants who receive orders over WhatsApp, Instagram DMs, email, and SMS. Instead of manually copying details from messy conversations, the app extracts useful order data, validates missing fields, and helps send smart follow-up questions back to the customer.

## Why this exists

Most small businesses are still handling orders by hand:

- reading long chat histories
- extracting item details and quantities
- reconciling delivery dates and contact info
- chasing missing information manually

This creates friction, mistakes, and lost revenue. OrderSift helps simplify that workflow with a local-first, privacy-conscious order intake assistant.

## What OrderSift does

- Extracts structured order data from messy, real-world messages
- Identifies product details, quantities, delivery dates, and customer contact data
- Validates required fields before an order is considered complete
- Generates polite follow-up prompts when something is missing
- Persists data locally for privacy and offline use
- Supports export to CSV, JSON, and printable summaries

## Key features

- Local-first AI inference with Ollama
- Structured output validation using Zod
- IndexedDB storage via Dexie
- Built with Next.js, React, TypeScript, and Tailwind CSS
- Designed for privacy: customer data stays local by default
- Optional integration with Tiger Data / PostgreSQL for catalog matching and cloud sync

## Tech stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Local AI: Ollama + Qwen 2.5 Instruct
- Persistence: Dexie + IndexedDB
- Validation: Zod
- Optional backend/data layer: Tiger Data (TimescaleDB / PostgreSQL with pgvector)

## Quick start

### Prerequisites

- Node.js 18+
- Optional: Ollama for local AI inference

### Install and run

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Optional: run local AI model

```bash
ollama run qwen2.5:latest
```

## How it works

1. A merchant pastes or inputs a raw customer message.
2. OrderSift analyzes the message and extracts JSON order data.
3. Required fields are checked and validated.
4. If information is missing, the app suggests a concise follow-up message.
5. The resulting order is saved locally and can be exported or reviewed later.

## Project structure

```text
.
├── app/
├── components/
├── lib/
├── public/
├── styles/
├── package.json
├── tsconfig.json
├── next.config.js
├── README.md
└── ...
```

## Notes

This project is designed as a local-first prototype and proof of concept. It prioritizes privacy, low-friction order handling, and practical merchant workflows over heavy cloud dependence.

## Contributing

Contributions are welcome. If you want to improve the extraction logic, UX, validation rules, or export flows, feel free to open an issue or submit a pull request.

## License

This project currently does not include a license file. If you plan to share or reuse it publicly, consider adding an appropriate open-source license.
