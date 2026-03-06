
"use client";

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Clock, Save, Loader2, Tag, Cpu, RefreshCw, Activity, LayoutGrid, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function SystemSettings() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [duration, setDuration] = useState('24');
  const [pegCount, setPegCount] = useState('10');
  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [categoriesText, setCategoriesText] = useState('Workshop, Room, Machine');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const statusDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'cabinet_status', 'main_cabinet');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<any>(settingsDocRef);
  const { data: status } = useDoc<any>(statusDocRef);

  useEffect(() => {
    if (settings) {
      if (settings.maxBorrowDurationHours) {
        setDuration(settings.maxBorrowDurationHours.toString());
      }
      if (settings.pegCount) {
        setPegCount(settings.pegCount.toString());
      }
      if (settings.categories && Array.isArray(settings.categories)) {
        setCategoriesText(settings.categories.join(', '));
      }
      if (settings.lastFirmwareUrl) {
        setFirmwareUrl(settings.lastFirmwareUrl);
      }
    }
  }, [settings]);

  const handleSave = () => {
    if (!firestore || !settingsDocRef) return;
    setIsSaving(true);

    const numericDuration = parseInt(duration);
    const numericPegCount = parseInt(pegCount);

    if (isNaN(numericDuration) || numericDuration <= 0) {
      toast({ variant: "destructive", title: "Invalid Duration", description: "Please enter a valid number of hours." });
      setIsSaving(false);
      return;
    }

    if (isNaN(numericPegCount) || numericPegCount <= 0 || numericPegCount > 100) {
      toast({ variant: "destructive", title: "Invalid Peg Count", description: "Peg count must be between 1 and 100." });
      setIsSaving(false);
      return;
    }

    const categoriesArray = categoriesText
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    setDocumentNonBlocking(settingsDocRef, {
      maxBorrowDurationHours: numericDuration,
      pegCount: numericPegCount,
      categories: categoriesArray,
      lastFirmwareUrl: firmwareUrl,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "System policies and cabinet layout have been updated.",
      });
    }, 600);
  };

  const handleFirmwareUpdate = () => {
    if (!firestore || !user) return;
    
    if (!firmwareUrl) {
      toast({
        variant: "destructive",
        title: "URL Required",
        description: "Please provide a firmware binary URL before updating.",
      });
      return;
    }

    setIsUpdatingFirmware(true);

    addDocumentNonBlocking(collection(firestore, 'hardware_triggers'), {
      action: 'FIRMWARE_UPDATE',
      payload: firmwareUrl,
      timestamp: new Date().toISOString(),
      userId: user.uid,
      status: 'pending'
    });

    addDocumentNonBlocking(collection(firestore, 'system_logs'), {
      type: 'HARDWARE',
      message: `OTA Update triggered with binary: ${firmwareUrl.split('/').pop()}`,
      userId: user.uid,
      userName: user.displayName || 'Admin',
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      setIsUpdatingFirmware(false);
      toast({
        title: "Signal Dispatched",
        description: "The ESP32 has been signaled to fetch the new firmware binary.",
      });
    }, 1000);
  };

  const isOnline = status?.lastHeartbeat && (new Date().getTime() - new Date(status.lastHeartbeat).getTime() < 60000);

  return (
    <div className="px-6 py-4 space-y-6 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Settings size={22} className="text-accent" />
          System Settings
        </h2>
        <p className="text-xs text-muted-foreground">Global configuration for the KeyFlow Pro ecosystem.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Cpu size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Hardware Maintenance</CardTitle>
          </div>
          <CardDescription className="text-xs">Monitor and push Over-The-Air updates.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Device Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-sm font-bold text-primary">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Firmware</p>
              <Badge variant="outline" className="text-[10px] font-bold border-accent/20 text-accent">
                v{status?.firmwareVersion || '1.0.4'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="firmwareUrl" className="text-xs font-bold uppercase text-muted-foreground">Firmware Binary URL (.bin)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <Input 
                id="firmwareUrl"
                placeholder="https://storage.googleapis.com/..."
                value={firmwareUrl}
                onChange={(e) => setFirmwareUrl(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent text-xs"
              />
            </div>
            <p className="text-[9px] text-muted-foreground italic px-1">Host your compiled binary on Firebase Storage or a public server.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium px-1">
              <Activity size={12} className="text-accent" />
              Last Heartbeat: {status?.lastHeartbeat ? formatDistanceToNow(new Date(status.lastHeartbeat), { addSuffix: true }) : 'Never'}
            </div>
            <Button 
              onClick={handleFirmwareUpdate}
              disabled={isUpdatingFirmware || !isOnline || !firmwareUrl}
              variant="outline"
              className="w-full h-11 rounded-xl border-accent/30 text-accent hover:bg-accent/5 font-bold gap-2"
            >
              {isUpdatingFirmware ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Push OTA Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Cabinet Configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">Define physical slot parameters.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="pegCount" className="text-sm font-bold">Total Key Slots (Peg Count)</Label>
            <div className="flex items-center gap-3">
              <Input 
                id="pegCount" 
                type="number"
                value={pegCount}
                onChange={(e) => setPegCount(e.target.value)}
                className="bg-slate-50 border-slate-100 h-12 text-lg font-bold focus-visible:ring-accent"
                min="1"
                max="100"
              />
              <span className="text-sm font-medium text-muted-foreground">Slots</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Borrow Policies</CardTitle>
          </div>
          <CardDescription className="text-xs">Configure overdue thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-sm font-bold">Max Borrow Duration (Hours)</Label>
            <div className="flex items-center gap-3">
              <Input 
                id="duration" 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-50 border-slate-100 h-12 text-lg font-bold focus-visible:ring-accent"
                min="1"
              />
              <span className="text-sm font-medium text-muted-foreground">Hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Tag size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Category Management</CardTitle>
          </div>
          <CardDescription className="text-xs">Define available key categories.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="categories" className="text-sm font-bold">Key Categories</Label>
            <Textarea 
              id="categories" 
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              placeholder="e.g. Workshop, Room, Machine"
              className="bg-slate-50 border-slate-100 min-h-[100px] focus-visible:ring-accent"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Update System Config</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
