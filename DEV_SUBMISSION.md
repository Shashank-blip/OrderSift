*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

## What I Built

**OrderSift turns messy customer messages into orders you can actually act on.**

If you run a small food or craft business, your "order system" is probably your phone. Orders arrive as WhatsApp messages, Instagram DMs, texts, and emails, and every one is written differently. Here's a real-looking one:

> Hey Sarah! Can I please get 2 boxes of chocolate fudge cupcakes and 1 red velvet birthday cake with "Happy 30th Dave" written in gold? My nephew has a severe peanut allergy so please make sure completely nut free! We will pick it up on Saturday around 2pm. Call my mobile 555-0199 when ready.

A baker reading that has to pull out the items, the inscription, the pickup time, the phone number, and (most importantly) the allergy. Then they have to notice what *isn't* there: the customer never said their name. Miss one detail and you've baked the wrong cake, or worse.

You paste the message into OrderSift and get back an editable order card:

- **Line items** with quantities and customizations ("with 'Happy 30th Dave' written in gold").
- **Pickup date, time, and phone**, pulled out of the prose.
- **Allergy warnings** surfaced in special instructions, so they can't hide in the middle of a paragraph.
- **Prices filled in automatically** from the merchant's catalog. "2 boxes of chocolate fudge cupcakes" matches the 6-pack box SKU, not the single cupcake.
- **A missing-details check** that flags what you still need (here, the customer's name) and writes a polite follow-up message you can copy straight back into the chat.
- **A local order ledger** with statuses (draft, confirmed, preparing, ready, delivered) and CSV/JSON export for your spreadsheet or accountant.

**Who would pay for it?** Home bakers, caterers, custom-apparel sellers, and anyone else taking orders through chat apps. They have too many orders to keep in their head, but they're too small for a POS system or Shopify, and they don't want to make customers fill out a form. The time saved is easy to measure: every order that comes in as a message gets typed up by someone. The cost of a mistake is even easier: one missed allergy note costs more than a year of a small subscription.

## Demo

**Live app:** https://order-sift.vercel.app

Try one of the built-in sample messages (bakery, catering inquiry, custom hoodies) or paste your own. The badge at the top shows which model is serving the request.

<!-- Add 2–3 screenshots here: the input box, the parsed bakery order card with prices filled in, and the ledger. -->

## Code

{% embed https://github.com/Shashank-blip/OrderSift %}

## How I Built It

OrderSift is a Next.js 14 (App Router) + TypeScript app. The AI part is deliberately small and swappable:

**1. Open-weight models only.** Extraction runs on open-weight models through a provider chain, all on the server:

- **Groq** serving **`openai/gpt-oss-120b`** (Apache 2.0) for the hosted demo. Groq is fast enough that parsing feels instant, which matters when you have twenty DMs to get through.
- **Any OpenAI-compatible endpoint** (Together, OpenRouter, a self-hosted vLLM box), configured by environment variable.
- **Ollama** for fully local inference, e.g. `qwen2.5` or `gpt-oss:20b` on the merchant's own laptop. Ollama's `format` parameter takes a JSON schema, so the model is constrained to valid output.
- **A rule-based fallback parser** so the app still produces a rough draft when no model is reachable. It's clearly labeled as a fallback, because a draft with gaps is more honest than a confident guess.

The app doesn't hard-code which Groq models exist. It asks Groq which models the API key can use and picks the best available one from a preference list. I learned this the hard way: my first deploy kept silently falling back to the rule-based parser because a hard-coded model ID had been retired. Now any fallback shows its reason right in the UI (`Heuristic fallback — Groq: HTTP 404 ...`), which turned an hour of guessing into a one-line fix.

**2. Schema first, model second.** The model gets a system prompt with extraction rules and the full JSON schema for an order. A few of those rules came from watching it get things wrong:

- *A name in a greeting ("Hey Sarah!") is usually the merchant, not the customer.* Without this, the model cheerfully assigned the baker's name to the customer.
- *Keep dates as the customer wrote them.* "Saturday" is more useful to a baker than a guessed calendar date.
- *Keep the unit ("boxes", "dozen") in the item notes*, so catalog matching can price a box rather than a single cupcake.

The model's output then goes through a normalizing step (prices or quantities that come back as strings, missing arrays, stray markdown fences) before deterministic code computes totals and missing fields. I don't let the LLM do arithmetic or decide what's "required".

**3. Catalog matching for prices and allergens.** Customers never use the merchant's product names. A matcher scores each extracted item against the catalog, handling plurals and words like "boxes", and fills in the SKU name, unit price, and allergen list. It only fills items that don't already have a price, so anything the merchant typed is never overwritten. If nothing matches (say, "blueberry muffins"), the item stays unpriced instead of getting a guess.

**4. Local-first storage.** Saved orders live in the browser's IndexedDB via Dexie. There's no account and no server-side order database by default; the merchant's ledger is on their device and exports to CSV/JSON.

**5. Tiger Data as the merchant's back office.** The catalog and the cloud ledger live in a Tiger Cloud service (PostgreSQL + TimescaleDB). I built it entirely from my editor through the Tiger MCP server, without opening a dashboard: create the service, apply [`scripts/setup-tiger.sql`](https://github.com/Shashank-blip/OrderSift/blob/main/scripts/setup-tiger.sql), seed products, and inspect rows while debugging. When I realized "2 boxes of cupcakes" was being priced as two single cupcakes, adding the 6-pack SKU was one `db_query` call. At runtime, the app talks to Tiger directly through `pg`:

- **Catalog matching** reads `merchant_catalog` live, so a merchant changes a price in one place and the next parsed order uses it. If the database is unreachable, the app falls back to a built-in catalog and says so in the UI.
- **"Sync to Tiger Cloud"** upserts confirmed orders from the browser into `customer_orders_sync`, keyed by order number. The local ledger stays the source of truth on the device, and Tiger gives the merchant a copy they can query, back up, or open on a second device.

The catalog table already has a `vector(384)` column. The next step is filling it with embeddings so matching works on meaning ("fudge buns" → cupcakes), not just keywords.

**6. Deployment.** One Dockerfile (multi-stage, standalone Next.js output, non-root user) plus a `docker-compose.yml` that points at Ollama on the host, so a merchant can self-host the whole thing. The public demo runs on Vercel.

## Why Does Open Innovation Matter?

For a side-hustle tool, open weights are the business model, not a nice-to-have.

**The same model can run anywhere.** `gpt-oss` runs on Groq for the hosted demo, and the same model family runs on a merchant's laptop through Ollama. Switching is an environment variable, not a rewrite. A closed API gives you exactly one place to run it, at that vendor's price.

**Privacy is a real choice, not a promise.** Order messages are full of personal data: names, phone numbers, home addresses, and health information like allergies. With the hosted demo, that text goes to an inference provider. With the self-hosted Docker + Ollama setup, it never leaves the merchant's machine. I can only offer that second option because the weights are open. With a closed model, "trust us" is the only privacy policy available.

**The cost floor is near zero.** A baker parsing a couple hundred messages a month shouldn't be paying a per-token bill that grows with their success. Open-weight models on cheap hosted inference (or free local inference) let OrderSift be priced like a small tool, not like a cloud bill.

**No single point of failure.** When my first hosted model ID disappeared, the fix was to pick another open model from the list. Because multiple providers serve the same open weights, no single provider can deprecate my product out from under me.

## My Agent Session

<!-- Optional: save the session with DevRelay and embed it with the agent_session tag from the challenge page, or delete this section. -->

## Prize Categories

- **Best Use of Tiger Data**
