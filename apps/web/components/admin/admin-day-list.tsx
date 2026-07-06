"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ExternalLink, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput, SortSelect, Pagination } from "./admin-controls";
import { deleteDay } from "@/app/admin/content-actions";
import { useAdminKeyboard } from "./use-admin-keyboard";

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  slug: string;
  publishAt: Date;
  expiresAt: Date;
};

const STATUS_STYLES = {
  live: { dot: "bg-green-500", label: "live" },
  expired: { dot: "bg-muted-foreground/30", label: "expired" },
  scheduled: { dot: "bg-yellow-500", label: "scheduled" },
} as const;

type Status = keyof typeof STATUS_STYLES;

function getStatus(expiresAt: Date, publishAt: Date, now: number): Status {
  if (expiresAt.getTime() < now) return "expired";
  if (publishAt.getTime() > now) return "scheduled";
  return "live";
}

function canDelete(status: Status, publishAt: Date): boolean {
  const now = Date.now();
  if (status === "expired") return true;
  if (status === "scheduled") return publishAt.getTime() - now > 2 * 60 * 60 * 1000;
  return false;
}

export function AdminDayList({
  days, total, page, totalPages, q, sort,
}: {
  days: Day[]; total: number; page: number; totalPages: number; q?: string; sort?: string;
}) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const now = Date.now();
  useAdminKeyboard();

  return (
    <section>
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-mono text-xs text-primary">days ({total})</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none sm:w-48">
            <SearchInput param="q" placeholder="Search days..." />
          </div>
          <SortSelect
            param="sort"
            options={[
              { value: "date", label: "Newest" },
              { value: "title", label: "A → Z" },
              { value: "status", label: "Status" },
            ]}
          />
        </div>
      </div>
      <div className="divide-y divide-border rounded-sm border border-border">
        {days.map((d) => {
          const status = getStatus(d.expiresAt, d.publishAt, now);
          const { dot, label } = STATUS_STYLES[status];
          const deletable = canDelete(status, d.publishAt);

          return (
            <div key={d.id} className="flex items-center justify-between p-3 text-sm gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-mono text-xs text-muted-foreground">
                  {d.dayNumber}
                </div>
                <span className="text-foreground truncate">{d.title}</span>
                <span className={cn("inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-full", {
                  "bg-green-500/10 text-green-400": status === "live",
                  "bg-muted-foreground/10 text-muted-foreground": status === "expired",
                  "bg-yellow-500/10 text-yellow-400": status === "scheduled",
                })}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/day/${d.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground" title="View">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/admin/days/${d.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
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
                    <button onClick={() => setShowConfirm(d.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
        {days.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">{q ? "No days match your search." : "No days published yet."}</p>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} param="page" />
    </section>
  );
}
