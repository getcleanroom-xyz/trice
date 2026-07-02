"use client";

import { useEffect, useRef, useState } from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const DEFAULT_LAYOUT: Layout = [
  { i: "video", x: 0, y: 0, w: 7, h: 9 },
  { i: "notes", x: 7, y: 0, w: 5, h: 9 },
  { i: "tabs", x: 0, y: 9, w: 12, h: 6 },
  { i: "quiz", x: 0, y: 15, w: 12, h: 8 },
];

// Free-form drag + resize, autosaved (debounced) per device rather than per
// browser — see proxy.ts for the device-token cookie and app/api/layout for
// the persistence endpoint. `panels` keys must match DEFAULT_LAYOUT's `i`
// values so a first-time visitor (no saved layout yet) still renders
// correctly. `useContainerWidth` replaces the old WidthProvider HOC, which
// react-grid-layout v2 removed in favor of this hook.
export function DayLayout({ panels }: { panels: Record<string, React.ReactNode> }) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const loadedFromServer = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/layout")
      .then((r) => r.json())
      .then((data) => {
        if (data.layout) setLayout(data.layout);
      })
      .finally(() => {
        loadedFromServer.current = true;
      });
  }, []);

  function onLayoutChange(next: Layout) {
    setLayout(next);
    if (!loadedFromServer.current) return; // don't save the layout we just loaded back over itself

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: next.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
        }),
      }).catch(() => {
        // Best-effort: a failed autosave just means the layout reverts to
        // its last saved state next visit — not worth surfacing to the
        // reader mid-lesson.
      });
    }, 600);
  }

  return (
    <div ref={containerRef} className="mb-7">
      {mounted && (
        <GridLayout
          layout={layout}
          width={width}
          gridConfig={{ cols: 12, rowHeight: 24, margin: [16, 16] }}
          dragConfig={{ enabled: true, bounded: false, handle: ".drag-handle" }}
          onLayoutChange={onLayoutChange}
        >
          {Object.entries(panels).map(([key, node]) => (
            <div key={key} className="h-full overflow-auto">
              {node}
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
