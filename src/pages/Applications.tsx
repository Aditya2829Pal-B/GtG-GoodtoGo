import { useState } from "react";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/components/StatusBadge";

interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  sentAt: string;
  lastActivity: string;
  email: string;
  campaign: string;
}

const mockApplications: Application[] = [
  { id: "1", company: "Stripe", role: "Senior Frontend Engineer", status: "interview", sentAt: "Mar 28", lastActivity: "2h ago", email: "hiring@stripe.com", campaign: "Series A Startups" },
  { id: "2", company: "Vercel", role: "Full Stack Developer", status: "replied", sentAt: "Mar 27", lastActivity: "4h ago", email: "jobs@vercel.com", campaign: "Remote DevTools" },
  { id: "3", company: "Linear", role: "Product Engineer", status: "opened", sentAt: "Mar 26", lastActivity: "6h ago", email: "careers@linear.app", campaign: "Series A Startups" },
  { id: "4", company: "Notion", role: "Software Engineer", status: "sent", sentAt: "Mar 25", lastActivity: "1d ago", email: "hiring@notion.so", campaign: "Series A Startups" },
  { id: "5", company: "Figma", role: "Frontend Engineer", status: "no_response", sentAt: "Mar 20", lastActivity: "5d ago", email: "jobs@figma.com", campaign: "Remote DevTools" },
  { id: "6", company: "Supabase", role: "Backend Engineer", status: "replied", sentAt: "Mar 22", lastActivity: "1d ago", email: "hiring@supabase.io", campaign: "Remote DevTools" },
  { id: "7", company: "Railway", role: "Platform Engineer", status: "rejected", sentAt: "Mar 18", lastActivity: "3d ago", email: "jobs@railway.app", campaign: "Series A Startups" },
  { id: "8", company: "PlanetScale", role: "Database Engineer", status: "sent", sentAt: "Mar 28", lastActivity: "12h ago", email: "careers@planetscale.com", campaign: "Remote DevTools" },
];

const statusFilters: (Status | "all")[] = ["all", "sent", "opened", "replied", "interview", "rejected", "no_response"];

const Applications = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");

  const filtered = mockApplications.filter((app) => {
    const matchesSearch = app.company.toLowerCase().includes(search.toLowerCase()) || app.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || app.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground mt-1">Track every outreach email</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies or roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {filter === "no_response" ? "No Response" : filter === "all" ? "All" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                      {app.company[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{app.company}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-card-foreground">{app.role}</td>
                <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{app.campaign}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{app.sentAt}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{app.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No applications found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
