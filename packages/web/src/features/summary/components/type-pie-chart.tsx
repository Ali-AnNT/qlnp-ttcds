import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, type DefaultLegendContentProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#8B5CF6", "#EC4899", "#14B8A6"];

interface TypePieChartProps {
  data: { name: string; value: number }[];
}

function renderLegend(props: DefaultLegendContentProps) {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TypePieChart({ data }: TypePieChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Phân bổ theo loại phép</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={({ value }) => value} labelLine={false}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} ngày`, name]} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
        )}
      </CardContent>
    </Card>
  );
}
