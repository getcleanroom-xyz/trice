export function DragHandle() {
  return (
    <div className="drag-handle flex cursor-grab items-center justify-center gap-[3px] py-2 hover:bg-secondary/50 transition-colors rounded-t-lg">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-[3px]">
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
        </div>
      ))}
    </div>
  );
}

export function ResizeHandle() {
  return (
    <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
      <svg className="w-5 h-5 text-muted-foreground/40" viewBox="0 0 10 10">
        <path d="M9 1v8M5 5h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
