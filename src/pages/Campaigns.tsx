import { useState } from "react";
import { Plus, Play, Pause, MoreHorizontal, Mail, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

type CampaignStatus = "active" | "paused" | "draft" | "completed";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  emailsSent: number;
  opens: number;
  replies: number;
  companies: number;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Series A Startups - Frontend", status: "active", emailsSent: 85, opens: 42, replies: 12, companies: 95, createdAt: "Mar 28, 2026" },
  { id: "2", name: "Remote DevTools Companies", status: "active", emailsSent: 45, opens: 28, replies: 8, companies: 60, createdAt: "Mar 25, 2026" },
  { id: "3", name: "YC W26 Batch", status: "paused", emailsSent: 30, opens: 15, replies: 3, companies: 50, createdAt: "Mar 20, 2026" },
  { id: "4", name: "AI/ML Startups", status: "draft", emailsSent: 0, opens: 0, replies: 0, companies: 40, createdAt: "Mar 18, 2026" },
  { id: "5", name: "Fintech Companies NYC", status: "completed", emailsSent: 120, opens: 65, replies: 18, companies: 120, createdAt: "Mar 10, 2026" },
];

const campaignStatusStyles: Record<CampaignStatus, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  draft: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

const Campaigns = () => {
  const [campaigns] = useState(mockCampaigns);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage your outreach campaigns</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-card-foreground">{campaign.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${campaignStatusStyles[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Created {campaign.createdAt}</p>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{campaign.companies} companies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{campaign.emailsSent} sent</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{campaign.opens} opens</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{campaign.replies} replies</span>
                  </div>
                </div>

                {campaign.emailsSent > 0 && (
                  <div className="mt-4 w-full max-w-md">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: `${(campaign.emailsSent / campaign.companies) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((campaign.emailsSent / campaign.companies) * 100)}% completed
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {campaign.status === "active" && (
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Pause className="w-3.5 h-3.5" />
                  </Button>
                )}
                {(campaign.status === "paused" || campaign.status === "draft") && (
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
