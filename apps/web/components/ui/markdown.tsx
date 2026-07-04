"use client";

import ReactMarkdown from "react-markdown";

function Markdown({ children }: { children: string }) {
  return (
    <div className="[&>p]:mb-3 [&>p:last-child]:mb-0 [&>h1]:text-xl [&>h1]:font-serif [&>h1]:font-semibold [&>h1]:mb-4 [&>h2]:text-lg [&>h2]:font-serif [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-serif [&>h3]:font-semibold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>li]:leading-relaxed [&>p]:leading-relaxed [&>strong]:text-foreground [&>em]:italic [&>code]:font-mono [&>code]:text-primary [&>code]:bg-background/60 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-background [&>pre]:border [&>pre]:border-border [&>pre]:rounded-lg [&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>blockquote]:border-l-2 [&>blockquote]:border-primary/40 [&>blockquote]:pl-4 [&>blockquote]:text-muted-foreground [&>blockquote]:italic [&>a]:text-primary [&>a]:underline [&>a]:decoration-primary/30 [&>a]:hover:decoration-primary [&>hr]:border-border [&>hr]:my-4">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

export { Markdown };
