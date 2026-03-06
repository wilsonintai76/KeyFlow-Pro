
"use client";

import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Mail, User, MessageSquareWarning, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Complaint } from '@/lib/types';

export function ComplaintManager() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'complaints'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: complaints, isLoading } = useCollection<Complaint>(complaintsQuery);

  const handleResolve = (complaintId: string) => {
    if (!firestore) return;
    const ref = doc(firestore, 'complaints', complaintId);
    updateDocumentNonBlocking(ref, { status: 'resolved' });
    
    toast({
      title: "Issue Resolved",
      description: "The complaint has been marked as resolved.",
    });
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
        <p className="text-xs text-muted-foreground">Address hardware issues and user concerns.</p>
      </div>

      <div className="space-y-3">
        {(!complaints || complaints.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed flex flex-col items-center gap-3">
            <CheckCircle2 className="text-emerald-500 opacity-20" size={48} />
            <p className="text-sm text-muted-foreground font-medium">All systems clear. No complaints.</p>
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
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{c.description}"
                  </p>
                </div>

                {c.status === 'pending' && (
                  <Button 
                    onClick={() => handleResolve(c.id)}
                    className="w-full h-9 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Mark as Resolved
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
