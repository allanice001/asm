import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

interface DashboardActivityFeedProps {
  auditLogs: AuditLog[];
}

export function DashboardActivityFeed({
  auditLogs,
}: DashboardActivityFeedProps) {
  return (
    <div className="space-y-4">
      {auditLogs.map((log) => (
        <div key={log.id} className="flex items-start gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={log.user.image || undefined}
              alt={log.user.name}
            />
            <AvatarFallback>{getInitials(log.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              <span className="font-semibold">{log.user.name}</span>{" "}
              <span className="text-muted-foreground">
                {log.action} a {log.resourceType}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Resource ID: {log.resourceId}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(log.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
