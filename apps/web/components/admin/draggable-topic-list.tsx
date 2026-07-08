"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteTopic } from "@/app/admin/content-actions";
import { SearchInput, Pagination } from "./admin-controls";

type Topic = { id: string; title: string; description: string; sortOrder: number };

function SortableTopic({ topic, onDelete }: { topic: Topic; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 text-sm gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate font-medium">{topic.title}</p>
          <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/admin/topics/${topic.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit topic">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button onClick={() => onDelete(topic.id)} className="text-muted-foreground hover:text-destructive" title="Delete topic">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DraggableTopicList({
  topics, total, page, totalPages, q, onReorder,
}: {
  topics: Topic[]; total: number; page: number; totalPages: number; q?: string;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [local, setLocal] = useState(topics);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = local.findIndex((t) => t.id === active.id);
    const newIdx = local.findIndex((t) => t.id === over.id);
    const next = [...local];
    next.splice(newIdx, 0, next.splice(oldIdx, 1)[0]);
    setLocal(next);
    onReorder(next.map((t) => t.id));
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs text-primary">topics ({total})</h2>
        <div className="w-48"><SearchInput param="q" placeholder="Search topics..." /></div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={local.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border rounded-sm border border-border">
            {local.map((t) => (
              <SortableTopic key={t.id} topic={t} onDelete={(id) => setConfirmId(id)} />
            ))}
            {local.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">{q ? "No topics match your search." : "No topics yet."}</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
      <Pagination page={page} totalPages={totalPages} param="page" />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-sm border border-border bg-background p-6 max-w-sm mx-4">
            <p className="text-sm text-foreground mb-4">Delete this topic? Days under it will be orphaned.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-sm">Cancel</button>
              <form action={deleteTopic}>
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
