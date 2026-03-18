
"use client";

import { useState, useEffect } from 'react';
import { Key, KeyStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Tag, Trash2, User, Phone, RotateCcw, Clock, Key as KeyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  useFirestore, 
  deleteDocumentNonBlocking, 
  useDoc, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  addDocumentNonBlocking,
  useUser 
} from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { EditKeyDialog } from "./EditKeyDialog";
import { formatDistanceToNow } from "date-fns";

interface KeyCardProps {
  keyData: Key;
  isAdmin?: boolean;
}

export function KeyCard({ keyData, isAdmin }: KeyCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const statusDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'cabinet_status', 'main_cabinet');
  }, [firestore]);

  const { data: status } = useDoc<any>(statusDocRef);

  const assigneeDocRef = useMemoFirebase(() => {
    if (!firestore || !keyData.currentAssigneeId || keyData.status === 'available') return null;
    return doc(firestore, 'user_profiles', keyData.currentAssigneeId);
  }, [firestore, keyData.currentAssigneeId, keyData.status]);

  const { data: assigneeProfile, isLoading: isAssigneeLoading } = useDoc<any>(assigneeDocRef);

  const isPhysicallyPresent = keyData.pegIndex !== undefined && status?.pegStates?.[keyData.pegIndex] === true;

  const statusConfig: Record<KeyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    available: { label: "Available", variant: "secondary", icon: KeyIcon },
    checked_out: { label: "Checked Out", variant: "default", icon: Clock },
    overdue: { label: "Overdue", variant: "destructive", icon: Clock },
  };

  const config = statusConfig[keyData.status];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !keyData.id) return;
    deleteDocumentNonBlocking(doc(firestore, 'keys', keyData.id));
    toast({ title: "Key Deleted", description: "Removed from inventory." });
  };

  const handleManualReturn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !keyData.id || !user) return;

    updateDocumentNonBlocking(doc(firestore, 'keys', keyData.id), {
      currentStatus: 'available',
      lastAssignedToUserId: null,
      lastCheckoutTimestamp: null,
      updatedAt: new Date().toISOString()
    });

    addDocumentNonBlocking(collection(firestore, 'system_logs'), {
      type: 'INVENTORY',
      message: `Admin Override: ${keyData.name} manual return.`,
      userId: user.uid,
      userName: user.displayName || 'Admin',
      timestamp: new Date().toISOString()
    });

    toast({ title: "Manual Override", description: "Key status reset to available." });
  };

  return (
    <Card className="p-4 mb-4 border-none shadow-sm transition-all active:scale-[0.98] group relative overflow-hidden bg-white rounded-2xl ring-1 ring-slate-100">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-primary leading-tight truncate tracking-tight">{keyData.name}</h3>
            {keyData.pegIndex !== undefined && (
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-500", 
                  isPhysicallyPresent ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "bg-slate-200"
                )} 
              />
            )}
          </div>
          {mounted && keyData.status !== 'available' && keyData.lastCheckoutTimestamp && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tracking-tight">
              <Clock size={12} className="text-primary/40" />
              <span>Taken {formatDistanceToNow(new Date(keyData.lastCheckoutTimestamp), { addSuffix: true })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && keyData.status === 'available' && (
            <div className="flex gap-1 items-center mr-1">
              <EditKeyDialog keyData={keyData} />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" onClick={handleDelete}>
                <Trash2 size={16} />
              </Button>
            </div>
          )}
          <Badge variant={config.variant} className="text-[10px] font-black uppercase tracking-tight px-2.5 h-6 rounded-lg whitespace-nowrap shadow-sm">
            {config.label}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Tag size={13} className="text-primary/40" />
            <span className="truncate">{keyData.type}</span>
          </div>
          {keyData.pegIndex !== undefined && (
            <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm">SLOT #{keyData.pegIndex + 1}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <MapPin size={13} className="text-primary/40" />
          <span className="truncate">{keyData.location}</span>
        </div>
      </div>

      {keyData.status !== 'available' && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
          <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Current Borrower</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="bg-primary/5 p-2 rounded-xl text-primary shrink-0">
                <User size={14} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-primary truncate">
                  {isAssigneeLoading ? '...' : (assigneeProfile?.fullName || 'Unknown User')}
                </span>
                {!isAssigneeLoading && assigneeProfile?.phoneNumber && (
                  <a href={`tel:${assigneeProfile.phoneNumber}`} className="text-xs font-bold text-accent flex items-center gap-1.5 hover:text-accent/80 active:scale-95 transition-all">
                    <Phone size={12} className="stroke-[3]" />
                    {assigneeProfile.phoneNumber}
                  </a>
                )}
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl" onClick={handleManualReturn}>
                  <RotateCcw size={18} />
                </Button>
                <EditKeyDialog keyData={keyData} />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
