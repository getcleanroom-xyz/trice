import { Pin } from "lucide-react";
import { DragHandle } from "@/components/drag-handle";

// Pinned, constant, and visually distinct from the video-info tabs — see
// the daily page mockup. Rotation is intentionally tiny; dial `-rotate-1`
// down to `rotate-0` if it reads as too whimsical once you're living with
// it daily.
export function NoteCard({ notes }: { notes: string }) {
  return (
    <div className="relative h-full -rotate-1 rounded-sm border border-border bg-secondary p-4">
      <DragHandle />
      <Pin
        aria-hidden
        className="absolute top-6 left-4 h-4 w-4 -rotate-45 text-primary"
      />
      <p className="mb-2 font-mono text-[9px] tracking-wide text-primary">my notes</p>
      <p className="font-serif text-sm italic leading-relaxed text-foreground/90">
        {notes}
      </p>
    </div>
  );
}
