'use client';

import { Key } from 'lucide-react';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileHeaderProps {
  onProfileClick: () => void;
}

export function MobileHeader({ onProfileClick }: MobileHeaderProps) {
  const { user } = useUser();

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 rotate-[-5deg]">
          <Key size={20} className="stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-primary leading-none">KeyFlow</span>
          <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mt-1">PRO MANAGEMENT</span>
        </div>
      </div>
      
      <button 
        onClick={onProfileClick}
        className="rounded-2xl hover:ring-4 hover:ring-accent/10 transition-all focus:outline-none p-0.5 bg-slate-50 border border-slate-200"
        aria-label="View Profile"
      >
        <Avatar className="w-9 h-9 border-2 border-white shadow-sm rounded-xl">
          {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} className="rounded-xl" />}
          <AvatarFallback className="bg-slate-100 text-[11px] font-black text-primary rounded-xl">
            {getInitials(user?.displayName || null)}
          </AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
}
