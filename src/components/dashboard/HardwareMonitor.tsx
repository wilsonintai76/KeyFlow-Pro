
"use client";

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, DoorOpen, DoorClosed, Wifi, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function HardwareMonitor() {
  const firestore = useFirestore();

  const statusDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'cabinet_status', 'main_cabinet');
  }, [firestore]);

  const { data: status, isLoading } = useDoc<any>(statusDocRef);

  if (isLoading) return null;

  const isOnline = status?.lastHeartbeat && (new Date().getTime() - new Date(status.lastHeartbeat).getTime() < 60000);
  const isDoorOpen = status?.doorState === 'open';

  return (
    <div className="px-6 mb-4">
      <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDoorOpen ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isDoorOpen ? <DoorOpen size={20} /> : <DoorClosed size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                {isDoorOpen ? 'Cabinet Open' : 'Cabinet Locked'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-bold ${isOnline ? 'border-emerald-200 text-emerald-600 bg-emerald-50/50' : 'border-slate-200 text-slate-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
                {status?.wifiSignal && (
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Wifi size={10} />
                    {status.wifiSignal}%
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Last Sync</p>
            <p className="text-[11px] font-medium">
              {status?.lastHeartbeat ? formatDistanceToNow(new Date(status.lastHeartbeat), { addSuffix: true }) : 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {!isOnline && (
        <div className="mt-2 flex items-center gap-2 px-2 text-rose-500">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold uppercase">Hardware connection lost</span>
        </div>
      )}
    </div>
  );
}
