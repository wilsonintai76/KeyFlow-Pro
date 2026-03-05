import { Key, KeyStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyCardProps {
  keyData: Key;
  onClick?: () => void;
}

export function KeyCard({ keyData, onClick }: KeyCardProps) {
  const statusConfig: Record<KeyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    available: { label: "Available", variant: "secondary" },
    checked_out: { label: "Checked Out", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  };

  const config = statusConfig[keyData.status];

  return (
    <Card 
      className="p-4 mb-3 border-none shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-base text-foreground leading-tight">{keyData.name}</h3>
        <Badge variant={config.variant} className="text-[10px] uppercase font-bold px-2 py-0">
          {config.label}
        </Badge>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tag size={12} className="text-accent" />
          <span>{keyData.type}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} className="text-accent" />
          <span>{keyData.location}</span>
        </div>
      </div>

      {keyData.currentAssigneeId && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground uppercase font-semibold">Assigned To:</span>
          <span className="font-bold text-primary">{keyData.currentAssigneeId}</span>
        </div>
      )}
    </Card>
  );
}