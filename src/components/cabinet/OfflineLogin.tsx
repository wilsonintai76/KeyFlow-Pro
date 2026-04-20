'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldAlert, Loader2, WifiOff } from 'lucide-react';
import { useHardwareConfig } from '@/hooks/use-hardware-config';
import { useToast } from '@/hooks/use-toast';

interface OfflineLoginProps {
  onSuccess: (token: string, staffId: string) => void;
}

export function OfflineLogin({ onSuccess }: OfflineLoginProps) {
  const { hardwareIp } = useHardwareConfig();
  const { toast } = useToast();
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "Please enter your 4-digit security PIN.",
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await fetch(`${hardwareIp}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, pin }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      onSuccess(data.token, staffId);
      
      toast({
        title: "Offline Access Granted",
        description: `Logged in as ${staffId} via Local Hardware.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Verify your Staff ID and PIN. Ensure you are connected to the correct WiFi.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="h-2 bg-amber-400" />
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
          <WifiOff className="text-amber-500" size={32} />
        </div>
        <CardTitle className="text-2xl font-black text-primary">Offline Access</CardTitle>
        <CardDescription className="text-xs font-medium">Internet is down. Accessing cabinet via LAN.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staffId" className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Staff ID</Label>
            <Input 
              id="staffId"
              placeholder="e.g. STF-1234"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold focus:ring-amber-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">4-Digit PIN</Label>
            <Input 
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="h-12 bg-slate-50 border-none rounded-2xl px-4 text-center text-2xl tracking-[1rem] font-black focus:ring-amber-400"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider shadow-lg shadow-amber-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isAuthenticating ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Validating...
              </>
            ) : (
              <>
                <KeyRound size={20} className="mr-2" />
                Authenticate Locally
              </>
            )}
          </Button>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 font-medium leading-tight">
              Offline authentication records are stored on the cabinet hardware and will sync to the cloud once internet is restored.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
