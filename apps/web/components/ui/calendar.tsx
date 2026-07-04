"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-3",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center pt-1 relative items-center font-mono text-xs text-foreground",
        caption_label: "text-xs",
        nav: "flex items-center gap-1 absolute inset-x-0 top-1",
        button_previous: "absolute left-1 h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
        button_next: "absolute right-1 h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
        weekday: "font-mono text-[10px] text-muted-foreground w-8 h-8",
        weeks: "flex flex-col gap-0.5",
        week: "flex w-full gap-0.5",
        day: cn(
          "h-8 w-8 text-center text-xs rounded-sm cursor-pointer",
          "font-mono text-muted-foreground hover:bg-primary/20 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        ),
        day_button: "h-full w-full",
        selected: "bg-primary/20 text-foreground",
        today: "text-primary",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/20 pointer-events-none",
        hidden: "invisible",
      }}
      {...props}
    />
  );
}

export { Calendar, type CalendarProps };
