"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Status = "live" | "expired" | "scheduled";

const STATUS_STYLES: Record<Status, string> = {
  live: "bg-green-500",
  expired: "bg-muted-foreground/30",
  scheduled: "bg-yellow-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", STATUS_STYLES[status])} />
      {status}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search..."}
      className="h-9 w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}
