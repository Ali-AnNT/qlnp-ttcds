import React from "react";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";

export interface FilterState {
  type: "year" | "quarter" | "month";
  year: string;
  quarter: string;
  month: string;
  status?: string;
}

interface ReportsFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  filters,
  onFiltersChange,
  onExport,
  isExporting = false,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => String(currentYear - 5 + i));
  const quarters = [
    { value: "1", label: "Q1" },
    { value: "2", label: "Q2" },
    { value: "3", label: "Q3" },
    { value: "4", label: "Q4" },
  ];
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const handleTypeChange = (val: string) => {
    onFiltersChange({
      ...filters,
      type: val as "year" | "quarter" | "month",
    });
  };

  const handleYearChange = (val: string) => {
    onFiltersChange({
      ...filters,
      year: val,
    });
  };

  const handleQuarterChange = (val: string) => {
    onFiltersChange({
      ...filters,
      quarter: val,
    });
  };

  const handleMonthChange = (val: string) => {
    onFiltersChange({
      ...filters,
      month: val,
    });
  };

  const handleStatusChange = (val: string) => {
    onFiltersChange({
      ...filters,
      status: val === "all" ? undefined : val,
    });
  };

  return (
    <div className="lma-flex lma-flex-wrap lma-items-end lma-gap-4 lma-bg-card lma-p-4 lma-rounded-lg lma-border lma-shadow-sm">
      <div className="lma-flex lma-flex-col lma-gap-1.5">
        <span className="lma-text-xs lma-font-medium lma-text-muted-foreground">Loại:</span>
        <Select value={filters.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="lma-w-[150px]">
            <SelectValue placeholder="Chọn loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year">Theo năm</SelectItem>
            <SelectItem value="quarter">Theo quý</SelectItem>
            <SelectItem value="month">Theo tháng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lma-flex lma-flex-col lma-gap-1.5">
        <span className="lma-text-xs lma-font-medium lma-text-muted-foreground">Năm:</span>
        <Select value={filters.year} onValueChange={handleYearChange}>
          <SelectTrigger className="lma-w-[120px]">
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                Năm {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.type === "quarter" && (
        <div className="lma-flex lma-flex-col lma-gap-1.5">
          <span className="lma-text-xs lma-font-medium lma-text-muted-foreground">Quý:</span>
          <Select value={filters.quarter} onValueChange={handleQuarterChange}>
            <SelectTrigger className="lma-w-[120px]">
              <SelectValue placeholder="Chọn quý" />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filters.type === "month" && (
        <div className="lma-flex lma-flex-col lma-gap-1.5">
          <span className="lma-text-xs lma-font-medium lma-text-muted-foreground">Tháng:</span>
          <Select value={filters.month} onValueChange={handleMonthChange}>
            <SelectTrigger className="lma-w-[120px]">
              <SelectValue placeholder="Chọn tháng" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="lma-flex lma-flex-col lma-gap-1.5">
        <span className="lma-text-xs lma-font-medium lma-text-muted-foreground">Trạng thái:</span>
        <Select value={filters.status ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="lma-w-[150px]">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lma-ml-auto">
        <Button
          onClick={onExport}
          disabled={isExporting}
          className="lma-flex lma-items-center lma-gap-2 lma-bg-primary hover:lma-bg-primary/95"
        >
          <Download className="lma-h-4 lma-w-4" />
          {isExporting ? "Đang xuất..." : "Xuất Excel"}
        </Button>
      </div>
    </div>
  );
};
