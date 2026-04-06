type Status = "sent" | "opened" | "replied" | "interview" | "rejected" | "no_response" | "draft";

const statusConfig: Record<Status, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-info/10 text-info" },
  opened: { label: "Opened", className: "bg-warning/10 text-warning" },
  replied: { label: "Replied", className: "bg-primary/10 text-primary" },
  interview: { label: "Interview", className: "bg-success/10 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  no_response: { label: "No Response", className: "bg-muted text-muted-foreground" },
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
};

const StatusBadge = ({ status }: { status: Status }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
export type { Status };
