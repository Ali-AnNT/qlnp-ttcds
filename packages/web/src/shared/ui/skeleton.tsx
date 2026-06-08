import { cn } from "@/shared/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("lma-animate-pulse lma-rounded-md lma-bg-muted", className)} {...props} />;
}

export { Skeleton };
