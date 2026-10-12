"use client";

import React, { useState } from "react";
import { MessageSquare, ArrowRight } from "@/components/Icons";
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
    <div className="paper-card p-6 sm:p-8 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">Start with the raw message</h2>
            <p className="text-xs text-stone-500">WhatsApp, Instagram, SMS, or email</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-400">
          <span className="eyebrow">01 / inbox</span>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mb-3">
        <span className="eyebrow mr-2">Try a sample</span>
        <div className="inline-flex flex-wrap gap-2 mt-1">
          {SAMPLE_MESSAGES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample.text)}
              className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 transition font-medium border border-stone-200"
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
            className="w-full text-sm leading-6 text-stone-800 placeholder-stone-400 bg-stone-50/80 border border-stone-200 rounded-lg p-4 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 focus:bg-white transition-all outline-none resize-none font-normal"
          />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            <span>Extracts items, contacts, dates, and missing details.</span>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-stone-900 hover:bg-amber-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-md transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Reading message...</span>
              </>
            ) : (
              <>
                <span>Make an order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
