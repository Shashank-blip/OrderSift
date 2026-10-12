"use client";

import React, { useState } from "react";
import { Sparkles, MessageSquare, ArrowRight, CornerDownLeft } from "lucide-react";
import { SAMPLE_MESSAGES } from "@/lib/ai/prompts";

interface MessageInputSectionProps {
  onParse: (text: string) => Promise<void>;
  isLoading: boolean;
}

export function MessageInputSection({ onParse, isLoading }: MessageInputSectionProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onParse(inputText);
  };

  const handleSelectSample = (sampleText: string) => {
    setInputText(sampleText);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Paste Messy Customer Message</h2>
            <p className="text-xs text-slate-500">From WhatsApp, Instagram DM, SMS, or Email</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-400">
          <span>Local processing only</span>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mb-3">
        <span className="text-xs font-medium text-slate-500 mr-2">Try a realistic sample:</span>
        <div className="inline-flex flex-wrap gap-2 mt-1">
          {SAMPLE_MESSAGES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample.text)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium border border-slate-200/60"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 'Hey Sarah! Can I get 2 boxes of chocolate cupcakes for Saturday 2pm? Call 555-0199 when ready...'"
            rows={4}
            className="w-full text-sm text-slate-800 placeholder-slate-400 bg-slate-50/70 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white transition-all outline-none resize-none font-normal"
          />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Open-weight Qwen 2.5 extracts items, allergens, contacts & missing data</span>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl shadow-sm transition-all shadow-brand-600/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extracting Order...</span>
              </>
            ) : (
              <>
                <span>Sift into Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
