import { Mail, Eye, MessageSquare, Calendar, Rocket, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/components/StatusBadge";

const weeklyData = [
  { day: "Mon", sent: 12, replies: 3 },
  { day: "Tue", sent: 18, replies: 5 },
  { day: "Wed", sent: 15, replies: 2 },
  { day: "Thu", sent: 22, replies: 7 },
  { day: "Fri", sent: 10, replies: 4 },
  { day: "Sat", sent: 5, replies: 1 },
  { day: "Sun", sent: 3, replies: 0 },
];

const statusData = [
  { name: "Sent", value: 85, color: "hsl(210, 100%, 52%)" },
  { name: "Opened", value: 42, color: "hsl(38, 92%, 50%)" },
  { name: "Replied", value: 18, color: "hsl(172, 66%, 40%)" },
  { name: "Interview", value: 6, color: "hsl(152, 60%, 42%)" },
  { name: "Rejected", value: 8, color: "hsl(0, 84%, 60%)" },
];

const recentActivity: { company: string; role: string; status: Status; time: string }[] = [
  { company: "Stripe", role: "Senior Frontend Engineer", status: "interview", time: "2h ago" },
  { company: "Vercel", role: "Full Stack Developer", status: "replied", time: "4h ago" },
  { company: "Linear", role: "Product Engineer", status: "opened", time: "6h ago" },
  { company: "Notion", role: "Software Engineer", status: "sent", time: "8h ago" },
  { company: "Figma", role: "Frontend Engineer", status: "no_response", time: "1d ago" },
  { company: "Supabase", role: "Backend Engineer", status: "replied", time: "1d ago" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your outreach progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Emails Sent" value={159} change="+23 this week" changeType="positive" icon={Mail} />
        <StatCard title="Open Rate" value="52%" change="+4.2%" changeType="positive" icon={Eye} />
        <StatCard title="Reply Rate" value="18%" change="-1.3%" changeType="negative" icon={MessageSquare} />
        <StatCard title="Interviews" value={6} change="+2 this week" changeType="positive" icon={Calendar} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="sent" fill="hsl(172, 66%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="replies" fill="hsl(172, 66%, 75%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl shadow-card border border-border">
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
          <button className="text-sm text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.company}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground w-16 text-right">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
