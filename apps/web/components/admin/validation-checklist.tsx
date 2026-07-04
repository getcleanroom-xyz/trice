"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckItem {
  label: string;
  done: boolean;
}

function ValidationChecklist({ items }: { items: CheckItem[] }) {
  const completed = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">readiness</p>
        <span className="font-mono text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-secondary mb-3">
        <div
          className="h-1 rounded-full bg-primary transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
            )}
            <span className={cn("text-xs", item.done ? "text-muted-foreground" : "text-muted-foreground/50")}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ValidationChecklist, type CheckItem };
