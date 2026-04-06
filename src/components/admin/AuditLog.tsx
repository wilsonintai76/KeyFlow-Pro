
"use client";

import { useRTDB } from '@/firebase/rtdb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Shield, Unlock, Package, UserCog, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AuditLog() {
  const { data: logsData, loading: isLoading } = useRTDB<Record<string, any>>('log');

  // Convert RTDB object to sorted array for display
  const logs = logsData ? Object.entries(logsData).map(([id, val]) => ({
    id,
    ...val
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'HARDWARE': return <Unlock size={14} className="text-amber-500" />;
      case 'USER_MGMT': return <UserCog size={14} className="text-blue-500" />;
      case 'INVENTORY': return <Package size={14} className="text-emerald-500" />;
      default: return <Shield size={14} className="text-slate-400" />;
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
          <History size={22} className="text-accent" />
          System Audit Logs
        </h2>
        <p className="text-xs text-muted-foreground">Historical record of all system-wide activities.</p>
      </div>

      <div className="space-y-2">
        {(!logs || logs.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed flex flex-col items-center gap-3">
            <History className="text-slate-200" size={48} />
            <p className="text-sm text-muted-foreground font-medium">No activity recorded yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
              <CardContent className="p-3 flex items-start gap-3">
                <div className="bg-slate-50 p-2 rounded-xl shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight">
                      {log.message}
                    </p>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase font-black shrink-0">
                      {log.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground truncate">
                      by <span className="font-semibold text-slate-600">{log.userName}</span>
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                      <Clock size={8} />
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
