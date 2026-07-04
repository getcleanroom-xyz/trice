"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      showOutsideDays={false}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      classNames={{
        months: "flex flex-col gap-3",
        month: "flex flex-col gap-2",
        month_caption:
          "flex justify-center pt-1 relative items-center font-mono text-xs text-foreground",
        nav: "flex items-center gap-1 absolute inset-x-0 top-1",
        button_previous:
          "absolute left-1 h-6 w-6 inline-flex items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground hover:bg-secondary",
        button_next:
          "absolute right-1 h-6 w-6 inline-flex items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground hover:bg-secondary",
        weekdays: "flex",
        weekday:
          "font-mono text-[10px] text-muted-foreground/60 w-8 h-8 flex items-center justify-center",
        month_grid: "border-collapse",
        weeks: "",
        week: "",
        day: cn(
          "h-8 w-8 text-center text-xs align-middle",
          "font-mono text-muted-foreground",
        ),
        day_button: cn(
          "h-8 w-8 inline-flex items-center justify-center rounded-sm",
          "hover:bg-primary/20 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        ),
        selected: "bg-primary/20 text-foreground [&_button]:text-foreground",
        today: "text-primary [&_button]:text-primary",
        outside: "text-muted-foreground/20",
        disabled: "text-muted-foreground/10 pointer-events-none",
        hidden: "invisible",
      }}
      {...props}
    />
  );
}

export { Calendar, type CalendarProps };
