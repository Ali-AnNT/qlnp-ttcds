import * as React from "react";

import { cn } from "@/shared/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "lma-flex lma-min-h-[80px] lma-w-full lma-rounded-md lma-border lma-border-input lma-bg-background lma-px-3 lma-py-2 lma-text-sm lma-ring-offset-background placeholder:lma-text-muted-foreground focus-visible:outline-none focus-visible:lma-ring-2 focus-visible:lma-ring-ring focus-visible:lma-ring-offset-2 disabled:lma-cursor-not-allowed disabled:lma-opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
