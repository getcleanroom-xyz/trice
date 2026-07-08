"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function TopicFilter({ topic, allTopics }: { topic: string | undefined; allTopics: { id: string; title: string }[] }) {
  function onChange(value: string) {
    const p = new URLSearchParams(window.location.search);
    p.set("tab", "days");
    if (value) p.set("topic", value);
    else p.delete("topic");
    p.delete("page");
    window.location.search = p.toString();
  }

  return (
    <Select value={topic ?? ""} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[160px] text-xs">
        <SelectValue placeholder="All topics" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All topics</SelectItem>
        {allTopics.map((t) => (
          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
