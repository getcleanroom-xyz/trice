"use client";

import * as React from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function DateTimePicker({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const dateValue = (() => {
    if (!value || value.length < 10) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  })();

  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(dateValue?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = React.useState(dateValue?.getMonth() ?? new Date().getMonth());
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const today = new Date();
  const isBefore = (d: Date) => {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  function selectDate(d: Date) {
    const h = dateValue?.getHours() ?? 7;
    const m = dateValue?.getMinutes() ?? 0;
    d.setHours(h, m, 0, 0);
    onChange?.(toLocalString(d));
  }

  function selectTime(e: React.ChangeEvent<HTMLInputElement>) {
    if (!dateValue) return;
    const [h, m] = e.target.value.split(":").map(Number);
    const d = new Date(dateValue);
    d.setHours(h, m, 0, 0);
    onChange?.(toLocalString(d));
  }

  function prev() {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }

  function next() {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

  const displayValue = dateValue
    ? dateValue.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      + " at "
      + `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
    : placeholder ?? "Select date and time";

  const timeValue = dateValue
    ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
    : "07:00";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 rounded-sm border border-input bg-transparent px-3.5 py-2 text-left text-sm font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-muted-foreground text-sm">📅</span>
        <span className={dateValue ? "text-foreground" : "text-muted-foreground"}>
          {displayValue}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 rounded-sm border border-border bg-card p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prev} className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-sm hover:bg-secondary text-xs">
              ←
            </button>
            <span className="font-mono text-sm text-foreground">
              {monthName} {viewYear}
            </span>
            <button type="button" onClick={next} className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-sm hover:bg-secondary text-xs">
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="w-8 h-7 flex items-center justify-center font-mono text-[10px] text-muted-foreground/60">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="w-8 h-8" />;
              const d = new Date(viewYear, viewMonth, day);
              const selected = dateValue?.getDate() === day && dateValue?.getMonth() === viewMonth && dateValue?.getFullYear() === viewYear;
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const disabled = isBefore(d);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => { selectDate(d); setOpen(false); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-mono
                    ${disabled ? "text-muted-foreground/20 pointer-events-none" : "hover:bg-primary/20"}
                    ${selected ? "bg-primary/20 text-foreground" : "text-muted-foreground"}
                    ${isToday ? "text-primary" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <label className="mb-1.5 block font-mono text-[10px] text-muted-foreground">time</label>
            <input
              type="time"
              value={timeValue}
              onChange={selectTime}
              className="flex h-9 w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { DateTimePicker };
