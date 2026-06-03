import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

/** Display format for the input field (Vietnamese convention). */
const DEFAULT_DISPLAY_FORMAT = "dd/MM/yyyy";

export interface DatePickerProps {
  /** Controlled selected date. */
  date?: Date;
  /** Called when a valid date is selected (from calendar or typed input). */
  onSelect?: (date: Date | undefined) => void;
  /** Input placeholder text. */
  placeholder?: string;
  /** Disable calendar dates before this date. */
  fromDate?: Date;
  /** Disable calendar dates after this date. */
  toDate?: Date;
  /** Disable entire component (input + icon button). */
  disabled?: boolean;
  /** Display format for the input field (default "dd/MM/yyyy"). */
  formatStr?: string;
  /** date-fns locale for Calendar month/day names (default Vietnamese). */
  locale?: Locale;
  /**
   * API surface reserved for future time-picker extension.
   * When true, the component MAY render additional time inputs in a future version.
   * Currently has no visual effect.
   */
  showTime?: boolean;
  /** Additional CSS classes for the container div. */
  className?: string;
}

/**
 * DatePicker — calendar popup + manual text input.
 *
 * Users can either click the calendar icon to pick a date from the popup,
 * or type directly into the input field using dd/MM/yyyy format.
 * The two input modes stay in sync: selecting on the calendar updates
 * the input text, and typing a valid date updates the calendar highlight.
 */
function DatePicker({
  date,
  onSelect,
  placeholder = "dd/MM/yyyy",
  fromDate,
  toDate,
  disabled = false,
  formatStr = DEFAULT_DISPLAY_FORMAT,
  locale: localeProp,
  showTime,
  className,
}: DatePickerProps) {
  // Intentionally unused — reserved for future time-picker extension.
  void showTime;

  const [inputValue, setInputValue] = React.useState(
    date ? format(date, formatStr) : "",
  );
  const [open, setOpen] = React.useState(false);

  const activeLocale = localeProp ?? vi;

  // Sync input text when the controlled `date` prop changes externally.
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, formatStr));
    } else if (!open) {
      // Only clear input when popover is closed to avoid wiping mid-edit.
      setInputValue("");
    }
  }, [date, formatStr, open]);

  // Build the `disabled` predicate for react-day-picker v8 Calendar.
  const disabledDateProp = React.useMemo(() => {
    return (date: Date) => {
      if (fromDate && date < fromDate) return true;
      if (toDate && date > toDate) return true;
      return false;
    };
  }, [fromDate, toDate]);

  /** Check whether a parsed date falls within fromDate/toDate constraints. */
  const isWithinRange = React.useCallback(
    (d: Date) => {
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    },
    [fromDate, toDate],
  );

  /** User types in the input field. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const parsed = parse(val, formatStr, new Date());
    if (isValid(parsed) && isWithinRange(parsed)) {
      onSelect?.(parsed);
    }
    // If invalid or out of range, keep the text as-is so the user can keep typing.
  };

  /** User selects a date on the Calendar. */
  const handleCalendarSelect = (d: Date | undefined) => {
    if (d) {
      setInputValue(format(d, formatStr));
      onSelect?.(d);
    } else {
      setInputValue("");
      onSelect?.(undefined);
    }
    setOpen(false);
  };

  /** User blurs the input — reset invalid text to last valid value. */
  const handleBlur = () => {
    const parsed = parse(inputValue, formatStr, new Date());

    if (!isValid(parsed) || !isWithinRange(parsed)) {
      if (date) {
        setInputValue(format(date, formatStr));
      } else {
        setInputValue("");
        onSelect?.(undefined);
      }
    }
    // If valid, handleInputChange already called onSelect — nothing to do.
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative flex items-center", className)}>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="dialog"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full px-3 hover:bg-transparent"
            disabled={disabled}
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleCalendarSelect}
          locale={activeLocale}
          disabled={disabledDateProp}
          defaultMonth={date ?? new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

DatePicker.displayName = "DatePicker";

export { DatePicker };