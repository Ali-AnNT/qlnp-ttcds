import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  differenceInBusinessDays,
  parseISO,
  format,
  eachDayOfInterval,
} from "date-fns";
import { useLeaveTypes } from "../hooks/use-leave-types";
import {
  useMyLeaveRequests,
  useSubmitLeaveRequest,
} from "../hooks/use-leave-requests";

// Build a Zod schema that enforces field shape and the cross-field rules
// that depend on async-loaded state (approved dates, today).
const createLeaveRequestSchema = (
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<LeaveRequestForm>({
    resolver: zodResolver(createLeaveRequestSchema(approvedDates, today)),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  // Business days between start and end (inclusive). Returns 0 if range is invalid/incomplete.
  const days =
    startDateValue && endDateValue && startDateValue <= endDateValue
      ? Math.max(
          1,
          differenceInBusinessDays(
            parseISO(endDateValue),
            parseISO(startDateValue),
          ) + 1,
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại");
    }
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tạo đơn xin nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px]">Loại đơn xin nghỉ</Label>
            <Controller
              name="leaveTypeId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
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
              <p className="text-destructive text-xs">
                {errors.leaveTypeId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày bắt đầu</Label>
              <Input type="date" min={today} {...register("startDate")} />
              {errors.startDate && (
                <p className="text-destructive text-xs">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Ngày kết thúc</Label>
              <Input
                type="date"
                min={startDateValue || today}
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-destructive text-xs">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {days > 0 && (
            <div className="bg-muted rounded-md px-3 py-2 text-sm">
              Số ngày nghỉ: <strong>{days}</strong> ngày
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[13px]">Lý do nghỉ</Label>
            <Textarea
              {...register("reason")}
              placeholder="Nhập lý do xin nghỉ..."
              rows={3}
            />
            {errors.reason && (
              <p className="text-destructive text-xs">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
