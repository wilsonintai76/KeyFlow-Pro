"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/hono-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, DoorOpen, DoorClosed, Wifi, AlertCircle, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HardwareMonitorProps {
  minimalist?: boolean;
}

export function HardwareMonitor({ minimalist = false }: HardwareMonitorProps) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api['cabinet-status'].$get();
      const data = await res.json();
      if (data && !('error' in data)) {
        setStatus(data);
      }
    } catch (err) {
      console.error("Hardware poll error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const isStatusLoading = isLoading;
  const isSettingsLoading = false;

  if (isStatusLoading || isSettingsLoading) {
    return (
      <div className={minimalist ? "px-0" : "px-6"}>
        <div className="h-20 w-full animate-pulse bg-slate-200 rounded-2xl shadow-sm" />
      </div>
    );
  }

  const isOnline = mounted && status?.lastHeartbeat && (new Date().getTime() - new Date(status.lastHeartbeat).getTime() < 60000);
  const isDoorOpen = status?.doorOpen === true;
  const pegStates = status?.pegStates || {};
  const pegCount = 10;

  if (minimalist) {
    return (
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
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-bold ${isOnline ? 'border-emerald-200 text-emerald-600 bg-emerald-50/50' : 'border-slate-200 text-slate-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{pegCount} SLOTS</span>
              </div>
            </div>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
                <Wifi size={10} />
                {status?.wifiSignal || 0}%
             </div>
             <p className="text-[10px] font-medium mt-1">
                {mounted && status?.lastHeartbeat ? formatDistanceToNow(new Date(status.lastHeartbeat), { addSuffix: true }) : 'Never'}
             </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="px-6 space-y-3">
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
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Controller</p>
            <p className="text-[11px] font-bold text-accent">
              CP v{status?.firmwareVersion || '9.0.0'}
            </p>
          </div>
        </CardContent>
      </Card>

      {isOnline && (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity size={12} className="text-accent" />
              Dynamic Slot Map ({pegCount})
            </CardTitle>
            <div className="flex gap-3">
               <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-bold">KEY IN</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-slate-200" />
                 <span className="text-[9px] font-bold">OUT</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {[...Array(pegCount)].map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all border ${pegStates[i] ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}
                >
                  <Circle size={10} className={pegStates[i] ? 'fill-emerald-500 text-emerald-500' : 'text-slate-200'} />
                  <span className="text-[8px] font-black opacity-40">#{i + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isOnline && mounted && (
        <div className="flex items-center gap-2 px-2 text-rose-500 bg-rose-50/50 py-3 rounded-2xl border border-rose-100 border-dashed">
          <AlertCircle size={16} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase">Hardware signal lost</span>
            <span className="text-[9px] opacity-70">Controller is not reporting heartbeat.</span>
          </div>
        </div>
      )}
    </div>
  );
}
