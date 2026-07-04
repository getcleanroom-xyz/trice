"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";
import { SearchInput, Pagination } from "./admin-controls";
import { deleteTopic, topicHasDays } from "@/app/admin/content-actions";

type Topic = { id: string; title: string; description: string; sortOrder: number };

export function AdminTopicList({
  topics, total, page, totalPages, q,
}: {
  topics: Topic[]; total: number; page: number; totalPages: number; q?: string;
}) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs text-primary">topics ({total})</h2>
        <div className="w-48"><SearchInput param="q" placeholder="Search topics..." /></div>
      </div>
      <div className="divide-y divide-border rounded-sm border border-border">
        {topics.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">{t.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/admin/topics/${t.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit topic">
                <Pencil className="h-3.5 w-3.5" />
              </Link>
              {showConfirm === t.id ? (
                <form action={deleteTopic} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={t.id} />
                  <span className="text-xs text-destructive">Delete?</span>
                  <button type="submit" className="text-xs text-destructive font-mono hover:underline">yes</button>
                  <button type="button" onClick={() => setShowConfirm(null)} className="text-xs text-muted-foreground font-mono hover:underline">no</button>
                </form>
              ) : (
                <button onClick={() => setShowConfirm(t.id)} className="text-muted-foreground hover:text-destructive" title="Delete topic">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {topics.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">{q ? "No topics match your search." : "No topics yet."}</p>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} param="page" />
    </section>
  );
}
