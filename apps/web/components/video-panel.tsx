export function VideoPanel({ title, videoUrls }: { title: string; videoUrls: string[] }) {
  return (
    <div className="flex h-full flex-col rounded-sm border border-border bg-card p-3 overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 min-h-0">
        {videoUrls.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-sm bg-background overflow-hidden">
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
      <h1 className="mt-3 font-serif text-base text-foreground truncate">{title}</h1>
    </div>
  );
}
