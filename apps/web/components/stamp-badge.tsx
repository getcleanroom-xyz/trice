import { cn } from "@/lib/utils";

// The signature device of the whole product: content expiry rendered as an
// old library due-date stamp, not a countdown-timer paywall trick.
export function StampBadge({
  expiresAt,
  className,
}: {
  expiresAt: Date;
  className?: string;
}) {
  const label = expiresAt.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span
      className={cn(
        "inline-block rounded-sm bg-primary px-2 py-1 font-mono text-[9px] font-medium tracking-wide text-primary-foreground",
        className,
      )}
    >
      DUE {label}
    </span>
  );
}
