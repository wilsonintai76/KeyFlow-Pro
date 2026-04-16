"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BlinkingLEDProps {
  color?: "green" | "red" | "amber" | "blue";
  size?: "sm" | "md" | "lg";
  speed?: number; // ms for half-cycle (default 500ms = 1s full blink)
  label?: string;
  className?: string;
}

const colorMap = {
  green: { bg: "bg-emerald-500", glow: "shadow-emerald-500/50" },
  red: { bg: "bg-rose-500", glow: "shadow-rose-500/50" },
  amber: { bg: "bg-amber-500", glow: "shadow-amber-500/50" },
  blue: { bg: "bg-blue-500", glow: "shadow-blue-500/50" },
};

const sizeMap = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export function BlinkingLED({
  color = "green",
  size = "md",
  speed = 500,
  label,
  className,
}: BlinkingLEDProps) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setOn((prev) => !prev), speed);
    return () => clearInterval(interval);
  }, [speed]);

  const colors = colorMap[color];
  const dimensions = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full transition-opacity duration-150",
          dimensions,
          colors.bg,
          on ? `opacity-100 ${colors.glow} shadow-md` : "opacity-20 shadow-none"
        )}
      />
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
