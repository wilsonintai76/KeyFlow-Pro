'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'keyflow_hardware_ip';
const DEFAULT_MDNS = 'http://keymaster.local';

export function useHardwareConfig() {
  const [hardwareIp, setHardwareIp] = useState<string>(DEFAULT_MDNS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHardwareIp(saved);
    }
  }, []);

  const updateHardwareIp = (ip: string) => {
    let formattedIp = ip.trim();
    if (formattedIp && !formattedIp.startsWith('http')) {
      formattedIp = `http://${formattedIp}`;
    }
    setHardwareIp(formattedIp || DEFAULT_MDNS);
    localStorage.setItem(STORAGE_KEY, formattedIp || DEFAULT_MDNS);
  };

  return {
    hardwareIp,
    updateHardwareIp,
    isUsingCustomIp: hardwareIp !== DEFAULT_MDNS
  };
}
