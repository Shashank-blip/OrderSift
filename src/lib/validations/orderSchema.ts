import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  name: z.string().min(1, "Item name cannot be empty"),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().optional().default(0),
  totalPrice: z.number().optional().default(0),
  notes: z.string().optional(),
});

export const customerInfoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export const parsedOrderSchema = z.object({
  customer: customerInfoSchema,
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  currency: z.string().default("USD"),
  subtotal: z.number().default(0),
  deliveryFee: z.number().optional().default(0),
  total: z.number().default(0),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  specialInstructions: z.string().optional(),
  missingFields: z.array(z.string()).default([]),
  suggestedFollowUp: z.string().optional(),
  confidenceScore: z.number().min(0).max(100).default(85),
});

export function detectMissingFields(data: Partial<z.infer<typeof parsedOrderSchema>>): string[] {
  const missing: string[] = [];

  if (!data.customer?.name || data.customer.name.trim() === "") {
    missing.push("Customer Name");
  }

  if (!data.customer?.phone || data.customer.phone.trim() === "") {
    missing.push("Customer Phone / Contact");
  }

  if (!data.deliveryDate || data.deliveryDate.trim() === "") {
    missing.push("Delivery / Pickup Date");
  }

  if (!data.customer?.address && data.specialInstructions?.toLowerCase().includes("deliver")) {
    missing.push("Delivery Address");
  }

  if (!data.items || data.items.length === 0) {
    missing.push("Item specifications");
  }

  return missing;
}

export function generateFollowUpMessage(
  customerName: string | undefined,
  missingFields: string[],
  businessName: string = "our shop"
): string {
  const greeting = customerName ? `Hi ${customerName}!` : "Hi there!";

  if (missingFields.length === 0) {
    return `${greeting} Thanks for your order with ${businessName}! We've logged all your details and will begin preparing it shortly.`;
  }

  const itemsList = missingFields.map((f) => `• ${f}`).join("\n");

  return `${greeting} Thanks so much for reaching out to ${businessName}! We received your request. To confirm your order and get it queued, could you please confirm:\n\n${itemsList}\n\nThanks a lot!`;
}
