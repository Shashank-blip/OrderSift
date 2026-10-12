import Dexie, { type Table } from "dexie";
import { ParsedOrder } from "@/lib/types/order";

export class OrderSiftDatabase extends Dexie {
  orders!: Table<ParsedOrder, string>;

  constructor() {
    super("OrderSiftDB");
    this.version(1).stores({
      orders: "id, orderNumber, status, createdAt, [status+createdAt]"
    });
  }
}

export const db = new OrderSiftDatabase();
