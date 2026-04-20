'use client';

import { useConnectivity } from '@/hooks/use-connectivity';
import { WifiOff, ShieldAlert, Globe } from 'lucide-react';

export function ConnectivityBanner() {
  const { status } = useConnectivity();
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (status === 'INITIALIZING') return null;

  // If on Cloud/HTTPS, we show a subtle hint about local mode if they aren't already on it
  if (status === 'CLOUD') {
    if (!isHttps) return null;
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] h-8 bg-slate-800/80 backdrop-blur-sm text-white/70 flex items-center justify-center gap-2 px-4 transition-all duration-500">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em]">
          Working Offline? 
        </span>
        <a 
          href="http://192.168.4.1/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-400 hover:text-amber-300 underline underline-offset-2"
        >
          Open Local Dashboard
        </a>
      </div>
    );
  }


  return (
    <div className={`
      fixed top-0 left-0 right-0 z-[100] h-8 flex items-center justify-center gap-2 px-4 transition-all duration-500
      ${status === 'LOCAL' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'}
    `}>
      {status === 'LOCAL' ? (
        <>
          <ShieldAlert size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Offline Mode: Direct LAN Connection Active
          </span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            System Disconnected: Hardware Unreachable
          </span>
        </>
      )}
    </div>
  );
}
