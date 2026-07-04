"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { SearchInput } from "./admin-ui";
import { buttonVariants } from "@/components/ui/button";
import { deleteTopic } from "@/app/admin/content-actions";

type Topic = { id: string; title: string; description: string; sortOrder: number };

export function AdminTopicList({ topics }: { topics: Topic[] }) {
  const [query, setQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const filtered = topics.filter(
    (t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs text-primary">topics</h2>
        <div className="w-48">
          <SearchInput value={query} onChange={setQuery} placeholder="Search topics..." />
        </div>
      </div>
      <div className="divide-y divide-border rounded-sm border border-border">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm">
            <span className="text-foreground truncate mr-4">{t.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              {showConfirm === t.id ? (
                <form action={deleteTopic} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={t.id} />
                  <span className="text-xs text-destructive">Delete?</span>
                  <button type="submit" className="text-xs text-destructive font-mono hover:underline">yes</button>
                  <button type="button" onClick={() => setShowConfirm(null)} className="text-xs text-muted-foreground font-mono hover:underline">no</button>
                </form>
              ) : (
                <>
                  <button onClick={() => setShowConfirm(t.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete topic">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">{topics.length === 0 ? "No topics yet." : "No topics match your search."}</p>
        )}
      </div>
    </section>
  );
}
