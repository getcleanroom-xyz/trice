"use client";

import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

function LivePreview({
  title,
  videoUrls,
  intro,
  objectives,
  summary,
  notes,
  task,
}: {
  title: string;
  videoUrls: { url: string }[];
  intro: string;
  objectives: { value: string }[];
  summary: string;
  notes: string;
  task: string;
}) {
  const hasContent = title || intro || objectives.length > 0 || summary || notes || videoUrls.length > 0;

  return (
    <div className="rounded-sm border border-border bg-card p-4 text-sm">
      <p className="mb-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">subscriber preview</p>

      {!hasContent && (
        <p className="text-muted-foreground/50 text-xs">Start filling in fields to see a preview.</p>
      )}

      {title && (
        <h2 className="mb-3 font-serif text-lg text-foreground">{title}</h2>
      )}

      {videoUrls.filter((v) => v.url).length > 0 && (
        <div className="mb-3 space-y-2">
          {videoUrls.filter((v) => v.url).map((v, i) => (
            <div key={i} className="aspect-video overflow-hidden rounded-sm bg-background">
              <iframe
                src={v.url}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      )}

      {intro && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] text-primary">intro</p>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            <Markdown>{intro}</Markdown>
          </div>
        </div>
      )}

      {objectives.filter((o) => o.value).length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] text-primary">objectives</p>
          <ul className="list-disc pl-5 text-[13px] leading-relaxed text-muted-foreground">
            {objectives.filter((o) => o.value).map((o, i) => (
              <li key={i}>{o.value}</li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] text-primary">summary</p>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            <Markdown>{summary}</Markdown>
          </div>
        </div>
      )}

      {notes && (
        <div className="mt-4 rounded-sm border border-border bg-secondary p-3 -rotate-1">
          <p className="mb-1 font-mono text-[9px] text-primary">my notes</p>
          <div className="font-serif text-xs italic leading-relaxed text-foreground/90">
            <Markdown>{notes}</Markdown>
          </div>
        </div>
      )}

      {task && (
        <div className="mt-3 rounded-sm border border-border bg-background p-3">
          <p className="mb-1 font-mono text-[9px] text-primary">task</p>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            <Markdown>{task}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

export { LivePreview };
