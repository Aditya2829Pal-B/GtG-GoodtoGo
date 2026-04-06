import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    targetRoles: "",
    locations: "",
    salaryMin: "",
    salaryMax: "",
    workType: "remote",
    followUpDays: "5",
    maxFollowUps: "2",
    autoFollowUp: true,
    emailNotifications: true,
    pushNotifications: false,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPreferences({
            targetRoles: (data.target_roles || []).join(", "),
            locations: (data.preferred_locations || []).join(", "),
            salaryMin: data.salary_min?.toString() || "",
            salaryMax: data.salary_max?.toString() || "",
            workType: data.work_type || "remote",
            followUpDays: data.follow_up_days?.toString() || "5",
            maxFollowUps: data.max_follow_ups?.toString() || "2",
            autoFollowUp: data.auto_follow_up ?? true,
            emailNotifications: data.email_notifications ?? true,
            pushNotifications: data.push_notifications ?? false,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        target_roles: preferences.targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_locations: preferences.locations.split(",").map((s) => s.trim()).filter(Boolean),
        salary_min: preferences.salaryMin ? parseInt(preferences.salaryMin) : null,
        salary_max: preferences.salaryMax ? parseInt(preferences.salaryMax) : null,
        work_type: preferences.workType,
        follow_up_days: parseInt(preferences.followUpDays),
        max_follow_ups: parseInt(preferences.maxFollowUps),
        auto_follow_up: preferences.autoFollowUp,
        email_notifications: preferences.emailNotifications,
        push_notifications: preferences.pushNotifications,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Your preferences have been updated." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your job preferences and notifications</p>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-5">
        <h2 className="text-lg font-semibold text-card-foreground">Job Preferences</h2>
        <div className="space-y-2">
          <Label>Target Roles</Label>
          <Input value={preferences.targetRoles} onChange={(e) => setPreferences((p) => ({ ...p, targetRoles: e.target.value }))} placeholder="e.g., Frontend Engineer, Product Engineer" />
          <p className="text-xs text-muted-foreground">Comma-separated list</p>
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
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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

      <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
};

export default SettingsPage;
