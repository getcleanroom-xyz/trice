import { DragHandle } from "@/components/drag-handle";

export function VideoPanel({ title, videoUrl }: { title: string; videoUrl: string }) {
  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-card p-3">
      <DragHandle />
      <div className="mb-3 flex-1 overflow-hidden rounded-sm bg-background">
        <iframe
          src={videoUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <h1 className="font-serif text-base text-foreground">{title}</h1>
    </div>
  );
}
