'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHardwareConfig } from './use-hardware-config';

export type ConnectivityStatus = 'CLOUD' | 'LOCAL' | 'OFFLINE' | 'INITIALIZING';

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectivityStatus>('INITIALIZING');
  const { hardwareIp } = useHardwareConfig();
  const [isHardwareReachable, setIsHardwareReachable] = useState(false);
  const [activeHardwareUrl, setActiveHardwareUrl] = useState<string>(hardwareIp);


  const checkConnectivity = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const isOnline = window.navigator.onLine;
    const isHttps = window.location.protocol === 'https:';
    const isLocalOrigin = window.location.hostname === 'localhost' || 
                         window.location.hostname === '192.168.4.1' || 
                         window.location.hostname.startsWith('192.168.');

    // If on HTTPS and NOT on a local origin, we skip background pings to avoid Mixed Content errors.
    // However, if we are on a local origin (e.g. 192.168.4.1), we always proceed with local checks.
    if (isHttps && isOnline && !isLocalOrigin) {
      setIsHardwareReachable(false);
      setStatus('CLOUD');
      return;
    }


    
    // List of addresses to try for the hardware
    const potentialIps = [hardwareIp, 'http://keymaster.local', 'http://192.168.4.1'];
    // Remove duplicates and keep configured one first
    const uniqueIps = Array.from(new Set(potentialIps.filter(Boolean)));
    
    let reachable = false;
    let successfulIp = hardwareIp;

    for (const ip of uniqueIps) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1500); // Quick ping
        
        const response = await fetch(`${ip}/status`, { 
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(id);
        if (response.ok) {
          reachable = true;
          successfulIp = ip!;
          break; // Found it!
        }
      } catch (e) {
        continue;
      }
    }

    setIsHardwareReachable(reachable);
    setActiveHardwareUrl(successfulIp);
    
    // If the configured IP is failing but another one works, we could potentially update it

    // but for now we just drive the status.
    
    if (isOnline) {
      setStatus('CLOUD');
    } else if (reachable) {
      setStatus('LOCAL');
    } else {
      setStatus('OFFLINE');
    }
  }, [hardwareIp]);


  useEffect(() => {
    checkConnectivity();
    
    // Set up listeners
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);

    const interval = setInterval(checkConnectivity, 10000); // Check every 10s

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  const syncUserToHardware = async (profile: any) => {
    if (!isHardwareReachable || !activeHardwareUrl) return { success: false, error: 'Hardware unreachable' };

    try {
      const response = await fetch(`${activeHardwareUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([profile]) // ESP32 expects an array of users
      });
      return { success: response.ok };
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  };

  return { status, isHardwareReachable, activeHardwareUrl, checkConnectivity, syncUserToHardware };
}


