import { ROUTES } from "@/app/routes";
import { useAuth } from "@/features/auth";
import { useSystemConfigs } from "@/features/config/hooks/use-system-configs";
import { countBusinessDays, parseWorkDays } from "@/shared/lib/date-utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import {
  useMyLeaveRequests,
  useSubmitLeaveRequest,
} from "../hooks/use-leave-requests";
import { useLeaveTypes } from "../hooks/use-leave-types";

// Build a Zod schema that enforces field shape and the cross-field rules
// that depend on async-loaded state (approved dates, today).
const createLeaveRequestSchema = (approvedDates: Set<string>, today: string) =>
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
      // Only run cross-field checks when both dates are present and parseable.
      if (!data.startDate || !data.endDate) return;

      // 1. End date must be on/after start date.
      if (data.startDate > data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc",
          path: ["endDate"],
        });
        return;
      }

      // 2. Start date must not be in the past.
      if (data.startDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Không được chọn ngày trong quá khứ",
          path: ["startDate"],
        });
        return;
      }

      // 3. Selected range must not overlap with any approved leave.
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
        // Ignore malformed dates; field-level validators above handle them.
      }
    });

type LeaveRequestForm = z.infer<ReturnType<typeof createLeaveRequestSchema>>;

const LeaveNewPage = () => {
  const { user } = useAuth();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: leaveRequests = [] } = useMyLeaveRequests();
  const navigate = useNavigate();
  const { mutateAsync: submitLeaveRequest } = useSubmitLeaveRequest();
  const { systemConfigs } = useSystemConfigs();

  const workDays = parseWorkDays(
    systemConfigs.find((c) => c.configKey === "work_days")?.configValue,
  );

  const defaultLeaveTypeId = systemConfigs.find(
    (c) => c.configKey === "default_leave_type_id",
  )?.configValue;

  const today = format(new Date(), "yyyy-MM-dd");

  const approvedDates = useMemo(() => {
    if (!user) return new Set<string>();
    const dates = new Set<string>();
    leaveRequests
      .filter((r) => r.userId === user.userId && r.status === "approved")
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
          // Ignore malformed historical dates; form validation covers the submitted range.
        }
      });
    return dates;
  }, [leaveRequests, user]);

  // Pre-select default leave type once configs and leave types are loaded.
  // Only set when both are available and the default ID references a valid active leave type.
  const resolvedDefaultLeaveTypeId = useMemo(() => {
    if (!defaultLeaveTypeId || leaveTypes.length === 0) return "";
    const id = String(defaultLeaveTypeId);
    return leaveTypes.some((t) => t.id === Number(id) && t.isActive) ? id : "";
  }, [defaultLeaveTypeId, leaveTypes]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestForm>({
    resolver: zodResolver(createLeaveRequestSchema(approvedDates, today)),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
    values: resolvedDefaultLeaveTypeId
      ? { leaveTypeId: resolvedDefaultLeaveTypeId, startDate: "", endDate: "", reason: "" }
      : undefined,
  });

  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  // Business days (Mon-Fri by default, based on system config) between start and end, inclusive.
  const days =
    startDateValue && endDateValue && startDateValue <= endDateValue
      ? countBusinessDays(
          parseISO(startDateValue),
          parseISO(endDateValue),
          workDays,
        )
      : 0;

  const onSubmit = async (data: LeaveRequestForm) => {
    try {
      await submitLeaveRequest({
        leaveTypeId: Number(data.leaveTypeId),
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: days,
        reason: data.reason,
      });
      toast.success("Đã gửi phê duyệt");
      reset();
      navigate(ROUTES.leaveMy);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại");
    }
  };

  return (
    <div className="lma-max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="lma-text-lg">Tạo đơn xin nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent className="lma-space-y-4">
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
                    onSelect={(d) =>
                      field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                    }
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

          {days > 0 && (
            <div className="lma-bg-muted lma-rounded-md lma-px-3 lma-py-2 lma-text-sm">
              Số ngày nghỉ: <strong>{days}</strong> ngày
            </div>
          )}

          <div className="lma-space-y-2">
            <Label className="lma-text-[13px]">Lý do nghỉ</Label>
            <Textarea
              {...register("reason")}
              placeholder="Nhập lý do xin nghỉ..."
              rows={3}
            />
            {errors.reason && (
              <p className="lma-text-destructive lma-text-xs">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="lma-flex lma-gap-2 lma-pt-2">
            <Button
              className="lma-bg-accent hover:lma-bg-accent/90 lma-text-accent-foreground"
              onClick={handleSubmit(onSubmit)}
            >
              Gửi phê duyệt
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveNewPage;
