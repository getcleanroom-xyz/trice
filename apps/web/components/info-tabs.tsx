"use client";

import { useState } from "react";
import { Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import { DragHandle } from "@/components/panel-handles";

export function InfoTabs({
  intro,
  objectives,
  summary,
  task,
}: {
  intro: string;
  objectives: string[];
  summary: string;
  task?: string;
}) {
  const [tab, setTab] = useState<"intro" | "objectives" | "summary" | "task">("intro");
  const [minimized, setMinimized] = useState(false);

  const tabs = [
    { id: "intro" as const, label: "Intro" },
    { id: "objectives" as const, label: "Objectives" },
    { id: "summary" as const, label: "Summary" },
    ...(task ? [{ id: "task" as const, label: "Task" }] : []),
  ];

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      <DragHandle />
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
        <div className="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-thin">
          <div className="text-[14px] leading-relaxed text-foreground/90">
            {tab === "intro" && <Markdown>{intro}</Markdown>}
            {tab === "objectives" && (
              <ul className="space-y-2 pl-5 list-disc marker:text-primary/50">
                {objectives.map((o, i) => (
                  <li key={i} className="leading-relaxed"><Markdown>{o}</Markdown></li>
                ))}
              </ul>
            )}
            {tab === "summary" && <Markdown>{summary}</Markdown>}
            {tab === "task" && task && <Markdown>{task}</Markdown>}
          </div>
        </div>
      )}
    </div>
  );
}
