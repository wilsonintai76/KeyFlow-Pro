"use client";

import { useState, useMemo } from 'react';
import { LayoutDashboard, Key as KeyIcon, History, Sparkles, Plus } from 'lucide-react';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { KeyStats } from '@/components/dashboard/KeyStats';
import { KeyCard } from '@/components/inventory/KeyCard';
import { SmartAssigner } from '@/components/ai/SmartAssigner';
import { TransactionHistory } from '@/components/history/TransactionHistory';
import { INITIAL_ASSIGNEES, INITIAL_KEYS, INITIAL_TRANSACTIONS } from '@/lib/mock-data';
import { Key, DashboardStats } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [keys] = useState<Key[]>(INITIAL_KEYS);
  const [assignees] = useState(INITIAL_ASSIGNEES);
  const [transactions] = useState(INITIAL_TRANSACTIONS);

  const stats = useMemo((): DashboardStats => {
    return {
      totalKeys: keys.length,
      available: keys.filter(k => k.status === 'available').length,
      checkedOut: keys.filter(k => k.status === 'checked_out').length,
      overdue: keys.filter(k => k.status === 'overdue').length,
    };
  }, [keys]);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background pb-20">
      <MobileHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-0">
          <KeyStats stats={stats} />
          <div className="px-6 mb-4">
            <h2 className="text-lg font-bold text-primary mb-3">Live Status</h2>
            <div className="space-y-1">
              {keys.map(key => (
                <KeyCard key={key.id} keyData={key} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary">Key Inventory</h2>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20">
              <Plus size={20} />
            </Button>
          </div>
          <div className="space-y-1">
            {keys.map(key => (
              <KeyCard key={key.id} keyData={key} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="px-6 pt-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary">Activity Log</h2>
          </div>
          <TransactionHistory transactions={transactions} keys={keys} assignees={assignees} />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <SmartAssigner keys={keys} assignees={assignees} transactions={transactions} />
        </TabsContent>

        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t mobile-nav-shadow z-50 px-4 py-2">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-1 py-1 px-0 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="flex flex-col items-center gap-1 py-1 px-0 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <KeyIcon size={20} />
              <span className="text-[10px] font-bold">Keys</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex flex-col items-center gap-1 py-1 px-0 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <History size={20} />
              <span className="text-[10px] font-bold">Log</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="flex flex-col items-center gap-1 py-1 px-0 h-auto data-[state=active]:bg-accent/20 data-[state=active]:text-primary"
            >
              <Sparkles size={20} className="text-accent fill-accent" />
              <span className="text-[10px] font-bold">AI</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}