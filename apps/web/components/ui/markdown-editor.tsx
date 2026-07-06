"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { Bold, Italic, Heading, List, ListOrdered, Link, Eye, EyeOff } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

type ToolbarAction = {
  icon: typeof Bold;
  label: string;
  shortcut?: string;
  wrap: [string, string];
};

const TOOLBAR: ToolbarAction[] = [
  { icon: Bold, label: "Bold", shortcut: "Ctrl+B", wrap: ["**", "**"] },
  { icon: Italic, label: "Italic", shortcut: "Ctrl+I", wrap: ["*", "*"] },
  { icon: Heading, label: "Heading", wrap: ["\n## ", ""] },
  { icon: List, label: "Bullet list", wrap: ["\n- ", ""] },
  { icon: ListOrdered, label: "Ordered list", wrap: ["\n1. ", ""] },
  { icon: Link, label: "Link", wrap: ["[", "](url)"] },
];

function MarkdownEditor({ value, onChange, placeholder, minRows = 3 }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insert = useCallback((before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = before + selected + after;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    switch (e.key) {
      case "b": e.preventDefault(); insert("**", "**"); break;
      case "i": e.preventDefault(); insert("*", "*"); break;
    }
  }, [insert]);

  const handleTab = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + "  " + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2);
    });
  }, [value, onChange]);

  const lines = value ? value.split("\n").length : minRows;
  const rowCount = Math.max(minRows, Math.min(lines, 20));

  return (
    <div className="rounded-sm border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-center gap-0.5 border-b border-input px-1.5 py-1">
        {TOOLBAR.map((item) => (
          <button
            key={item.label}
            type="button"
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            onClick={() => insert(item.wrap[0], item.wrap[1])}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <item.icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            title={preview ? "Edit" : "Preview"}
            onClick={() => setPreview((p) => !p)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
              preview
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="px-3.5 py-2 text-sm text-foreground min-h-[80px]">
          {value ? (
            <Markdown>{value}</Markdown>
          ) : (
            <span className="text-muted-foreground">{placeholder ?? "Start typing..."}</span>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { handleTab(e); handleKeyDown(e); }}
          placeholder={placeholder}
          rows={rowCount}
          className="w-full resize-none bg-transparent px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      )}
    </div>
  );
}

export { MarkdownEditor };
