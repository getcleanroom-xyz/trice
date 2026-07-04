import { Pin } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

export function NoteCard({ notes }: { notes: string }) {
  return (
    <div className="relative h-full -rotate-1 rounded-sm border border-border bg-secondary p-4 overflow-hidden">
      <Pin
        aria-hidden
        className="absolute top-6 left-4 h-4 w-4 -rotate-45 text-primary"
      />
      <p className="mb-2 font-mono text-[9px] tracking-wide text-primary">my notes</p>
      <div className="font-serif text-sm italic leading-relaxed text-foreground/90 overflow-hidden">
        <Markdown>{notes}</Markdown>
      </div>
    </div>
  );
}
