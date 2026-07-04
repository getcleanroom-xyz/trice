import { Pin } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

export function NoteCard({ notes }: { notes: string }) {
  return (
    <div className="relative h-full flex flex-col rounded-lg border border-border/60 bg-secondary/50 -rotate-[0.4deg] group">
      <Pin aria-hidden className="absolute top-5 left-4 h-3.5 w-3.5 -rotate-45 text-primary/60" />
      <p className="px-4 pt-4 pb-1 pl-8 font-mono text-[10px] tracking-wider text-primary/70 uppercase">
        my notes
      </p>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 scrollbar-thin">
        <div className="font-serif text-[13px] italic leading-relaxed text-foreground/80">
          <Markdown>{notes}</Markdown>
        </div>
      </div>
    </div>
  );
}
