import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { groupByDay } from '@/lib/expenseUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">₹{payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function SpendingChart({ expenses }) {
  const data = groupByDay(expenses, 7);
  const hasData = data.some(d => d.amount > 0);

  return (
    <div className="bg-card rounded-3xl p-4 border border-border">
      <h3 className="font-bold text-base mb-4 text-foreground">7-Day Spending</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 8 }} />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[150px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No spending data yet</p>
        </div>
      )}
    </div>
  );
}