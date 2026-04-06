import { Mail, Eye, MessageSquare, Calendar, Rocket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  sent: "hsl(210, 100%, 52%)",
  opened: "hsl(38, 92%, 50%)",
  replied: "hsl(172, 66%, 40%)",
  interview: "hsl(152, 60%, 42%)",
  rejected: "hsl(0, 84%, 60%)",
  no_response: "hsl(220, 10%, 70%)",
  draft: "hsl(220, 14%, 80%)",
};

const Dashboard = () => {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, campaigns(name)")
        .eq("user_id", user!.id)
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalSent = applications.filter((a) => a.status !== "draft").length;
  const opened = applications.filter((a) => ["opened", "replied", "interview"].includes(a.status)).length;
  const replied = applications.filter((a) => ["replied", "interview"].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;

  // Status breakdown for pie chart
  const statusCounts = Object.entries(
    applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: statusColors[name] || "hsl(220, 10%, 70%)" }));

  const recentActivity = applications.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your outreach progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Emails Sent" value={totalSent} change={`${campaigns.length} campaigns`} icon={Mail} />
        <StatCard title="Open Rate" value={`${openRate}%`} icon={Eye} />
        <StatCard title="Reply Rate" value={`${replyRate}%`} icon={MessageSquare} />
        <StatCard title="Interviews" value={interviews} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Status Breakdown</h2>
          {statusCounts.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusCounts.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground capitalize">{item.name.replace("_", " ")}</span>
                    </div>
                    <span className="font-medium text-card-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No data yet. Start sending applications!</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-card border border-border">
          <div className="p-6 pb-3">
            <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                      {item.company[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{item.company}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={item.status as Status} />
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {item.last_activity_at ? new Date(item.last_activity_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No applications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
