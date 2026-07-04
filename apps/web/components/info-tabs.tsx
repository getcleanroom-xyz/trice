"use client";

import { useState } from "react";
import { Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

export function InfoTabs({
  intro,
  objectives,
  summary,
}: {
  intro: string;
  objectives: string[];
  summary: string;
}) {
  const [tab, setTab] = useState<"intro" | "objectives" | "summary">("intro");
  const [minimized, setMinimized] = useState(false);

  const tabs = [
    { id: "intro" as const, label: "Intro" },
    { id: "objectives" as const, label: "Objectives" },
    { id: "summary" as const, label: "Summary" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-3 text-xs font-mono tracking-wide transition-colors",
              tab === t.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? "Expand panel" : "Minimize panel"}
          className="ml-auto flex items-center px-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
      </div>
      {!minimized && (
        <div className="p-5 max-h-80 overflow-y-auto scrollbar-thin">
          <div className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-foreground/90">
            {tab === "intro" && <Markdown>{intro}</Markdown>}
            {tab === "objectives" && (
              <ul className="space-y-1.5 pl-5 list-disc marker:text-primary/50">
                {objectives.map((o, i) => (
                  <li key={i} className="leading-relaxed"><Markdown>{o}</Markdown></li>
                ))}
              </ul>
            )}
            {tab === "summary" && <Markdown>{summary}</Markdown>}
          </div>
        </div>
      )}
    </div>
  );
}
