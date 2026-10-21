import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20": variant === "default",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "bg-destructive/10 text-destructive border border-destructive/20": variant === "destructive",
          "border border-border text-foreground": variant === "outline",
          "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20": variant === "success",
          "bg-amber-500/10 text-amber-600 border border-amber-500/20": variant === "warning",
          "bg-sky-500/10 text-sky-600 border border-sky-500/20": variant === "info",
          "bg-purple-500/10 text-purple-600 border border-purple-500/20": variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
