"use client";

import React from "react";
import { Cpu, CheckCircle2, AlertCircle, RefreshCw } from "@/components/Icons";
import { OllamaHealthStatus } from "@/lib/ai/ollama";

interface OllamaStatusBadgeProps {
  status: OllamaHealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export function OllamaStatusBadge({ status, loading, onRefresh }: OllamaStatusBadgeProps) {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Checking local AI engine...</span>
      </div>
    );
  }

  if (status?.isAvailable) {
    const providerLabel = status.provider === "groq" 
      ? "Groq Cloud" 
      : status.provider === "openai-compatible" 
      ? "Open-Weight API" 
      : "Ollama Connected";

    return (
      <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>{providerLabel}: <strong className="font-semibold">{status.model}</strong></span>
        <button
          onClick={onRefresh}
          title="Refresh connection"
          className="ml-1 text-emerald-600 hover:text-emerald-900 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs bg-amber-50 text-amber-900 px-3 py-1.5 rounded-full border border-amber-200 font-medium">
      <Cpu className="w-4 h-4 text-amber-600" />
      <span>Using Built-in Fast Parser (Ollama offline)</span>
      <button
        onClick={onRefresh}
        title="Check Ollama status"
        className="ml-1 text-amber-700 hover:text-amber-950 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
}
