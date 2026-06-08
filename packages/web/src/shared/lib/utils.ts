import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// extendTailwindMerge preserves default classGroups — override destroys them
const customTwMerge = extendTailwindMerge({
  prefix: "lma-",
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
