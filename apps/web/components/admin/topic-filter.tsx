"use client";

export function TopicFilter({ topic, allTopics }: { topic: string | undefined; allTopics: { id: string; title: string }[] }) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <input type="hidden" name="tab" value="days" />
      <select
        name="topic"
        defaultValue={topic ?? ""}
        onChange={(e) => { const p = new URLSearchParams(window.location.search); p.set("topic", e.target.value); p.delete("page"); window.location.search = p.toString(); }}
        className="h-9 rounded-sm border border-input bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">All topics</option>
        {allTopics.map((t) => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>
      <noscript><button type="submit" className="h-9 rounded-sm border border-input px-3 text-xs text-muted-foreground">Go</button></noscript>
    </form>
  );
}
