import { useState } from "react";
import { Plus, Play, Pause, MoreHorizontal, Mail, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type CampaignStatus = "active" | "paused" | "draft" | "completed";

const campaignStatusStyles: Record<CampaignStatus, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  draft: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

const Campaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").insert({ user_id: user!.id, name: newName, status: "draft" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setNewName("");
      setDialogOpen(false);
      toast({ title: "Campaign created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campaign deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage your outreach campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Series A Startups - Frontend" />
              </div>
              <Button onClick={() => createCampaign.mutate()} disabled={!newName || createCampaign.isPending} className="w-full gradient-primary text-primary-foreground">
                {createCampaign.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 && (
        <div className="bg-card rounded-xl p-12 shadow-card border border-border border-dashed text-center">
          <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-card-foreground mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">Create your first outreach campaign to get started.</p>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const status = campaign.status as CampaignStatus;
          const total = campaign.companies_count || 1;
          const sent = campaign.emails_sent || 0;

          return (
            <div key={campaign.id} className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-card-foreground">{campaign.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${campaignStatusStyles[status]}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Created {new Date(campaign.created_at).toLocaleDateString()}</p>

                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{campaign.companies_count || 0} companies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{sent} sent</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{campaign.opens || 0} opens</span>
                    <span className="text-sm text-muted-foreground">{campaign.replies || 0} replies</span>
                  </div>

                  {sent > 0 && (
                    <div className="mt-4 w-full max-w-md">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${Math.min((sent / total) * 100, 100)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(Math.min((sent / total) * 100, 100))}% completed</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {status === "active" && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateStatus.mutate({ id: campaign.id, status: "paused" })}>
                      <Pause className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {(status === "paused" || status === "draft") && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateStatus.mutate({ id: campaign.id, status: "active" })}>
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteCampaign.mutate(campaign.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Campaigns;
