"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  useDoc, 
  useFirestore, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  addDocumentNonBlocking, 
  useUser,
  useStorage
} from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Clock, 
  Save, 
  Loader2, 
  Tag, 
  Cpu, 
  RefreshCw, 
  Activity, 
  LayoutGrid, 
  Link as LinkIcon, 
  Upload, 
  Usb,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function SystemSettings() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [duration, setDuration] = useState('24');
  const [pegCount, setPegCount] = useState('10');
  const [firmwareUrl, setFirmwareUrl] = useState('');
  const [categoriesText, setCategoriesText] = useState('Workshop, Room, Machine');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (settings.maxBorrowDurationHours) setDuration(settings.maxBorrowDurationHours.toString());
      if (settings.pegCount) setPegCount(settings.pegCount.toString());
      if (settings.categories) setCategoriesText(settings.categories.join(', '));
      if (settings.lastFirmwareUrl) setFirmwareUrl(settings.lastFirmwareUrl);
    }
  }, [settings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (!file.name.endsWith('.bin')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Only .bin firmware files are supported." });
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `firmware/keyflow_pro_${Date.now()}.bin`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      setFirmwareUrl(url);
      toast({ title: "Upload Success", description: "Binary uploaded and URL generated." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload binary to storage." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!firestore || !settingsDocRef) return;
    setIsSaving(true);

    const numericDuration = parseInt(duration);
    const numericPegCount = parseInt(pegCount);

    if (isNaN(numericDuration) || numericDuration <= 0) {
      toast({ variant: "destructive", title: "Invalid Duration" });
      setIsSaving(false);
      return;
    }

    const categoriesArray = categoriesText.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);

    setDocumentNonBlocking(settingsDocRef, {
      maxBorrowDurationHours: numericDuration,
      pegCount: numericPegCount,
      categories: categoriesArray,
      lastFirmwareUrl: firmwareUrl,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Settings Saved" });
    }, 600);
  };

  const handleFirmwareUpdate = () => {
    if (!firestore || !user || !firmwareUrl) return;
    
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
      message: `OTA Update triggered: ${firmwareUrl.split('/').pop()?.substring(0, 15)}...`,
      userId: user.uid,
      userName: user.displayName || 'Admin',
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      setIsUpdatingFirmware(false);
      toast({ title: "Update Dispatched", description: "Device signaled to start OTA." });
    }, 1000);
  };

  // Web Serial API logic for "Direct USB Update"
  const handleDirectUsbFlash = async () => {
    if (!('serial' in navigator)) {
      toast({ 
        variant: "destructive", 
        title: "Not Supported", 
        description: "Your browser doesn't support Web Serial. Use Chrome or Edge." 
      });
      return;
    }

    toast({
      title: "Direct Flash Mode",
      description: "Ensure your ESP32 is connected via USB. This feature requires the ESP Web Flasher library (not included in this MVP).",
    });
    // In a production app, we would integrate 'esptool-js' here.
  };

  const isOnline = status?.lastHeartbeat && (new Date().getTime() - new Date(status.lastHeartbeat).getTime() < 60000);

  return (
    <div className="px-6 py-4 space-y-6 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Settings size={22} className="text-accent" />
          Hardware & System
        </h2>
        <p className="text-xs text-muted-foreground">Manage physical slots and firmware logic.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Cpu size={18} className="text-accent" />
              <CardTitle className="text-base font-bold">Firmware Maintenance</CardTitle>
            </div>
            <Badge variant={isOnline ? "default" : "outline"} className={isOnline ? "bg-emerald-500" : "text-slate-400"}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center gap-3 text-center">
            <div className="bg-white p-3 rounded-full shadow-sm text-primary">
              <Usb size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Local USB Flash</h4>
              <p className="text-[10px] text-muted-foreground">Update your device directly via USB cable (No Internet required).</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDirectUsbFlash}
              className="w-full h-10 rounded-xl font-bold text-xs gap-2"
            >
              <Usb size={14} />
              Connect & Flash via USB
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-black text-slate-400 uppercase">OR REMOTE OTA</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Direct Binary Upload</Label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".bin" 
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="secondary"
                className="w-full h-12 rounded-xl bg-accent/10 border-accent/20 border-dashed text-primary hover:bg-accent/20 font-bold gap-2"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                Select .bin file from PC
              </Button>
            </div>

            {firmwareUrl && (
              <div className="space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <ShieldCheck className="text-emerald-500" size={16} />
                  <p className="text-[10px] font-bold text-emerald-700 truncate">Ready: {firmwareUrl.split('/').pop()?.substring(0, 30)}...</p>
                </div>
                <Button 
                  onClick={handleFirmwareUpdate}
                  disabled={isUpdatingFirmware || !isOnline}
                  className="w-full h-12 rounded-xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  {isUpdatingFirmware ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={16} />}
                  Execute Remote Update
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Cabinet Layout</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pegCount" className="text-xs font-bold uppercase text-muted-foreground">Total Slots</Label>
              <Input 
                id="pegCount" 
                type="number"
                value={pegCount}
                onChange={(e) => setPegCount(e.target.value)}
                className="bg-slate-50 h-11 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-xs font-bold uppercase text-muted-foreground">Borrow Limit (Hrs)</Label>
              <Input 
                id="duration" 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-50 h-11 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categories" className="text-xs font-bold uppercase text-muted-foreground">Key Categories</Label>
            <Textarea 
              id="categories" 
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              className="bg-slate-50 min-h-[80px] rounded-xl text-xs"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-primary text-white gap-2 rounded-xl h-12 font-bold"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save System Policies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
