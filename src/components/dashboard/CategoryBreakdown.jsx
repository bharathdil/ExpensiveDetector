import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { groupByCategory } from '@/lib/expenseUtils';
import { getCategoryConfig } from '@/lib/categoryConfig';

const COLORS = ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#6b7280'];

export default function CategoryBreakdown({ expenses }) {
  const data = groupByCategory(expenses);
  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-4 border border-border">
        <h3 className="font-bold text-base mb-4 text-foreground">Category Breakdown</h3>
        <p className="text-muted-foreground text-sm text-center py-6">No expenses yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-4 border border-border">
      <h3 className="font-bold text-base mb-4 text-foreground">Category Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="total" paddingAngle={3}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.slice(0, 5).map((item, index) => {
            const config = getCategoryConfig(item.category);
            const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
            return (
              <div key={item.category} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium text-foreground flex-1 truncate">{config.icon} {config.label}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category bars */}
      <div className="mt-4 space-y-2.5">
        {data.slice(0, 5).map((item, index) => {
          const config = getCategoryConfig(item.category);
          const pct = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{config.icon} {config.label}</span>
                <span className="text-xs font-bold text-foreground">₹{item.total.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: COLORS[index % COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}