
"use client";

import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Key as KeyIcon, History, Sparkles, Loader2, LogIn } from 'lucide-react';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { KeyStats } from '@/components/dashboard/KeyStats';
import { KeyCard } from '@/components/inventory/KeyCard';
import { SmartAssigner } from '@/components/ai/SmartAssigner';
import { TransactionHistory } from '@/components/history/TransactionHistory';
import { AddKeyDialog } from '@/components/inventory/AddKeyDialog';
import { Key, DashboardStats, Transaction, Assignee } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  useAuth,
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { INITIAL_ASSIGNEES } from '@/lib/mock-data';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  // Memoize Firestore queries
  const keysQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'keys'), orderBy('keyIdentifier', 'asc'));
  }, [firestore]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), orderBy('checkoutDateTime', 'desc'));
  }, [firestore]);

  const { data: keysData, isLoading: isKeysLoading } = useCollection<any>(keysQuery);
  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useCollection<any>(assignmentsQuery);

  // Map Firestore data to our app types
  const keys = useMemo(() => {
    return (keysData || []).map(k => ({
      id: k.id,
      name: k.keyIdentifier,
      type: k.description,
      location: k.location,
      status: k.currentStatus as any,
      currentAssigneeId: k.lastAssignedToUserId
    })) as Key[];
  }, [keysData]);

  const transactions = useMemo(() => {
    return (assignmentsData || []).map(a => ({
      id: a.id,
      keyId: a.keyId,
      assigneeId: a.assignedToUserId,
      checkoutDate: a.checkoutDateTime,
      returnDate: a.returnDateTime,
      status: a.status as any
    })) as Transaction[];
  }, [assignmentsData]);

  const stats = useMemo((): DashboardStats => {
    return {
      totalKeys: keys.length,
      available: keys.filter(k => k.status === 'available').length,
      checkedOut: keys.filter(k => k.status === 'checked_out').length,
      overdue: keys.filter(k => k.status === 'overdue').length,
    };
  }, [keys]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
        <div className="bg-primary text-white p-4 rounded-2xl shadow-xl">
          <KeyIcon size={48} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">KeyFlow Pro</h1>
          <p className="text-muted-foreground mt-2">Secure access to your key inventory.</p>
        </div>
        <Button onClick={() => initiateAnonymousSignIn(auth)} className="w-full max-w-xs gap-2">
          <LogIn size={18} />
          Sign In as Staff
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background pb-20">
      <MobileHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-0">
          <KeyStats stats={stats} />
          <div className="px-6 mb-4">
            <h2 className="text-lg font-bold text-primary mb-3">Live Status</h2>
            {isKeysLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-1">
                {keys.map(key => (
                  <KeyCard key={key.id} keyData={key} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary">Key Inventory</h2>
            <AddKeyDialog />
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
          <TransactionHistory transactions={transactions} keys={keys} assignees={INITIAL_ASSIGNEES} />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <SmartAssigner keys={keys} assignees={INITIAL_ASSIGNEES} transactions={transactions} />
        </TabsContent>

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
      <Toaster />
    </div>
  );
}
