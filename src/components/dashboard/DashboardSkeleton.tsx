'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Key } from 'lucide-react';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-200 p-2 rounded-xl rotate-[-5deg] animate-pulse w-9 h-9 flex items-center justify-center">
            <Key size={20} className="text-slate-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-2 w-28 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-9 h-9 bg-slate-200 rounded-xl animate-pulse" />
      </header>

      <main>
        <div className="p-6 pb-0 pt-8">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-2 gap-4 p-6">
          <div className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse shadow-sm" />
          <div className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse shadow-sm" />
        </div>

        {/* Skeleton Hardware Cards (Matching HardwareMonitor + CabinetControl) */}
        <div className="px-6 space-y-4">
          <div className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse shadow-sm" />
          <div className="h-[116px] bg-white border border-slate-100 rounded-[2rem] animate-pulse shadow-sm" />
        </div>

        {/* Skeleton Inventory Title */}
        <div className="p-6 pt-10">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Skeleton Keys List */}
        <div className="px-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      </main>

      {/* Skeleton Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl flex items-center justify-around px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </nav>
    </div>
  );
}
