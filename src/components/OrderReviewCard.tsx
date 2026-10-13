"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  User,
  Save,
  MessageCircle
} from "@/components/Icons";
import { ParsedOrder, OrderItem } from "@/lib/types/order";
import { formatCurrency } from "@/lib/utils";

interface OrderReviewCardProps {
  order: Partial<ParsedOrder>;
  modelUsed?: string;
  onSaveOrder: (order: ParsedOrder) => void;
  onDiscard: () => void;
}

export function OrderReviewCard({ order: initialOrder, modelUsed, onSaveOrder, onDiscard }: OrderReviewCardProps) {
  const [order, setOrder] = useState<Partial<ParsedOrder>>(initialOrder);
  const [copiedFollowUp, setCopiedFollowUp] = useState(false);
  const [matchingCatalog, setMatchingCatalog] = useState(false);
  const [matchedAlert, setMatchedAlert] = useState<string | null>(null);

  const autoMatchedRef = useRef(false);

  const handleMatchWithTigerCatalog = async (onlyUnpriced = false) => {
    const currentItems = order.items || [];
    if (currentItems.length === 0) return;
    setMatchingCatalog(true);
    setMatchedAlert(null);
    try {
      const res = await fetch("/api/catalog/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: currentItems.map((i) =>
            /\b(box|boxes|pack|dozen)\b/i.test(i.notes || "") ? `${i.name} ${i.notes}` : i.name
          )
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      let updatedCount = 0;
      const newItems = [...currentItems];
      data.results.forEach((matchResult: any, idx: number) => {
        const existing = newItems[idx];
        if (!matchResult.matched || !existing) return;
        if (onlyUnpriced && (existing.unitPrice || 0) > 0) return;
        updatedCount++;
        const item = matchResult.matched;
        const allergenNote = item.allergens?.length ? `Allergens: ${item.allergens.join(", ")}` : "";
        const notes = allergenNote && !(existing.notes || "").includes("Allergens:")
          ? [existing.notes, allergenNote].filter(Boolean).join(" | ")
          : existing.notes;
        newItems[idx] = {
          ...existing,
          name: item.name,
          unitPrice: item.unit_price,
          totalPrice: (existing.quantity || 1) * item.unit_price,
          notes
        };
      });
      const newSubtotal = newItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      setOrder((prev) => ({
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        total: newSubtotal + (Number(prev.deliveryFee) || 0)
      }));

      if (updatedCount > 0) {
        setMatchedAlert(
          data.source === "tiger-cloud"
            ? `Priced ${updatedCount} item(s) from your Tiger Cloud catalog. Review before saving.`
            : `Priced ${updatedCount} item(s) from the built-in catalog (Tiger Cloud unavailable: ${data.error}).`
        );
      }
    } catch (e) {
      console.error("Tiger catalog match failed:", e);
    } finally {
      setMatchingCatalog(false);
    }
  };

  useEffect(() => {
    if (autoMatchedRef.current) return;
    autoMatchedRef.current = true;
    if ((initialOrder.items || []).some((i) => !i.unitPrice)) {
      handleMatchWithTigerCatalog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCustomer = (field: keyof NonNullable<ParsedOrder["customer"]>, value: string) => {
    setOrder((prev) => ({
      ...prev,
      customer: {
        ...(prev.customer || {}),
        [field]: value
      }
    }));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...(order.items || [])];
    const item = { ...updatedItems[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      item.totalPrice = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }
    updatedItems[index] = item;

    const newSubtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
    const newTotal = newSubtotal + (Number(order.deliveryFee) || 0);

    setOrder((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newTotal
    }));
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: "New Item",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    const updatedItems = [...(order.items || []), newItem];
    setOrder((prev) => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index: number) => {
    const updatedItems = (order.items || []).filter((_, idx) => idx !== index);
    const newSubtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
    const newTotal = newSubtotal + (Number(order.deliveryFee) || 0);

    setOrder((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newTotal
    }));
  };

  const handleCopyFollowUp = () => {
    if (order.suggestedFollowUp) {
      navigator.clipboard.writeText(order.suggestedFollowUp);
      setCopiedFollowUp(true);
      setTimeout(() => setCopiedFollowUp(false), 2000);
    }
  };

  const handleFinalSave = () => {
    const finalOrder: ParsedOrder = {
      id: order.id || Math.random().toString(36).substring(2, 11),
      orderNumber: order.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceText: order.sourceText || "",
      customer: order.customer || {},
      items: order.items || [],
      subtotal: order.subtotal || 0,
      deliveryFee: order.deliveryFee || 0,
      total: order.total || order.subtotal || 0,
      currency: order.currency || "USD",
      deliveryDate: order.deliveryDate || "",
      deliveryTime: order.deliveryTime || "",
      specialInstructions: order.specialInstructions || "",
      missingFields: order.missingFields || [],
      suggestedFollowUp: order.suggestedFollowUp || "",
      confidenceScore: order.confidenceScore || 85,
      status: "confirmed",
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSaveOrder(finalOrder);
  };

  const missingFields = order.missingFields || [];

  return (
    <div className="paper-card overflow-hidden mb-10 transition-all">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="eyebrow !text-amber-300">
          01 / review
          </span>
          <span className="text-sm font-medium text-stone-300">
            Inference: <span className="text-white font-mono">{modelUsed || "Qwen 2.5 Instruct"}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onDiscard}
            className="text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-md border border-stone-700 hover:border-stone-500 transition"
          >
            Discard
          </button>
          <button
            onClick={handleFinalSave}
            className="inline-flex items-center space-x-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold px-4 py-1.5 rounded-md transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Confirm & Save to Local DB</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Missing Fields Warning Banner */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">
                  Missing Details Detected ({missingFields.length})
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {missingFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-medium"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {order.suggestedFollowUp && (
              <button
                onClick={handleCopyFollowUp}
                className="shrink-0 inline-flex items-center space-x-2 text-xs font-medium px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition active:scale-95"
              >
                {copiedFollowUp ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied 1-Click Clarification!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Copy Customer Follow-up</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Customer & Delivery Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
          {/* Customer Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Details</span>
            </h3>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500 font-medium">Customer Name</label>
                <input
                  type="text"
                  value={order.customer?.name || ""}
                  onChange={(e) => updateCustomer("name", e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-sm font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Phone</label>
                  <input
                    type="text"
                    value={order.customer?.phone || ""}
                    onChange={(e) => updateCustomer("phone", e.target.value)}
                    placeholder="Phone number"
                    className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Email</label>
                  <input
                    type="email"
                    value={order.customer?.email || ""}
                    onChange={(e) => updateCustomer("email", e.target.value)}
                    placeholder="Email address"
                    className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Delivery Address</label>
                <input
                  type="text"
                  value={order.customer?.address || ""}
                  onChange={(e) => updateCustomer("address", e.target.value)}
                  placeholder="Full street address (or pickup)"
                  className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Fulfillment & Schedule</span>
            </h3>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Date</label>
                  <input
                    type="text"
                    value={order.deliveryDate || ""}
                    onChange={(e) => setOrder({ ...order, deliveryDate: e.target.value })}
                    placeholder="e.g. Saturday, Oct 25"
                    className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Time Window</label>
                  <input
                    type="text"
                    value={order.deliveryTime || ""}
                    onChange={(e) => setOrder({ ...order, deliveryTime: e.target.value })}
                    placeholder="e.g. 2:00 PM"
                    className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Special Instructions / Allergies</label>
                <textarea
                  rows={2}
                  value={order.specialInstructions || ""}
                  onChange={(e) => setOrder({ ...order, specialInstructions: e.target.value })}
                  placeholder="e.g. Peanut allergy! Leave on porch."
                  className="w-full text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Extracted Order Items</h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleMatchWithTigerCatalog()}
                disabled={matchingCatalog}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition"
                title="Match items with Tiger Cloud merchant catalog via pgvector"
              >
                <span>{matchingCatalog ? "Matching..." : "🐯 Match with Tiger Catalog"}</span>
              </button>
              <button
                onClick={addItem}
                className="inline-flex items-center space-x-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Item</span>
              </button>
            </div>
          </div>

          {matchedAlert && (
            <div className="mb-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center justify-between">
              <span>{matchedAlert}</span>
              <button onClick={() => setMatchedAlert(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Item & Customizations</th>
                  <th className="py-2.5 px-4 font-semibold w-24">Qty</th>
                  <th className="py-2.5 px-4 font-semibold w-28">Unit Price</th>
                  <th className="py-2.5 px-4 font-semibold w-28">Total</th>
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        className="w-full font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none px-1"
                      />
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) => updateItem(idx, "notes", e.target.value)}
                        placeholder="Notes, allergies, inscription..."
                        className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none px-1 mt-1"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        className="w-20 text-center py-1 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice || ""}
                          placeholder="0.00"
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                          className="w-20 py-1 px-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(item.totalPrice || 0)}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Delivery Fee</span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={order.deliveryFee || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const fee = Number(e.target.value) || 0;
                      setOrder({
                        ...order,
                        deliveryFee: fee,
                        total: (order.subtotal || 0) + fee
                      });
                    }}
                    className="w-20 py-0.5 px-2 bg-white border border-slate-200 rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-brand-600">{formatCurrency(order.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
