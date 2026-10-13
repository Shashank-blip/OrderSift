export const ORDER_EXTRACTION_SYSTEM_PROMPT = `You are OrderSift, a deterministic structured data extraction AI specialized in parsing unstructured customer messages into e-commerce / small business orders.

You extract:
1. Customer info (name, phone, email, delivery address).
2. Line items (exact item name, quantity, estimated unit price if mentioned, notes/customizations/allergies).
3. Delivery details (requested date, time window, special instructions).
4. Missing critical fields that a merchant would need to clarify before fulfilling the order.
5. A polite, natural 1-click WhatsApp/DM clarification message to the customer asking for any missing fields.

CRITICAL RULES:
- Return ONLY a valid JSON object matching the requested schema. No markdown formatting, no commentary.
- If information is not mentioned in the message, set the field to null or empty string, do NOT hallucinate details.
- Quantities should be numbers (e.g. "a dozen" = 12, "two" = 2, "a pair" = 2).
- Detect allergies and critical preferences inside item notes or special instructions.
- Keep dates and times as the customer wrote them (e.g. "Saturday", "next Tuesday", "Friday Oct 24th") in deliveryDate / deliveryTime. Pickup dates count as deliveryDate.
- A name in a greeting ("Hey Sarah!") is usually the merchant, not the customer. Only set customer.name when the sender identifies themselves.
- Keep the unit the customer used in the item notes (e.g. "boxes", "dozen") when quantity counts packages.
`;

export const ORDER_JSON_SCHEMA = {
  type: "object",
  properties: {
    customer: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" }
      }
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          notes: { type: "string" }
        },
        required: ["name", "quantity"]
      }
    },
    currency: { type: "string" },
    deliveryDate: { type: "string" },
    deliveryTime: { type: "string" },
    specialInstructions: { type: "string" },
    missingFields: {
      type: "array",
      items: { type: "string" }
    },
    suggestedFollowUp: { type: "string" },
    confidenceScore: { type: "number" }
  },
  required: ["customer", "items", "missingFields", "suggestedFollowUp"]
};

export const SAMPLE_MESSAGES = [
  {
    title: "Bakery Order (WhatsApp)",
    tags: ["Allergy Alert", "Missing Date"],
    text: `Hey Sarah! Can I please get 2 boxes of chocolate fudge cupcakes and 1 red velvet birthday cake with "Happy 30th Dave" written in gold? My nephew has a severe peanut allergy so please make sure completely nut free! We will pick it up on Saturday around 2pm. Call my mobile 555-0199 when ready.`
  },
  {
    title: "Catering Inquiry (Instagram DM)",
    tags: ["High Value", "Missing Address"],
    text: `Hi!! Wondering if you can cater our team lunch next Tuesday? Looking for 15 grilled chicken sourdough paninis, 5 vegan avocado wraps, and 20 bottles of cold brew coffee. Can you send an invoice over to accounting@acmecorp.io? Name is Marcus Vance. What would the total be with delivery?`
  },
  {
    title: "Custom Apparel (SMS)",
    tags: ["Customization", "Missing Contact"],
    text: `Need 5 custom embroidered hoodies in size Large (forest green, retro serif font "EST. 2024" on chest) and 3 in Medium (charcoal black). Need these shipped to 742 Evergreen Terrace, Springfield by Friday Oct 24th.`
  }
];
