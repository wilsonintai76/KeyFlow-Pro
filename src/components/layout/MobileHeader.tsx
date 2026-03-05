import { Key } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
          <Key size={20} />
        </div>
        <span className="tracking-tight">KeyFlow <span className="text-accent">Pro</span></span>
      </div>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary">
        AD
      </div>
    </header>
  );
}