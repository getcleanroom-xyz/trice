"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Pencil, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteDay } from "@/app/admin/content-actions";
import { SearchInput, SortSelect, Pagination } from "./admin-controls";
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

function SortableDay({ day, onDelete }: { day: Day; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const now = Date.now();
  const status = getStatus(day.expiresAt, day.publishAt, now);
  const { dot, label } = STATUS_STYLES[status];
  const deletable = canDelete(status, day.publishAt);

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 text-sm gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-mono text-xs text-muted-foreground">
          {day.dayNumber}
        </div>
        <span className="text-foreground truncate">{day.title}</span>
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
        <Link href={`/day/${day.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground" title="View">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/admin/days/${day.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        {deletable && (
          <button onClick={() => onDelete(day.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function DraggableDayList({
  days, total, page, totalPages, q, sort, topicId, onReorder,
}: {
  days: Day[]; total: number; page: number; totalPages: number; q?: string; sort?: string; topicId?: string;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const router = useRouter();
  const [local, setLocal] = useState(days);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  useAdminKeyboard();

  if (local !== days) setLocal(days);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = local.findIndex((d) => d.id === active.id);
    const newIdx = local.findIndex((d) => d.id === over.id);
    const next = [...local];
    next.splice(newIdx, 0, next.splice(oldIdx, 1)[0]);
    setLocal(next);
    onReorder(next.map((d) => d.id));
    router.refresh();
  }

  const enableDnd = !!topicId;

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={enableDnd ? handleDragEnd : () => {}}>
        <SortableContext items={enableDnd ? local.map((d) => d.id) : []} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border rounded-sm border border-border">
            {local.map((d) => (
              enableDnd ? (
                <SortableDay key={d.id} day={d} onDelete={(id) => setConfirmId(id)} />
              ) : (
                <div key={d.id} className="flex items-center justify-between p-3 text-sm gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-mono text-xs text-muted-foreground">
                      {d.dayNumber}
                    </div>
                    <span className="text-foreground truncate">{d.title}</span>
                    <span className={cn("inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-full", {
                      "bg-green-500/10 text-green-400": (() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return s === "live"; })(),
                      "bg-muted-foreground/10 text-muted-foreground": (() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return s === "expired"; })(),
                      "bg-yellow-500/10 text-yellow-400": (() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return s === "scheduled"; })(),
                    })}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", (() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return STATUS_STYLES[s].dot; })())} />
                      {(() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return STATUS_STYLES[s].label; })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/day/${d.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    <Link href={`/admin/days/${d.id}/edit`} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></Link>
                    {(() => { const s = getStatus(d.expiresAt, d.publishAt, Date.now()); return canDelete(s, d.publishAt); })() && (
                      <button onClick={() => setConfirmId(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              )
            ))}
            {local.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">{q ? "No days match your search." : "No days yet."}</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
      <Pagination page={page} totalPages={totalPages} param="page" />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-sm border border-border bg-background p-6 max-w-sm mx-4">
            <p className="text-sm text-foreground mb-4">Delete this day? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-sm">Cancel</button>
              <form action={deleteDay}>
                <input type="hidden" name="id" value={confirmId} />
                <button type="submit" className="px-3 py-1.5 text-xs text-destructive border border-destructive/50 rounded-sm">Delete</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
