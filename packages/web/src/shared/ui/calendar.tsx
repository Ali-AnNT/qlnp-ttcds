import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("lma-p-3", className)}
      classNames={{
        months: "lma-flex lma-flex-col sm:lma-flex-row lma-space-y-4 sm:lma-space-x-4 sm:lma-space-y-0",
        month: "lma-space-y-4",
        caption: "lma-flex lma-justify-center lma-pt-1 lma-relative lma-items-center",
        caption_label: "lma-text-sm lma-font-medium",
        nav: "lma-space-x-1 lma-flex lma-items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "lma-h-7 lma-w-7 lma-bg-transparent !lma-p-0 lma-opacity-50 hover:lma-opacity-100",
        ),
        nav_button_previous: "lma-absolute lma-left-1",
        nav_button_next: "lma-absolute lma-right-1",
        table: "lma-w-full lma-border-collapse lma-space-y-1",
        head_row: "lma-flex",
        head_cell:
          "lma-text-muted-foreground lma-rounded-md lma-w-9 lma-font-normal lma-text-[0.8rem]",
        row: "lma-flex lma-w-full lma-mt-2",
        cell: "lma-h-9 lma-w-9 lma-text-center lma-text-sm !lma-p-0 lma-relative [&:has([aria-selected].day-range-end)]:lma-rounded-r-md [&:has([aria-selected].day-outside)]:lma-bg-accent/50 [&:has([aria-selected])]:lma-bg-accent first:[&:has([aria-selected])]:lma-rounded-l-md last:[&:has([aria-selected])]:lma-rounded-r-md focus-within:lma-relative focus-within:lma-z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "lma-h-9 lma-w-9 !lma-p-0 lma-font-normal aria-selected:lma-opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "lma-bg-primary lma-text-primary-foreground hover:lma-bg-primary hover:lma-text-primary-foreground focus:lma-bg-primary focus:lma-text-primary-foreground",
        day_today: "lma-bg-accent lma-text-accent-foreground",
        day_outside:
          "day-outside lma-text-muted-foreground lma-opacity-50 aria-selected:lma-bg-accent/50 aria-selected:lma-text-muted-foreground aria-selected:lma-opacity-30",
        day_disabled: "lma-text-muted-foreground lma-opacity-50",
        day_range_middle:
          "aria-selected:lma-bg-accent aria-selected:lma-text-accent-foreground",
        day_hidden: "lma-invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="lma-h-4 lma-w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="lma-h-4 lma-w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
