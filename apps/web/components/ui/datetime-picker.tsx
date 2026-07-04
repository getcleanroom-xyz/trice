"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

function pad(n: number) { return String(n).padStart(2, "0"); }

function toLocalString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DateTimePicker({
  value,
  onChange,
  placeholder,
  className,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const dateValue = (() => {
    if (!value || value.length < 10) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  })();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const hours = dateValue ? dateValue.getHours() : 7;
    const minutes = dateValue ? dateValue.getMinutes() : 0;
    date.setHours(hours, minutes);
    onChange?.(toLocalString(date));
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(":").map(Number);
    const d = dateValue ? new Date(dateValue) : new Date();
    d.setHours(h, m, 0, 0);
    onChange?.(toLocalString(d));
  }

  const displayDate = dateValue
    ? format(dateValue, "MMM d, yyyy 'at' HH:mm")
    : placeholder ?? "Pick date and time";

  const timeValue = dateValue
    ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
    : "07:00";

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger className="w-full justify-start gap-2 text-left font-normal">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className={dateValue ? "text-foreground" : "text-muted-foreground"}>
            {displayDate}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={{ before: new Date() }}
          />
          <div className="border-t border-border p-3">
            <Label htmlFor="dt-time" className="mb-1.5 block">time</Label>
            <Input
              id="dt-time"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="h-9 w-32"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateTimePicker };
