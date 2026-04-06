import { useState } from "react";
import { Plus, FileText, Link2, Trash2, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Resumes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resumes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["portfolio_links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_links").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadResume = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from("resumes").insert({
        user_id: user!.id,
        name: file.name,
        file_url: path,
        file_size: `${Math.round(file.size / 1024)} KB`,
        is_default: resumes.length === 0,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast({ title: "Resume uploaded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteResume = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });

  const toggleDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("resumes").update({ is_default: false }).eq("user_id", user!.id);
      await supabase.from("resumes").update({ is_default: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });

  const addLink = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("portfolio_links").insert({ user_id: user!.id, label: newLink.label, url: newLink.url });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio_links"] });
      setNewLink({ label: "", url: "" });
      toast({ title: "Link added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio_links"] }),
  });

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadResume.mutate(file);
    };
    input.click();
  };

  const loading = resumesLoading || linksLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resumes & Portfolio</h1>
        <p className="text-muted-foreground mt-1">Manage your application materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Resumes</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleFileUpload} disabled={uploadResume.isPending}>
              <Plus className="w-3.5 h-3.5" />
              {uploadResume.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {resumes.length === 0 && (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border border-dashed text-center">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No resumes yet. Upload your first one!</p>
            </div>
          )}

          <div className="space-y-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">{resume.file_size} · {new Date(resume.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleDefault.mutate(resume.id)}>
                    {resume.is_default ? <Star className="w-4 h-4 text-warning fill-warning" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteResume.mutate(resume.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Portfolio Links</h2>

          {links.length === 0 && resumes.length === 0 && (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border border-dashed text-center">
              <Link2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Add your portfolio links below</p>
            </div>
          )}

          <div className="space-y-3">
            {links.map((link) => (
              <div key={link.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{link.label}</p>
                    <p className="text-xs text-primary">{link.url}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLink.mutate(link.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-4 shadow-card border border-border border-dashed space-y-3">
            <Input placeholder="Label (e.g., Dribbble)" value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} />
            <Input placeholder="URL" value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => addLink.mutate()}
              disabled={!newLink.label || !newLink.url || addLink.isPending}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resumes;
