
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Loader2, 
  Cpu, 
  RefreshCw, 
  LayoutGrid, 
  Upload, 
  Usb,
  ShieldCheck,
  FileCode,
  Download,
  Cloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/hono-client';

export function SystemSettings() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushingOTA, setIsPushingOTA] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const handleDownloadFirmware = () => {
    window.open('/firmware/esp32-firmware.ino', '_blank');
    toast({ title: "Downloading Source", description: "Loading esp32-firmware.ino..." });
  };

  const handlePushOTA = async () => {
    setIsPushingOTA(true);
    
    try {
      const otaUrl = `${window.location.origin}/firmware/latest.bin`;
      
      await api.ota.$post({
        json: { otaUrl }
      });

      toast({ 
        title: "OTA Dispatched", 
        description: "Cabinet has been notified to check for updates." 
      });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "OTA Error", 
        description: "Could not send update signal." 
      });
    } finally {
      setIsPushingOTA(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Hub Synced", description: "Cabinet policies updated." });
    }, 800);
  };

  const isOnline = true; // Simulated online status

  return (
    <div className="px-6 py-4 space-y-6 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileCode size={22} className="text-accent" />
          Hardware Hub
        </h2>
        <p className="text-xs text-muted-foreground">Manage physical ESP32 controller and firmware.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Cpu size={18} className="text-accent" />
              <CardTitle className="text-base font-bold">Logic Manager</CardTitle>
            </div>
            <Badge variant="default" className="bg-emerald-50 text-emerald-600">ONLINE</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center gap-3 text-center">
            <Usb size={24} className="text-primary" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Standard Flash (USB)</h4>
              <p className="text-[10px] text-muted-foreground px-4 leading-relaxed">Download the latest Arduino source for manual flashing via USB.</p>
            </div>
            <a 
              href="/firmware/esp32-firmware.ino" 
              download="esp32-firmware.ino"
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 rounded-xl font-bold text-xs gap-2 border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Download esp32-firmware.ino
            </a>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-black text-slate-300 uppercase">Over-The-Air (OTA)</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col gap-2">
              <h4 className="text-[10px] font-black uppercase text-amber-600">Staging Required</h4>
              <p className="text-[10px] text-amber-700 leading-tight">
                Web browsers cannot write to your local files. Copy your <code className="bg-white px-1">.bin</code> to <code className="bg-white px-1">public/firmware/latest.bin</code> before deploying.
              </p>
            </div>

            <Button variant="outline" disabled className="w-full h-12 rounded-xl border-dashed text-slate-400 font-bold gap-2">
              <ShieldCheck size={18} /> latest.bin verified on server
            </Button>
            <Button 
              onClick={handlePushOTA} 
              disabled={isPushingOTA}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {isPushingOTA ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
              Push OTA to Cabinet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Cloud size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">What is OTA Update?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-[11px] text-muted-foreground space-y-3 font-medium">
          <p>
            <b>Over-The-Air (OTA)</b> allows you to update your ESP32's software wirelessly over WiFi. 
            No USB cable is required once the dashboard is set up.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open <span className="text-primary font-bold">esp32-firmware.ino</span> in Arduino IDE.</li>
            <li>Select <b>Sketch ➔ Export Compiled Binary</b>.</li>
            <li>Copy the <span className="text-primary font-bold">.bin</span> file to <code className="bg-slate-100 px-1 rounded">public/firmware/latest.bin</code> in this project.</li>
            <li>Deploy to Vercel to host the update at:</li>
            <div className="bg-slate-900 text-slate-100 p-2 rounded-lg mt-2 font-mono overflow-x-auto text-[10px]">
              {mounted && `${window.location.origin}/firmware/latest.bin`}
            </div>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Cabinet Policies</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Total Slots</Label>
              <Input defaultValue="10" className="bg-slate-50 rounded-xl font-bold border-none h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Return Goal (Hrs)</Label>
              <Input defaultValue="24" className="bg-slate-50 rounded-xl font-bold border-none h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Categories (CSV)</Label>
            <Textarea defaultValue="Workshop, Room, Machine" className="bg-slate-50 rounded-xl text-xs border-none" />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-lg">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sync Rules
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
