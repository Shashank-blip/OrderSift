import Dexie, { type Table } from "dexie";
import { ParsedOrder } from "@/lib/types/order";

class OrderSiftDatabase extends Dexie {
  orders!: Table<ParsedOrder, string>;

  constructor() {
    super("OrderSiftDB");
    this.version(1).stores({
      orders: "id, orderNumber, status, createdAt, [status+createdAt]"
    });
  }
}

// Lazy instantiate only on client
let dbInstance: OrderSiftDatabase | null = null;

export function getDb(): OrderSiftDatabase {
  if (typeof window === "undefined") {
    // Return empty mock during SSR
    return {} as OrderSiftDatabase;
  }
  if (!dbInstance) {
    dbInstance = new OrderSiftDatabase();
  }
  return dbInstance;
}
