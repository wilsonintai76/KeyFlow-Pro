'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Save, HardDrive, ShieldCheck, Loader2 } from 'lucide-react';
import { useHardwareConfig } from '@/hooks/use-hardware-config';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export function HardwareSync() {
  const { hardwareIp, updateHardwareIp } = useHardwareConfig();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [tempIp, setTempIp] = useState(hardwareIp);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'user_profiles'), orderBy('email', 'asc'));
  }, [firestore]);

  const { data: users } = useCollection<any>(usersQuery);

  const handleSync = async () => {
    if (!users || users.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No user profiles found to sync." });
      return;
    }

    setIsSyncing(true);
    try {
      // Prepare data for ESP32 (only ID and PIN)
      const syncData = users
        .filter((u: any) => u.staffId && u.pin)
        .map((u: any) => ({
          staffId: u.staffId,
          pin: u.pin
        }));

      if (syncData.length === 0) {
        throw new Error("No users with both Staff ID and PIN found.");
      }

      const response = await fetch(`${hardwareIp}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData),
      });

      if (!response.ok) throw new Error("Hardware rejected sync");

      toast({
        title: "Sync Successful",
        description: `Uploaded ${syncData.length} users to the hardware.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || "Hardware unreachable. Check IP and connection.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveIp = () => {
    updateHardwareIp(tempIp);
    toast({ title: "Hardware IP Updated", description: `Default target set to ${tempIp}` });
  };

  return (
    <div className="px-6 space-y-6 pb-20">
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <HardDrive size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Hardware Bridge</CardTitle>
              <CardDescription className="text-xs font-medium">Link the dashboard to your physical cabinet</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Hardware Local IP / Address</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempIp}
                  onChange={(e) => setTempIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or keymaster.local"
                  className="h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold"
                />
                <Button onClick={handleSaveIp} className="h-12 w-12 rounded-2xl p-0 bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none">
                  <Save size={20} />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                Default: <code className="bg-slate-100 px-1 rounded">http://keymaster.local</code>
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="text-emerald-500 mt-0.5 shrink-0" size={18} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Offline Readiness</h4>
                <p className="text-[10px] text-emerald-600 leading-relaxed">
                  Syncing users ensures the cabinet can recognize staff IDs and PINs even when the internet is disconnected. Perform this after adding new staff.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
            >
              {isSyncing ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Pushing Database...
                </>
              ) : (
                <>
                  <RefreshCw size={20} className="mr-2" />
                  Sync Staff to Hardware
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
