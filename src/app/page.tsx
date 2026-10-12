"use client";

import React, { useState, useEffect } from "react";
import { MessageInputSection } from "@/components/MessageInputSection";
import { OrderReviewCard } from "@/components/OrderReviewCard";
import { OrdersDashboard } from "@/components/OrdersDashboard";
import { OllamaStatusBadge } from "@/components/OllamaStatusBadge";
import { ParsedOrder } from "@/lib/types/order";
import { OllamaHealthStatus } from "@/lib/ai/ollama";
import { db } from "@/lib/db/dexie";
import {
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  Cpu,
  Layers,
  ArrowUpRight
} from "lucide-react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [activeDraft, setActiveDraft] = useState<Partial<ParsedOrder> | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("");
  const [orders, setOrders] = useState<ParsedOrder[]>([]);

  const fetchHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/parse");
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
      }
    } catch (e) {
      console.error("Health check error:", e);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadSavedOrders = async () => {
    if (typeof window === "undefined") return;
    try {
      const allOrders = await db.orders.orderBy("createdAt").reverse().toArray();
      setOrders(allOrders);
    } catch (err) {
      console.error("Failed to load orders from IndexedDB:", err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchHealth();
    loadSavedOrders();
  }, []);

  if (!isMounted) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  const handleParseMessage = async (text: string) => {
    setIsParsing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model: ollamaStatus?.model || "qwen2.5:latest"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to parse message");
      }

      const data = await res.json();
      setActiveDraft({
        ...data.order,
        sourceText: text
      });
      setModelUsed(data.modelUsed);
    } catch (err) {
      console.error("Extraction failed:", err);
      alert("Failed to parse message. Please check the console or ensure your message contains order details.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveOrder = async (finalOrder: ParsedOrder) => {
    try {
      await db.orders.put(finalOrder);
      await loadSavedOrders();
      setActiveDraft(null);
    } catch (err) {
      console.error("Failed to save order into IndexedDB:", err);
      alert("Error saving order to local storage.");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await db.orders.delete(id);
      await loadSavedOrders();
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: ParsedOrder["status"]) => {
    try {
      await db.orders.update(id, { status, updatedAt: new Date().toISOString() });
      await loadSavedOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">OrderSift</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-md">
                  Local-First AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">From messy messages to orders you can act on.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OllamaStatusBadge
            status={ollamaStatus}
            loading={checkingHealth}
            onRefresh={fetchHealth}
          />
          <a
            href="https://github.com/Shashank-blip/OrderSift"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition shadow-sm"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Value Prop Pill Badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">100% Privacy by Design</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Customer phone numbers, addresses, and messages never touch cloud servers.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Zero Marginal API Cost</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Powered by open-weight Qwen 2.5 Instruct running on your own hardware.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">IndexedDB Persistence</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Offline-first local browser database. Export directly to CSV, JSON, or print.</p>
          </div>
        </div>
      </section>

      {/* Main Parser Input */}
      <section className="mb-8">
        <MessageInputSection
          onParse={handleParseMessage}
          isLoading={isParsing}
        />
      </section>

      {/* Active Extraction Card */}
      {activeDraft && (
        <section>
          <OrderReviewCard
            order={activeDraft}
            modelUsed={modelUsed}
            onSaveOrder={handleSaveOrder}
            onDiscard={() => setActiveDraft(null)}
          />
        </section>
      )}

      {/* Orders Ledger / Dashboard */}
      <section>
        <OrdersDashboard
          orders={orders}
          onDeleteOrder={handleDeleteOrder}
          onUpdateStatus={handleUpdateStatus}
        />
      </section>

      {/* Footer / Open Innovation Note */}
      <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
        <p>
          <strong>OrderSift</strong> • Built for the DEV Side Hustle Challenge: Open-Source AI Edition.
        </p>
        <p className="text-slate-400">
          Inference: Ollama + Qwen 2.5 Instruct • Database: Client-side IndexedDB • License: MIT
        </p>
      </footer>
    </main>
  );
}
