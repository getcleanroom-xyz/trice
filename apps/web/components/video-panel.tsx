import { DragHandle } from "@/components/drag-handle";

export function VideoPanel({ title, videoUrls }: { title: string; videoUrls: string[] }) {
  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-card p-3">
      <DragHandle />
      <div className="flex flex-1 flex-col gap-3 overflow-auto rounded-sm">
        {videoUrls.map((url, i) => (
          <div key={i} className="aspect-video overflow-hidden rounded-sm bg-background">
            <iframe
              src={url}
              title={`${title} — video ${i + 1}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
      <h1 className="mt-3 font-serif text-base text-foreground">{title}</h1>
    </div>
  );
}
