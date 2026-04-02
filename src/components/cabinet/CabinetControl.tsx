'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Unlock, Loader2, DoorOpen, DoorClosed, AlertCircle } from 'lucide-react';
import { useFirestore, useUser, useDoc, doc, unlockCabinetStatus } from '@/firebase';
import { CabinetStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function CabinetControl() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const cabinetRef = doc(firestore!, 'cabinet_status', 'main');
  const { data: status, isLoading } = useDoc<CabinetStatus>(cabinetRef);

  const handleUnlock = async () => {
    if (!firestore || !user) return;
    
    setIsUnlocking(true);
    try {
      await unlockCabinetStatus(firestore, user.uid, user.displayName || 'User');
      toast({
        title: "Unlock Requested",
        description: "ESP32 has been notified. The solenoid will retract shortly.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Communication Error",
        description: "Failed to send unlock command to hardware.",
      });
    } finally {
      setTimeout(() => setIsUnlocking(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[116px] w-full animate-pulse bg-slate-200 rounded-[2rem] shadow-sm" />
    );
  }

  const isDoorOpen = status?.doorOpen || false;
  const isLocked = status?.locked !== false; // Default to locked if undefined

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden mt-6 overflow-visible relative">
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

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-500'}`}>
            {isLocked ? <Lock size={20} /> : <Unlock size={20} className="animate-bounce" />}
          </div>
          <div>
            <CardTitle className="text-lg font-black text-primary">Cabinet Access</CardTitle>
            <CardDescription className="text-xs font-medium">Control the physical solenoid lock</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100">
            <AlertCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Clicking unlock will retract the internal solenoid for 5 seconds. 
              The system will record your identity for as long as the door remains open.
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
                <span>Sending Command...</span>
              </>
            ) : isDoorOpen ? (
              <>
                <DoorOpen size={20} />
                <span>Door is Already Open</span>
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
