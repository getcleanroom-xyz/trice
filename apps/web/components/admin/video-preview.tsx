"use client";

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

function VideoPreview({ urls }: { urls: string[] }) {
  const validUrls = urls.filter((u) => u.trim().length > 0);
  if (validUrls.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {validUrls.map((url, i) => {
        const thumb = getYouTubeThumbnail(url);
        return (
          <div key={i} className="relative h-16 w-28 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
            {thumb ? (
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                preview
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { VideoPreview };
