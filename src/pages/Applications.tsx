import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import type { Status } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusFilters: (Status | "all")[] = ["all", "sent", "opened", "replied", "interview", "rejected", "no_response"];

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApp, setNewApp] = useState({ company: "", role: "", contact_email: "", status: "draft" as string });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, campaigns(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        user_id: user!.id,
        company: newApp.company,
        role: newApp.role,
        contact_email: newApp.contact_email || null,
        status: newApp.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setNewApp({ company: "", role: "", contact_email: "", status: "draft" });
      setDialogOpen(false);
      toast({ title: "Application added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status, last_activity_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const filtered = applications.filter((app) => {
    const matchesSearch = app.company.toLowerCase().includes(search.toLowerCase()) || app.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || app.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground mt-1">Track every outreach email</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={newApp.company} onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))} placeholder="e.g., Stripe" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={newApp.role} onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))} placeholder="e.g., Senior Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input value={newApp.contact_email} onChange={(e) => setNewApp((p) => ({ ...p, contact_email: e.target.value }))} placeholder="hiring@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newApp.status} onValueChange={(v) => setNewApp((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createApplication.mutate()} disabled={!newApp.company || !newApp.role || createApplication.isPending} className="w-full gradient-primary text-primary-foreground">
                {createApplication.isPending ? "Adding..." : "Add Application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies or roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {filter === "no_response" ? "No Response" : filter === "all" ? "All" : filter}
            </button>
          ))}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card border border-border border-dashed text-center">
          <h3 className="text-base font-semibold text-card-foreground mb-1">No applications yet</h3>
          <p className="text-sm text-muted-foreground">Add your first application or start a campaign.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                        {app.company[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{app.company}</p>
                        <p className="text-xs text-muted-foreground">{app.contact_email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{app.role}</td>
                  <td className="px-6 py-4">
                    <Select value={app.status} onValueChange={(v) => updateStatus.mutate({ id: app.id, status: v })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-transparent p-0">
                        <StatusBadge status={app.status as Status} />
                      </SelectTrigger>
                      <SelectContent>
                        {(["draft", "sent", "opened", "replied", "interview", "rejected", "no_response"] as Status[]).map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s === "no_response" ? "No Response" : s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{(app as any).campaigns?.name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {app.last_activity_at ? new Date(app.last_activity_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No applications found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
