import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatCard from "@/components/StatCard";
import { TrendingUp, Target, Percent, Clock } from "lucide-react";

const monthlyData = [
  { month: "Jan", sent: 45, replies: 8, interviews: 2 },
  { month: "Feb", sent: 78, replies: 15, interviews: 4 },
  { month: "Mar", sent: 159, replies: 28, interviews: 6 },
];

const responseTimeData = [
  { range: "< 1 day", count: 12 },
  { range: "1-3 days", count: 18 },
  { range: "3-7 days", count: 8 },
  { range: "1-2 weeks", count: 5 },
  { range: "> 2 weeks", count: 3 },
];

const Analytics = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights into your outreach performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sent" value={282} change="All time" icon={TrendingUp} />
        <StatCard title="Conversion Rate" value="3.5%" change="Sent → Interview" icon={Target} />
        <StatCard title="Avg Reply Rate" value="18%" change="Across campaigns" icon={Percent} />
        <StatCard title="Avg Response Time" value="2.4d" change="From sent to reply" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Monthly Outreach Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="sent" stroke="hsl(172, 66%, 40%)" fill="hsl(172, 66%, 40%)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="replies" stroke="hsl(210, 100%, 52%)" fill="hsl(210, 100%, 52%)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="interviews" stroke="hsl(152, 60%, 42%)" fill="hsl(152, 60%, 42%)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Response Time Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill="hsl(172, 66%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
