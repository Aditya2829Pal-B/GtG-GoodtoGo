import { useState } from "react";
import { Sparkles, Send, MessageSquare, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "compose" | "classify" | null;

interface Props {
  application: {
    id: string;
    company: string;
    role: string;
    contact_email: string | null;
    status: string;
    follow_ups_sent?: number;
    subject?: string | null;
    body?: string | null;
  };
}

const ApplicationActions = ({ application }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>(null);
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState(application.contact_email || "");
  const [subject, setSubject] = useState(application.subject || "");
  const [body, setBody] = useState(application.body || "");
  const [reply, setReply] = useState("");
  const isFollowUp = application.status === "sent" || application.status === "opened";

  const close = () => {
    setMode(null);
    setReply("");
  };

  const generate = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-outreach-email", {
      body: { company: application.company, role: application.role, isFollowUp },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Generation failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setSubject(data.subject);
    setBody(data.body);
  };

  const send = async () => {
    if (!to || !subject || !body) {
      toast({ title: "Missing fields", description: "To, subject and body are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("send-outreach-email", {
      body: { applicationId: application.id, to, subject, body, isFollowUp },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Send failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Email recorded", description: data.message });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    close();
  };

  const classify = async () => {
    if (!reply.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("classify-reply", {
      body: { applicationId: application.id, replyText: reply },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Classification failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: `Classified: ${data.category}`, description: data.summary });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    close();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">⋯</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setMode("compose")}>
            <Send className="w-4 h-4 mr-2" />
            {isFollowUp ? "Send follow-up" : "Compose & send"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("classify")}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Classify reply
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode === "compose"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isFollowUp ? "Send follow-up" : "Compose outreach"} — {application.company}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="hiring@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate with AI
              </Button>
              <Button onClick={send} disabled={loading} className="gradient-primary text-primary-foreground">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "classify"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classify a reply</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Paste the reply email body. AI will classify it as interview, replied, or rejected and update the status.</p>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={10} placeholder="Paste reply text here..." />
            <Button onClick={classify} disabled={loading || !reply.trim()} className="w-full gradient-primary text-primary-foreground">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Classify & update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApplicationActions;
