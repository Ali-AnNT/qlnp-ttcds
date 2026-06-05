import { useAuth } from "@/features/auth";
import {
  getApprovalStatusColor,
  getApprovalStatusLabel,
} from "@/features/shared-reference-data";
import {
  countBusinessDays,
  formatDate,
  parseWorkDays,
} from "@/shared/lib/date-utils";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Pencil, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMaxLevelByType } from "../hooks/use-approval-configs";
import {
  useCancelLeaveRequest,
  useMyLeaveRequests,
  useUpdateLeaveRequest,
} from "../hooks/use-leave-requests";
import { useLeaveTypes } from "../hooks/use-leave-types";

import { useSystemConfigs } from "@/features/config";
import type { LeaveRequestDto } from "../api/types";

export const EditLeaveRequestSchema = (
  approvedDates: Set<string>,
  today: string,
) =>
  z
    .object({
      leaveTypeId: z.string().min(1, "Vui lòng chọn loại phép"),
      startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
      endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
      reason: z
        .string()
        .min(1, "Vui lòng nhập lý do")
        .refine(
          (val) => val.trim().length > 0,
          "Lý do nghỉ không được chỉ chứa khoảng trắng",
        ),
    })
    .superRefine((data, ctx) => {
      if (!data.startDate || !data.endDate) return;
      if (data.startDate > data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc",
          path: ["endDate"],
        });
        return;
      }
      if (data.startDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Không được chọn ngày trong quá khứ",
          path: ["startDate"],
        });
        return;
      }
      try {
        const interval = {
          start: parseISO(data.startDate),
          end: parseISO(data.endDate),
        };
        const hasOverlap = eachDayOfInterval(interval).some((d) =>
          approvedDates.has(format(d, "yyyy-MM-dd")),
        );
        if (hasOverlap) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Khoảng ngày nghỉ trùng với đơn đã được duyệt",
            path: ["startDate"],
          });
        }
      } catch {
        /* malformed dates handled by field validators */
      }
    });

type EditLeaveRequestForm = z.infer<ReturnType<typeof EditLeaveRequestSchema>>;

const LeaveMyPage = () => {
  const { user } = useAuth();
  const { data: leaveRequests = [], isLoading } = useMyLeaveRequests();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { maxLevelByType } = useMaxLevelByType();
  const { mutateAsync: cancelRequest } = useCancelLeaveRequest();
  const { mutateAsync: updateRequest } = useUpdateLeaveRequest();
  const { systemConfigs } = useSystemConfigs();

  const workDays = parseWorkDays(
    systemConfigs.find((c) => c.configKey === "work_days")?.configValue,
  );

  const [filterStatus, setFilterStatus] = useState<string>("all");

  const statusLabels: Record<string, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  };

  const [editRequest, setEditRequest] = useState<LeaveRequestDto | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const approvedDates = useMemo(() => {
    if (!user) return new Set<string>();
    const dates = new Set<string>();
    leaveRequests
      .filter(
        (r) =>
          r.userId === user.userId &&
          r.status === "approved" &&
          r.id !== editRequest?.id,
      )
      .forEach((r) => {
        try {
          const interval = {
            start: parseISO(r.startDate),
            end: parseISO(r.endDate),
          };
          eachDayOfInterval(interval).forEach((d) =>
            dates.add(format(d, "yyyy-MM-dd")),
          );
        } catch {
          // Ignore malformed historical dates; validation below covers the edited range.
        }
      });
    return dates;
  }, [leaveRequests, user, editRequest]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EditLeaveRequestForm>({
    resolver: zodResolver(EditLeaveRequestSchema(approvedDates, today)),
    defaultValues: { leaveTypeId: "", startDate: "", endDate: "", reason: "" },
  });

  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  const myRequests = leaveRequests.filter((r) => r.userId === user?.userId);

  const handleCancel = async (id: number) => {
    try {
      await cancelRequest(id);
      toast.success("Đã hủy đơn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hủy đơn thất bại");
    }
  };

  const openEdit = (r: LeaveRequestDto) => {
    setEditRequest(r);
    reset({
      leaveTypeId: String(r.leaveTypeId),
      startDate: r.startDate,
      endDate: r.endDate,
      reason: r.reason || "",
    });
  };

  const editDays =
    startDateValue && endDateValue && startDateValue <= endDateValue
      ? countBusinessDays(
          parseISO(startDateValue),
          parseISO(endDateValue),
          workDays,
        )
      : 0;

  const onEditSubmit = async (data: EditLeaveRequestForm) => {
    if (!editRequest) return;
    try {
      await updateRequest({
        id: editRequest.id,
        data: {
          leaveTypeId: Number(data.leaveTypeId),
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: editDays,
          reason: data.reason,
        },
      });
      toast.success("Đã cập nhật và gửi lại đơn");
      setEditRequest(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cập nhật đơn thất bại");
    }
  };

  if (isLoading) {
    return (
      <div className="lma-space-y-4">
        <div className="lma-h-8 lma-w-48 lma-bg-muted lma-animate-pulse rounded" />
        <Card>
          <CardContent className="lma-p-0">
            <div className="lma-h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lma-space-y-4">
      <div className="lma-flex lma-items-center lma-justify-between lma-flex-wrap lma-gap-2">
        <h2 className="lma-text-lg lma-font-bold">Danh sách đơn của tôi</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="lma-w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="lma-p-0">
          <Table>
            <TableHeader>
              <TableRow className="lma-bg-muted/50">
                <TableHead className="lma-w-12">STT</TableHead>
                <TableHead>Loại phép</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead className="lma-w-16">Số ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="lma-w-28">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="lma-text-center lma-text-muted-foreground lma-py-8"
                  >
                    Không có đơn nào
                  </TableCell>
                </TableRow>
              ) : (
                myRequests.map((r, i) => {
                  const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
                  return (
                    <TableRow
                      key={r.id}
                      className={i % 2 === 1 ? "lma-bg-muted/20" : ""}
                    >
                      <TableCell className="lma-text-center">{i + 1}</TableCell>
                      <TableCell>{lt?.name}</TableCell>
                      <TableCell>{formatDate(r.startDate)}</TableCell>
                      <TableCell>{formatDate(r.endDate)}</TableCell>
                      <TableCell className="lma-text-center">
                        {r.totalDays}
                      </TableCell>
                      <TableCell className="lma-max-w-[200px] truncate">
                        {r.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "lma-text-[11px]",
                            getApprovalStatusColor(
                              r.status,
                              r.approvedLevel,
                              maxLevelByType.get(r.leaveTypeId) ?? 1,
                            ),
                          )}
                        >
                          {getApprovalStatusLabel(
                            r.status,
                            r.approvedLevel,
                            maxLevelByType.get(r.leaveTypeId) ?? 1,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="lma-flex lma-gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="lma-h-7 lma-px-2 lma-text-primary"
                              onClick={() => openEdit(r)}
                              type="button"
                            >
                              <Pencil className="lma-h-3 lma-w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="lma-h-7 lma-px-2 lma-text-destructive"
                              onClick={() => handleCancel(r.id)}
                            >
                              <XCircle className="lma-h-3 lma-w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRequest} onOpenChange={() => setEditRequest(null)}>
        <DialogContent className="lma-max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa đơn xin nghỉ phép</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="lma-space-y-4">
            <div className="lma-space-y-2">
              <Label className="lma-text-[13px]">Loại đơn xin nghỉ</Label>
              <Controller
                name="leaveTypeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại phép" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leaveTypeId && (
                <p className="lma-text-destructive lma-text-xs">
                  {errors.leaveTypeId.message}
                </p>
              )}
            </div>
            <div className="lma-grid lma-grid-cols-2 lma-gap-4">
              <div className="lma-space-y-2">
                <Label className="lma-text-[13px]">Ngày bắt đầu</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      date={field.value ? parseISO(field.value) : undefined}
                      onSelect={(d) => {
                        const val = d ? format(d, "yyyy-MM-dd") : "";
                        field.onChange(val);
                        const currentEndDate = getValues("endDate");
                        if (currentEndDate && val && currentEndDate < val) {
                          setValue("endDate", "", { shouldValidate: false });
                        }
                      }}
                      placeholder="Chọn ngày bắt đầu"
                      fromDate={parseISO(today)}
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="lma-text-destructive lma-text-xs">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="lma-space-y-2">
                <Label className="lma-text-[13px]">Ngày kết thúc</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      date={field.value ? parseISO(field.value) : undefined}
                      onSelect={(d) =>
                        field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                      }
                      placeholder="Chọn ngày kết thúc"
                      fromDate={
                        startDateValue
                          ? parseISO(startDateValue)
                          : parseISO(today)
                      }
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="lma-text-destructive lma-text-xs">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
            {editDays > 0 && (
              <div className="lma-bg-muted lma-rounded-md lma-px-3 lma-py-2 lma-text-sm">
                Số ngày nghỉ: <strong>{editDays}</strong> ngày
              </div>
            )}
            <div className="lma-space-y-2">
              <Label className="lma-text-[13px]">Lý do nghỉ</Label>
              <Textarea
                {...register("reason")}
                placeholder="Nhập lý do..."
                rows={3}
              />
              {errors.reason && (
                <p className="lma-text-destructive lma-text-xs">
                  {errors.reason.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditRequest(null)}
              >
                Hủy
              </Button>
              <Button type="submit">Lưu & Gửi lại</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveMyPage;
