import { NextRequest, NextResponse } from "next/server";
import { getTigerPool, isTigerConfigured } from "@/lib/tiger/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isTigerConfigured()) {
    return NextResponse.json(
      { error: "Tiger Cloud sync is not configured (TIGER_DATABASE_URL is not set)" },
      { status: 503 }
    );
  }

  try {
    const { order } = await req.json();

    if (!order || !order.orderNumber) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const { rows } = await getTigerPool().query(
      `INSERT INTO customer_orders_sync
         (order_number, customer_name, customer_phone, customer_address, items_json, total, status, raw_message)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       ON CONFLICT (order_number) DO UPDATE SET
         customer_name = EXCLUDED.customer_name,
         customer_phone = EXCLUDED.customer_phone,
         customer_address = EXCLUDED.customer_address,
         items_json = EXCLUDED.items_json,
         total = EXCLUDED.total,
         status = EXCLUDED.status,
         raw_message = EXCLUDED.raw_message
       RETURNING id, order_number, created_at`,
      [
        order.orderNumber,
        order.customer?.name || null,
        order.customer?.phone || null,
        order.customer?.address || null,
        JSON.stringify(order.items || []),
        Number(order.total) || 0,
        order.status || "confirmed",
        order.sourceText || null
      ]
    );

    return NextResponse.json({ success: true, record: rows[0] });
  } catch (error) {
    console.error("Order sync to Tiger Cloud failed:", error);
    return NextResponse.json(
      { error: `Failed to sync order to Tiger Cloud: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
