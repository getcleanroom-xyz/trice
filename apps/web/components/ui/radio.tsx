"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Radio({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      className={cn(
        "h-3.5 w-3.5 cursor-pointer accent-primary border-border",
        className,
      )}
      {...props}
    />
  );
}

export { Radio };
