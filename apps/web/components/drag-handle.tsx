export function DragHandle() {
  return (
    <div className="drag-handle flex cursor-grab justify-center gap-1 py-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-muted-foreground/50" />
      ))}
    </div>
  );
}
