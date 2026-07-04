"use client";

import { useState, useCallback } from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const DEFAULT_LAYOUT: Layout = [
  { i: "video", x: 0, y: 0, w: 7, h: 10, minW: 4, minH: 6 },
  { i: "notes", x: 7, y: 0, w: 5, h: 7, minW: 3, minH: 4 },
  { i: "tabs", x: 0, y: 10, w: 12, h: 7, minW: 6, minH: 4 },
  { i: "quiz", x: 0, y: 17, w: 12, h: 8, minW: 6, minH: 4 },
];

function loadOrder(): Layout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem("trice_layout_v2");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: Layout) {
  try {
    localStorage.setItem("trice_layout_v2", JSON.stringify(
      layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
    ));
  } catch {}
}

export function DayLayout({ panels }: { panels: Record<string, React.ReactNode> }) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>(loadOrder);

  const onLayoutChange = useCallback((next: Layout) => {
    setLayout(next);
    saveLayout(next);
  }, []);

  return (
    <div ref={containerRef} className="mb-4">
      {mounted && width > 0 && (
        <GridLayout
          layout={layout}
          width={width}
          gridConfig={{ cols: 12, rowHeight: 28, margin: [12, 12] }}
          dragConfig={{
            enabled: true,
            bounded: true,
            handle: ".drag-handle",
            threshold: 3,
          }}
          resizeConfig={{
            enabled: true,
            handles: ["se"],
          }}
          onLayoutChange={onLayoutChange}
        >
          {Object.entries(panels).map(([key, node]) => (
            <div key={key} className="relative">
              {node}
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
