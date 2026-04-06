import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import { TrendingUp, Target, Percent, Clock } from "lucide-react";
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

const Analytics = () => {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").eq("user_id", user!.id);
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

  const total = applications.length;
  const sent = applications.filter((a) => a.status !== "draft").length;
  const replied = applications.filter((a) => ["replied", "interview"].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;
  const convRate = sent > 0 ? ((interviews / sent) * 100).toFixed(1) : "0";

  const statusBreakdown = Object.entries(
    applications.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: name.replace("_", " "), count, color: statusColors[name] || "hsl(220, 10%, 70%)" }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights into your outreach performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={total} change="All time" icon={TrendingUp} />
        <StatCard title="Conversion Rate" value={`${convRate}%`} change="Sent → Interview" icon={Target} />
        <StatCard title="Reply Rate" value={`${replyRate}%`} change={`${campaigns.length} campaigns`} icon={Percent} />
        <StatCard title="Active Campaigns" value={campaigns.filter((c) => c.status === "active").length} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Status Distribution</h2>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-20 text-center">No data yet</p>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Overview</h2>
          {statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count">
                    {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground capitalize">{item.name}</span>
                    </div>
                    <span className="font-medium text-card-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-20 text-center">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
