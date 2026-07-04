"use client";

import { useState, useCallback } from "react";

type PanelKey = "video" | "notes" | "tabs" | "quiz";

const DEFAULT_ORDER: PanelKey[] = ["video", "notes", "tabs", "quiz"];

function loadOrder(): PanelKey[] {
  if (typeof window === "undefined") return DEFAULT_ORDER;
  try {
    const raw = localStorage.getItem("trice_panel_order");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    }
  } catch {}
  return DEFAULT_ORDER;
}

function saveOrder(order: PanelKey[]) {
  try { localStorage.setItem("trice_panel_order", JSON.stringify(order)); } catch {}
}

export function DayLayout({ panels }: { panels: Record<PanelKey, React.ReactNode> }) {
  const [order, setOrder] = useState<PanelKey[]>(loadOrder);
  const [dragging, setDragging] = useState<PanelKey | null>(null);

  const handleDragStart = useCallback((key: PanelKey) => {
    setDragging(key);
  }, []);

  const handleDrop = useCallback((target: PanelKey) => {
    if (!dragging || dragging === target) { setDragging(null); return; }
    setOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragging);
      const toIdx = next.indexOf(target);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragging);
      saveOrder(next);
      return next;
    });
    setDragging(null);
  }, [dragging]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
      {order.map((key) => {
        const isTop = key === "video" || key === "notes";
        return (
          <div
            key={key}
            draggable
            onDragStart={() => handleDragStart(key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(key)}
            className={cn(
              "min-h-0 transition-opacity",
              isTop ? "lg:col-span-6" : "lg:col-span-12",
              dragging === key && "opacity-50",
            )}
          >
            <PanelShell>
              {panels[key]}
            </PanelShell>
          </div>
        );
      })}
    </div>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type DayLayoutProps = {
  panels: Record<PanelKey, React.ReactNode>;
};
