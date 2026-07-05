"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function Badge({
  publishAt,
  expiresAt,
  className,
}: {
  publishAt?: Date;
  expiresAt: Date;
  className?: string;
}) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const isLive = publishAt ? publishAt.getTime() <= now && expiresAt.getTime() > now : expiresAt.getTime() > now;
  const isExpired = expiresAt.getTime() <= now;

  if (isExpired) {
    return (
      <span className={cn("inline-block rounded-sm bg-muted px-2 py-1 font-mono text-[9px] font-medium tracking-wide text-muted-foreground", className)}>
        expired
      </span>
    );
  }

  if (isLive) {
    const remaining = expiresAt.getTime() - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const timeStr = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;

    return (
      <span className={cn("inline-block rounded-sm bg-green-500/15 px-2 py-1 font-mono text-[9px] font-medium tracking-wide text-green-400", className)}>
        {timeStr}
      </span>
    );
  }

  const label = expiresAt.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span className={cn("inline-block rounded-sm bg-primary/15 px-2 py-1 font-mono text-[9px] font-medium tracking-wide text-primary", className)}>
      due {label}
    </span>
  );
}

export { Badge as StampBadge };
