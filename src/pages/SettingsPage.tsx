import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SettingsPage = () => {
  const [preferences, setPreferences] = useState({
    roles: "Frontend Engineer, Full Stack Developer, Product Engineer",
    locations: "Remote, San Francisco, New York",
    salaryMin: "120000",
    salaryMax: "200000",
    workType: "remote",
    followUpDays: "5",
    maxFollowUps: "2",
    autoFollowUp: true,
    emailNotifications: true,
    pushNotifications: false,
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your job preferences and notifications</p>
      </div>

      {/* Job Preferences */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-5">
        <h2 className="text-lg font-semibold text-card-foreground">Job Preferences</h2>

        <div className="space-y-2">
          <Label>Target Roles</Label>
          <Input value={preferences.roles} onChange={(e) => setPreferences((p) => ({ ...p, roles: e.target.value }))} placeholder="e.g., Frontend Engineer, Product Engineer" />
          <p className="text-xs text-muted-foreground">Comma-separated list of roles you're interested in</p>
        </div>

        <div className="space-y-2">
          <Label>Preferred Locations</Label>
          <Input value={preferences.locations} onChange={(e) => setPreferences((p) => ({ ...p, locations: e.target.value }))} placeholder="e.g., Remote, San Francisco" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min Salary ($)</Label>
            <Input type="number" value={preferences.salaryMin} onChange={(e) => setPreferences((p) => ({ ...p, salaryMin: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Max Salary ($)</Label>
            <Input type="number" value={preferences.salaryMax} onChange={(e) => setPreferences((p) => ({ ...p, salaryMax: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Work Type</Label>
          <Select value={preferences.workType} onValueChange={(v) => setPreferences((p) => ({ ...p, workType: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Follow-up Settings */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-5">
        <h2 className="text-lg font-semibold text-card-foreground">Follow-up Automation</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-card-foreground">Auto Follow-ups</p>
            <p className="text-xs text-muted-foreground">Automatically send follow-ups after no response</p>
          </div>
          <Switch checked={preferences.autoFollowUp} onCheckedChange={(v) => setPreferences((p) => ({ ...p, autoFollowUp: v }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Follow-up After (days)</Label>
            <Input type="number" value={preferences.followUpDays} onChange={(e) => setPreferences((p) => ({ ...p, followUpDays: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Max Follow-ups</Label>
            <Input type="number" value={preferences.maxFollowUps} onChange={(e) => setPreferences((p) => ({ ...p, maxFollowUps: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-5">
        <h2 className="text-lg font-semibold text-card-foreground">Notifications</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-card-foreground">Email Notifications</p>
            <p className="text-xs text-muted-foreground">Get notified when you receive replies</p>
          </div>
          <Switch checked={preferences.emailNotifications} onCheckedChange={(v) => setPreferences((p) => ({ ...p, emailNotifications: v }))} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-card-foreground">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Browser push notifications for status changes</p>
          </div>
          <Switch checked={preferences.pushNotifications} onCheckedChange={(v) => setPreferences((p) => ({ ...p, pushNotifications: v }))} />
        </div>
      </div>

      <Button className="gradient-primary text-primary-foreground">Save Preferences</Button>
    </div>
  );
};

export default SettingsPage;
