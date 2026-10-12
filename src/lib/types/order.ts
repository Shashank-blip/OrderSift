export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type OrderStatus = "draft" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export interface ParsedOrder {
  id: string;
  orderNumber: string;
  sourceText: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  deliveryDate?: string;
  deliveryTime?: string;
  specialInstructions?: string;
  missingFields: string[];
  suggestedFollowUp?: string;
  confidenceScore: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  details?: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}
