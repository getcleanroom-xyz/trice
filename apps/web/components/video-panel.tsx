export function VideoPanel({ title, videoUrls }: { title: string; videoUrls: string[] }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card group">
      <div className="flex flex-1 flex-col gap-3 p-4 min-h-0">
        {videoUrls.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg bg-background overflow-hidden">
            <iframe
              src={url}
              title={`${title} — video ${i + 1}`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
      <h2 className="px-4 pb-4 font-serif text-lg text-foreground leading-snug">{title}</h2>
    </div>
  );
}
