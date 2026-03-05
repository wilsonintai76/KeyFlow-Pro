
"use client";

import { Key, KeyStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFirestore, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface KeyCardProps {
  keyData: Key;
  isAdmin?: boolean;
}

export function KeyCard({ keyData, isAdmin }: KeyCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const statusConfig: Record<KeyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    available: { label: "Available", variant: "secondary" },
    checked_out: { label: "Checked Out", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  };

  const config = statusConfig[keyData.status];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !keyData.id) return;

    const keyRef = doc(firestore, 'keys', keyData.id);
    deleteDocumentNonBlocking(keyRef);

    toast({
      title: "Key Deleted",
      description: `${keyData.name} has been removed from inventory.`,
    });
  };

  return (
    <Card 
      className="p-4 mb-3 border-none shadow-sm transition-transform group relative overflow-hidden bg-white"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-base text-foreground leading-tight">{keyData.name}</h3>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{keyData.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && keyData.status === 'available' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
            </Button>
          )}
          <Badge variant={config.variant} className="text-[10px] uppercase font-bold px-2 py-0">
            {config.label}
          </Badge>
        </div>
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
