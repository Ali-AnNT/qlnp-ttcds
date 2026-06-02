import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { ViolationByType, DepartmentViolation } from "../api/types";

const COLORS = [
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
];

interface ViolationChartProps {
  violationByType: ViolationByType[];
  deptViolations: DepartmentViolation[];
}

export function ViolationChart({ violationByType, deptViolations }: ViolationChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Phân loại vượt mức theo lý do nghỉ</CardTitle>
        </CardHeader>
        <CardContent>
          {violationByType.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Không có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={violationByType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  label={(e) => `${e.value}`}
                >
                  {violationByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Số ngày vượt mức theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          {deptViolations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Không có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={deptViolations.map((d) => ({
                  name: d.dept.tenDonVi,
                  value: d.totalEmpOverage,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--destructive))" name="Ngày vượt" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
