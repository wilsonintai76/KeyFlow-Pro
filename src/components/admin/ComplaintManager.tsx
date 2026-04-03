"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/hono-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Mail, MessageSquareWarning, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Complaint } from '@/lib/types';

export function ComplaintManager() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const res = await api.complaints.$get();
      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (complaintId: string) => {
    try {
      await api.complaints[':id'].$patch({
        param: { id: complaintId },
        json: { status: 'resolved' }
      });
      
      toast({
        title: "Issue Resolved",
        description: "Marked as resolved.",
      });

      fetchComplaints(); // Refresh list
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Could not mark as resolved.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <MessageSquareWarning size={22} className="text-accent" />
          User Complaints
        </h2>
        <p className="text-xs text-muted-foreground">Limited to last 50 reports.</p>
      </div>

      <div className="space-y-3">
        {(!complaints || complaints.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed flex flex-col items-center gap-3">
            <CheckCircle2 className="text-emerald-500 opacity-20" size={48} />
            <p className="text-sm text-muted-foreground font-medium">No complaints found.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <Card key={c.id} className={`border-none shadow-sm overflow-hidden rounded-2xl ${c.status === 'resolved' ? 'opacity-60 grayscale' : 'ring-1 ring-rose-50'}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-primary leading-tight">{c.userName}</h3>
                      <Badge variant={c.status === 'pending' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-black px-1.5 h-4">
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Mail size={10} />
                      {c.userEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase justify-end">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 leading-relaxed italic">"{c.description}"</p>
                </div>

                {c.status === 'pending' && (
                  <Button onClick={() => handleResolve(c.id)} className="w-full h-9 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                    <CheckCircle2 size={14} /> Mark as Resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
