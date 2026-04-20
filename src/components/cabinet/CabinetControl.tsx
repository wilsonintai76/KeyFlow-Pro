'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Unlock, Loader2, DoorOpen, DoorClosed, AlertCircle, WifiOff, Globe } from 'lucide-react';
import { useUser } from '@/lib/auth-provider';
import { useRTDB, updateLiveAction } from '@/firebase/rtdb';
import { CabinetStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useConnectivity } from '@/hooks/use-connectivity';
import { useHardwareConfig } from '@/hooks/use-hardware-config';
import { OfflineLogin } from './OfflineLogin';

export function CabinetControl() {
  const { user } = useUser();
  const { toast } = useToast();
  const { status: connectivityStatus } = useConnectivity();
  const { hardwareIp } = useHardwareConfig();
  const [status, setStatus] = useState<CabinetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: rtdbStatus, loading: isRtdbLoading } = useRTDB<any>('live/cabinet');
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Offline Auth State
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [localStaffId, setLocalStaffId] = useState<string | null>(null);

  const isOnline = connectivityStatus === 'CLOUD';
  const isLocalAvailable = connectivityStatus === 'LOCAL';

  useEffect(() => {
    if (rtdbStatus && isOnline) {
      setStatus(rtdbStatus as CabinetStatus);
      setIsLoading(false);
    }
  }, [rtdbStatus, isOnline]);

  useEffect(() => {
    if (!isOnline) {
      // If we are offline, try to fetch status from hardware directly
      const fetchLocalStatus = async () => {
        try {
          const res = await fetch(`${hardwareIp}/status`);
          if (res.ok) {
            const data = await res.json();
            setStatus(data);
          }
        } catch (e) {
          console.error("Local status fetch failed", e);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLocalStatus();
    }
  }, [isOnline, hardwareIp]);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    
    if (isOnline) {
      // CLOUD UNLOCK via RTDB
      if (!user) {
        setIsUnlocking(false);
        return;
      }
      try {
        await updateLiveAction('cabinet_unlock', {
          action: 'UNLOCK',
          userId: user.id || (user as any).uid,
          userName: (user as any).user_metadata?.full_name || user.email || 'Staff',
          timestamp: new Date().toISOString(),
          status: 'pending'
        });

        toast({ title: "Cloud Unlock Requested", description: "Command sent via Firebase RTDB." });
      } catch (error) {
        toast({ variant: "destructive", title: "Cloud Error", description: "Failed to reach Firebase." });
      } finally {
        setTimeout(() => setIsUnlocking(false), 2000);
      }
    } else {
      // LOCAL UNLOCK via direct Fetch
      if (!localToken) {
        setIsUnlocking(false);
        return; 
      }

      try {
        const response = await fetch(`${hardwareIp}/unlock`, {
          method: 'POST',
          headers: { 
            'Authorization': localToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast({ title: "Local Unlock Successful", description: "Hardware solenoid activated via LAN." });
        } else {
          throw new Error("Local auth failed");
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Local Error", description: "Failed to communicate with hardware." });
        setLocalToken(null); 
      } finally {
        setIsUnlocking(false);
      }
    }
  };

  const handleLocalLoginSuccess = (token: string, staffId: string) => {
    setLocalToken(token);
    setLocalStaffId(staffId);
  };

  // If we are offline and not authenticated locally, show the Offline Login
  if (!isOnline && isLocalAvailable && !localToken) {
    return <OfflineLogin onSuccess={handleLocalLoginSuccess} />;
  }

  if (isLoading && isOnline) {
    return <div className="h-[116px] w-full animate-pulse bg-slate-200 rounded-[2rem] shadow-sm" />;
  }

  const isDoorOpen = status?.doorOpen || false;
  const isLocked = status?.locked !== false;

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden mt-6 overflow-visible relative">
      <div className="absolute -top-3 left-6">
        <Badge className={`h-6 px-3 rounded-full border-2 shadow-sm gap-1.5 ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
          {isOnline ? <Globe size={10} /> : <WifiOff size={10} />}
          <span className="font-black uppercase text-[8px] tracking-widest">
            {isOnline ? 'Cloud Active' : 'Offline Mode'}
          </span>
        </Badge>
      </div>

      <div className="absolute -top-3 -right-3">
        <Badge variant={isDoorOpen ? "destructive" : "outline"} className="h-8 px-4 rounded-full border-2 shadow-lg gap-2 bg-white">
          {isDoorOpen ? (
            <>
              <DoorOpen size={14} className="animate-pulse" />
              <span className="font-bold uppercase text-[10px]">Door Open</span>
            </>
          ) : (
            <>
              <DoorClosed size={14} className="text-emerald-500" />
              <span className="font-bold uppercase text-[10px] text-emerald-500">Door Secured</span>
            </>
          )}
        </Badge>
      </div>

      <CardHeader className="pb-2 pt-8">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-500'}`}>
            {isLocked ? <Lock size={20} /> : <Unlock size={20} className="animate-bounce" />}
          </div>
          <div>
            <CardTitle className="text-lg font-black text-primary">Cabinet Access</CardTitle>
            <CardDescription className="text-xs font-medium">
              {isOnline ? 'Standard Cloud-Sync Mode' : `Direct LAN Access as ${localStaffId}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100">
            <AlertCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Clicking unlock will retract the internal solenoid for 5 seconds. 
              {isOnline 
                ? " Authenticated via your Firebase account."
                : " Authenticated via local Staff ID & PIN."}
            </p>
          </div>

          <button
            onClick={handleUnlock}
            disabled={isUnlocking || isDoorOpen}
            className={`
              relative group overflow-hidden h-14 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 shadow-xl
              ${isUnlocking || isDoorOpen 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-2 border-slate-200' 
                : 'bg-primary text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/25'}
            `}
          >
            {isUnlocking ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <Unlock size={20} />
                <span>Unlock Key Cabinet</span>
              </>
            )}
          </button>

          {status?.lastUserName && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              Last Accessed By: {status.lastUserName}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
