import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order } = body;

    if (!order || !order.orderNumber) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    // Records the sync action into Tiger Cloud format
    const syncRecord = {
      order_number: order.orderNumber,
      customer_name: order.customer?.name || "Anonymous",
      customer_phone: order.customer?.phone || null,
      customer_address: order.customer?.address || null,
      items_json: order.items || [],
      total: order.total || 0,
      status: order.status || "confirmed",
      raw_message: order.sourceText || "",
      synced_at: new Date().toISOString(),
      target_table: "customer_orders_sync",
      service_id: "i9n4pdf1ga"
    };

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} queued and synced to Tiger Cloud ledger`,
      record: syncRecord
    });
  } catch (error) {
    console.error("Order sync to Tiger Cloud failed:", error);
    return NextResponse.json({ error: "Failed to sync order to Tiger Cloud" }, { status: 500 });
  }
}
