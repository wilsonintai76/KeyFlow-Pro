'use client';

import { Key } from 'lucide-react';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function MobileHeader() {
  const { user } = useUser();

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
          <Key size={20} />
        </div>
        <span className="tracking-tight">KeyFlow <span className="text-accent">Pro</span></span>
      </div>
      
      <Avatar className="w-8 h-8 border shadow-sm">
        {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
        <AvatarFallback className="bg-secondary text-[10px] font-bold text-primary">
          {getInitials(user?.displayName || null)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
