"use client";

import React, { useState } from "react";
import { ParsedOrder } from "@/lib/types/order";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Download,
  Trash2,
  Package
} from "@/components/Icons";

interface OrdersDashboardProps {
  orders: ParsedOrder[];
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: ParsedOrder["status"]) => void;
}

export function OrdersDashboard({ orders, onDeleteOrder, onUpdateStatus }: OrdersDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  const handleSyncToTigerCloud = async () => {
    if (orders.length === 0) return;
    setSyncingCloud(true);
    setCloudSyncMsg(null);
    try {
      let syncedCount = 0;
      for (const ord of orders) {
        const res = await fetch("/api/orders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: ord })
        });
        if (res.ok) syncedCount++;
      }
      setCloudSyncMsg(`Synced ${syncedCount} order(s) to Tiger Cloud (customer_orders_sync)`);
      setTimeout(() => setCloudSyncMsg(null), 4000);
    } catch (e) {
      console.error("Tiger sync error:", e);
      setCloudSyncMsg("Failed to sync to Tiger Cloud");
    } finally {
      setSyncingCloud(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = filterStatus === "all" || ord.status === filterStatus;
    const matchesSearch =
      (ord.customer.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const exportToCSV = () => {
    if (orders.length === 0) return;

    const headers = ["Order #", "Date Created", "Customer Name", "Phone", "Address", "Items", "Total", "Status"];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
      `"${o.customer.name || "N/A"}"`,
      `"${o.customer.phone || "N/A"}"`,
      `"${(o.customer.address || "").replace(/"/g, '""')}"`,
      `"${o.items.map((it) => `${it.quantity}x ${it.name}`).join("; ")}"`,
      o.total,
      `"${o.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OrderSift_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (orders.length === 0) return;
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `OrderSift_Orders_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="paper-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-2">02 / ledger</p>
          <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center space-x-2">
            <span>Orders in motion</span>
            <span className="text-xs font-sans bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
              {orders.length}
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">Your local ledger, not another dashboard in the cloud.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncToTigerCloud}
            disabled={orders.length === 0 || syncingCloud}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition disabled:opacity-40"
            title="Sync orders to Tiger Cloud PostgreSQL table customer_orders_sync"
          >
            <span>{syncingCloud ? "Syncing..." : "🐯 Sync to Tiger Cloud"}</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={orders.length === 0}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-amber-100 text-stone-700 rounded-md transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            disabled={orders.length === 0}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-amber-100 text-stone-700 rounded-md transition disabled:opacity-40"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {cloudSyncMsg && (
        <div className="mb-4 text-xs bg-emerald-50 text-emerald-850 border border-emerald-300 p-2.5 rounded-md flex items-center justify-between font-medium">
          <span>{cloudSyncMsg}</span>
          <button onClick={() => setCloudSyncMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer, order #, or item..."
          className="text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 flex-1"
        />

        <div className="flex gap-1.5">
          {["all", "confirmed", "preparing", "ready", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                filterStatus === status
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-amber-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-stone-300 rounded-lg">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-stone-600">No orders in the ledger</p>
          <p className="text-xs text-stone-400 mt-1">Paste a customer message above to make the first one.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredOrders.map((ord) => (
            <div key={ord.id} className="py-4 hover:bg-slate-50/50 rounded-xl px-3 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {ord.orderNumber}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {ord.customer.name || "Customer (Name Pending)"}
                    </span>
                    {ord.customer.phone && (
                      <span className="text-xs text-slate-500 font-mono">{ord.customer.phone}</span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    <span>
                      Items:{" "}
                      <strong className="text-slate-800">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </strong>
                    </span>
                    {ord.deliveryDate && (
                      <span className="text-slate-500">
                        📅 Due: <strong>{ord.deliveryDate}</strong> {ord.deliveryTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(ord.total)}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <select
                    value={ord.status}
                    onChange={(e) => onUpdateStatus(ord.id, e.target.value as ParsedOrder["status"])}
                    className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 capitalize"
                  >
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => onDeleteOrder(ord.id)}
                    title="Delete order"
                    className="text-slate-300 hover:text-red-500 p-1.5 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
