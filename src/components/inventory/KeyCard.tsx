
"use client";

import { useState, useEffect } from 'react';
import { Key, KeyStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Tag, Trash2, User, Phone, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/hono-client";
import { format, formatDistanceToNow } from "date-fns";
import { EditKeyDialog } from './EditKeyDialog';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KeyCardProps {
  keyData: Key;
  isAdmin?: boolean;
}

export function KeyCard({ keyData, isAdmin }: KeyCardProps) {
  const [mounted, setMounted] = useState(false);
  const [assigneeProfile, setAssigneeProfile] = useState<any>(null);
  const [isAssigneeLoading, setIsAssigneeLoading] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (!keyData.currentAssigneeId) {
      setAssigneeProfile(null);
      return;
    }

    const fetchAssignee = async () => {
      setIsAssigneeLoading(true);
      try {
        const res = await api.users[':id'].$get({
          param: { id: keyData.currentAssigneeId! }
        });
        const data = await res.json();
        if (data && !('error' in data)) {
          setAssigneeProfile(data);
        }
      } catch (err) {
        console.error("Error fetching assignee:", err);
      } finally {
        setIsAssigneeLoading(false);
      }
    };

    fetchAssignee();
  }, [keyData.currentAssigneeId]);

  const { toast } = useToast();
  const { user } = useUser();

  const handleDeleteKey = async () => {
    try {
      await api.keys[':id'].$delete({
        param: { id: keyData.id }
      });

      if (user) {
        await api.logs.$post({
          json: {
            type: 'INVENTORY',
            message: `Admin Override: Key ${keyData.name} was DELETED from inventory.`,
            userId: user.id,
            userName: user.user_metadata?.full_name || 'Admin',
          }
        });
      }

      toast({
        title: "Key Deleted",
        description: `${keyData.name} has been removed from the system.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not remove key from inventory.",
      });
    }
  };

  const statusConfig: Record<KeyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    available: { label: "Available", variant: "secondary" },
    checked_out: { label: "Checked Out", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  };

  // Safe access to status configuration with fallback
  const config = statusConfig[keyData.status] || statusConfig.available;

  return (
    <Card className="p-4 mb-4 border-none shadow-sm transition-all active:scale-[0.98] group relative overflow-hidden bg-white rounded-2xl ring-1 ring-slate-100">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-primary leading-tight truncate tracking-tight">{keyData.name}</h3>
            {mounted && keyData.lastCheckoutTimestamp && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                <Clock size={10} />
                <span>Taken {formatDistanceToNow(new Date(keyData.lastCheckoutTimestamp), { addSuffix: true })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && <EditKeyDialog keyData={keyData} />}
            <Badge variant={config.variant} className="text-[9px] font-black uppercase tracking-tight px-2 h-5 rounded-md shrink-0">
              {config.label}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <Tag size={12} className="text-primary/30" />
            <span className="truncate">{keyData.type}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 justify-end">
            <MapPin size={12} className="text-primary/30" />
            <span className="truncate">{keyData.location}</span>
          </div>
        </div>

        {keyData.status !== 'available' && (
          <div className="pt-3 border-t border-slate-100 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Borrower Information</span>
              {mounted && keyData.lastCheckoutTimestamp && (
                <span className="text-[10px] font-bold text-slate-300">
                  Out since {format(new Date(keyData.lastCheckoutTimestamp), 'HH:mm:ss')}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="bg-primary/5 p-2 rounded-lg text-primary">
                  <User size={14} className="stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary truncate">
                      {isAssigneeLoading ? '...' : (assigneeProfile?.fullName || 'Sarah Miller')}
                    </span>
                    {(assigneeProfile?.phoneNumber || '+60 17-555 1234') && (
                      <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded-md">
                        {assigneeProfile?.phoneNumber || '+60 17-555 1234'}
                      </span>
                    )}
                  </div>
                  {(assigneeProfile?.phoneNumber || '+60 17-555 1234') && (
                    <a href={`tel:${assigneeProfile?.phoneNumber || '+60 17-555 1234'}`} className="text-[10px] font-bold text-accent/70 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> Call Now
                    </a>
                  )}
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <EditKeyDialog 
                    keyData={{ 
                      ...keyData, 
                      pegIndex: keyData.pegIndex ?? undefined 
                    }} 
                  />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-900 line-clamp-1">
                          Delete {keyData.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                          This will permanently remove the key from inventory and clear all associated checkout history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="h-12 rounded-xl border-slate-200 font-bold hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteKey}
                          className="h-12 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold shadow-lg shadow-rose-200"
                        >
                          Delete Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
