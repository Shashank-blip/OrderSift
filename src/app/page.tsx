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
  Cpu,
  ArrowUpRight,
  LockKeyhole
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
    <main className="max-w-7xl mx-auto px-5 sm:px-8 py-6 lg:py-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-7 border-b border-stone-900/15 mb-12">
        <div>
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-baseline space-x-3">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">OrderSift</h1>
                <span className="eyebrow">private order desk</span>
              </div>
              <p className="text-xs text-stone-500">A quieter way to turn conversation into action.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OllamaStatusBadge
            status={ollamaStatus}
            loading={checkingHealth}
            onRefresh={fetchHealth}
          />
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 mr-2">
            <LockKeyhole className="w-3.5 h-3.5 text-amber-700" />
            <span>Nothing leaves this device</span>
          </div>
          <a
            href="https://github.com/Shashank-blip/OrderSift"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 bg-stone-900 hover:bg-amber-700 text-white rounded-md transition"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <section className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3">The daily view</p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.04] tracking-tight text-stone-900">
          Make sense of the messages<br className="hidden sm:block" /> waiting in your inbox.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
          Paste a customer conversation. Get a clean, editable order without sending private details to another cloud.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-900/15 border border-stone-900/15 mb-10">
        <div className="bg-[#f7f6f2] p-5 flex items-start space-x-3">
          <div className="text-amber-700 pt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Private by default</h4>
            <p className="text-xs text-stone-500 mt-1">Messages stay on your machine.</p>
          </div>
        </div>

        <div className="bg-[#f7f6f2] p-5 flex items-start space-x-3">
          <div className="text-amber-700 pt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Local intelligence</h4>
            <p className="text-xs text-stone-500 mt-1">Ollama first, fallback always.</p>
          </div>
        </div>

        <div className="bg-[#f7f6f2] p-5 flex items-start space-x-3">
          <div className="text-amber-700 pt-0.5">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">A useful ledger</h4>
            <p className="text-xs text-stone-500 mt-1">Saved locally, ready to export.</p>
          </div>
        </div>
      </section>

      {/* Main Parser Input */}
      <section className="mb-10">
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
      <footer className="mt-16 pt-7 border-t border-stone-900/15 flex flex-col sm:flex-row justify-between gap-2 text-xs text-stone-500">
        <p>
          <strong className="text-stone-700">OrderSift</strong> · Local order desk
        </p>
        <p className="text-stone-400">
          Ollama · IndexedDB · MIT
        </p>
      </footer>
    </main>
  );
}
