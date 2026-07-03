"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function RadioItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-item"
      className={cn(
        "aspect-square h-3.5 w-3.5 rounded-full border border-border cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator />
    </RadioGroupPrimitive.Item>
  );
}

function RadioInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      className={cn("h-3.5 w-3.5 cursor-pointer accent-primary", className)}
      {...props}
    />
  );
}

export { RadioGroup, RadioItem, RadioInput };
