"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput, StatusBadge } from "./admin-ui";
import { deleteDay } from "@/app/admin/content-actions";

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  slug: string;
  publishAt: Date;
  expiresAt: Date;
};
type Topic = { id: string; title: string };

function getStatus(expiresAt: Date, publishAt: Date, now: number): "live" | "expired" | "scheduled" {
  if (expiresAt.getTime() < now) return "expired";
  if (publishAt.getTime() > now) return "scheduled";
  return "live";
}

function canDelete(status: "live" | "expired" | "scheduled", publishAt: Date): boolean {
  const now = Date.now();
  if (status === "expired") return true;
  if (status === "scheduled") {
    const twoHoursBefore = publishAt.getTime() - 2 * 60 * 60 * 1000;
    return now < twoHoursBefore;
  }
  return false;
}

export function AdminDayList({ days, topics }: { days: Day[]; topics: Topic[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "status">("date");
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const now = Date.now();

  const filtered = days
    .filter((d) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return d.title.toLowerCase().includes(q) || String(d.dayNumber).includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "date") return b.publishAt.getTime() - a.publishAt.getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const order = { live: 0, scheduled: 1, expired: 2 };
      return order[getStatus(a.expiresAt, a.publishAt, now)] - order[getStatus(b.expiresAt, b.publishAt, now)];
    });

  return (
    <section>
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-mono text-xs text-primary">days</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchInput value={query} onChange={setQuery} placeholder="Search days..." />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-sm border border-input bg-transparent px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="date">by date</option>
            <option value="title">by title</option>
            <option value="status">by status</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-border rounded-sm border border-border">
        {filtered.map((d) => {
          const status = getStatus(d.expiresAt, d.publishAt, now);
          const deletable = canDelete(status, d.publishAt);
          return (
            <div key={d.id} className="flex items-center justify-between p-3 text-sm gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={status} />
                <span className="text-foreground truncate">
                  day {d.dayNumber} &middot; {d.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/day/${d.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground" title="View day">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/admin/days/${d.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit day">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </Link>
                {deletable && (
                  showConfirm === d.id ? (
                    <form action={deleteDay} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={d.id} />
                      <span className="text-xs text-destructive">Delete?</span>
                      <button type="submit" className="text-xs text-destructive font-mono hover:underline">yes</button>
                      <button type="button" onClick={() => setShowConfirm(null)} className="text-xs text-muted-foreground font-mono hover:underline">no</button>
                    </form>
                  ) : (
                    <button onClick={() => setShowConfirm(d.id)} className="text-muted-foreground hover:text-destructive" title="Delete day">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">{days.length === 0 ? "No days published yet." : "No days match your search."}</p>
        )}
      </div>
    </section>
  );
}
