"use client";

import { useState } from "react";
import { Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DragHandle } from "@/components/drag-handle";
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
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <DragHandle />
      <div className="flex items-center border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-xs text-muted-foreground",
              tab === t.id && "border-b-2 border-primary text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? "Expand panel" : "Minimize panel"}
          className="ml-auto flex items-center px-4 text-muted-foreground"
        >
          {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
      </div>
      {!minimized && (
        <div className="p-4 text-[13px] leading-relaxed text-muted-foreground max-h-64 overflow-hidden">
          {tab === "intro" && <Markdown>{intro}</Markdown>}
          {tab === "objectives" && (
            <ul className="list-inside list-disc space-y-1">
              {objectives.map((o, i) => (
                <li key={i}><Markdown>{o}</Markdown></li>
              ))}
            </ul>
          )}
          {tab === "summary" && <Markdown>{summary}</Markdown>}
        </div>
      )}
    </div>
  );
}
