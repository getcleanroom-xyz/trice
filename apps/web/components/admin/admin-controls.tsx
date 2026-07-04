"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

function SearchInput({ placeholder, param }: { placeholder?: string; param: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get(param) ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        className="h-9 w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <button type="submit" className="h-9 shrink-0 rounded-sm border border-input px-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary">Go</button>
    </form>
  );
}

function SortSelect({ param, options }: { param: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? options[0].value;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === options[0].value) params.delete(param);
    else params.set(param, value);
    params.delete("page");
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Pagination({ page, totalPages, param }: { page: number; totalPages: number; param: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete(param);
    else params.set(param, String(p));
    router.push(`/admin?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 pt-4 font-mono text-xs">
      <button
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="px-2 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          className={`h-7 w-7 rounded-sm text-xs font-mono ${p === page ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="px-2 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
}

function AdminTabs({ activeTab }: { activeTab: "topics" | "days" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (tab === "topics") params.delete("tab");
    else params.set("tab", tab);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 border-b border-border mb-4">
      <button
        onClick={() => switchTab("topics")}
        className={`px-4 py-2 text-xs font-mono border-b-2 transition-colors ${activeTab === "topics" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
      >
        Topics
      </button>
      <button
        onClick={() => switchTab("days")}
        className={`px-4 py-2 text-xs font-mono border-b-2 transition-colors ${activeTab === "days" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
      >
        Days
      </button>
    </div>
  );
}

export { SearchInput, SortSelect, Pagination, Tabs, AdminTabs };
