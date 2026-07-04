"use client";

import ReactMarkdown from "react-markdown";

function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_code]:font-mono [&_code]:text-primary [&_code]:bg-background [&_code]:px-1 [&_code]:rounded-sm [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-sm [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:font-serif [&_h1]:text-lg [&_h2]:font-serif [&_h2]:text-base [&_h3]:font-serif [&_h3]:text-sm [&_strong]:text-foreground [&_em]:italic [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

export { Markdown };
