
"use client";

import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Key as KeyIcon, History, Sparkles, Loader2, LogIn, Unlock, User as UserIcon, ShieldAlert } from 'lucide-react';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { KeyStats } from '@/components/dashboard/KeyStats';
import { KeyCard } from '@/components/inventory/KeyCard';
import { SmartAssigner } from '@/components/ai/SmartAssigner';
import { TransactionHistory } from '@/components/history/TransactionHistory';
import { AddKeyDialog } from '@/components/inventory/AddKeyDialog';
import { UserProfileDialog } from '@/components/profile/UserProfileDialog';
import { Key, DashboardStats, Transaction } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/card';
import { 
  useCollection, 
  useDoc,
  useUser, 
  useFirestore, 
  useMemoFirebase,
  useAuth,
  initiateGoogleSignIn,
  addDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { INITIAL_ASSIGNEES } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  // Fetch user profile to check role
  const profileDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'user_profiles', user.uid);
  }, [firestore, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(profileDocRef);

  // Initialize profile as guest if it doesn't exist
  useEffect(() => {
    if (user && !isProfileLoading && !profile && firestore) {
      const newProfile = {
        id: user.uid,
        firstName: user.displayName?.split(' ')[0] || 'User',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        role: 'guest',
        createdAt: new Date().toISOString()
      };
      setDocumentNonBlocking(doc(firestore, 'user_profiles', user.uid), newProfile, { merge: true });
    }
  }, [user, isProfileLoading, profile, firestore]);

  const userRole = profile?.role || 'guest';
  const isAdminUser = userRole === 'admin';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  const keysQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'keys'), orderBy('keyIdentifier', 'asc'));
  }, [firestore, user]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'assignments'), orderBy('checkoutDateTime', 'desc'));
  }, [firestore, user]);

  const { data: keysData, isLoading: isKeysLoading } = useCollection<any>(keysQuery);
  const { data: assignmentsData, isLoading: isAssignmentsLoading } = useCollection<any>(assignmentsQuery);

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

  const handleUnlockCabinet = () => {
    if (!firestore || !user) return;
    
    addDocumentNonBlocking(collection(firestore, 'hardware_triggers'), {
      action: 'UNLOCK_CABINET',
      timestamp: new Date().toISOString(),
      userId: user.uid,
      status: 'pending'
    });

    toast({
      title: "Cabinet Access Requested",
      description: "Hardware signal sent. Cabinet will unlock shortly.",
    });
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 bg-slate-50">
        <div className="bg-primary text-white p-6 rounded-3xl shadow-2xl animate-in zoom-in-50 duration-500">
          <KeyIcon size={64} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">KeyFlow Pro</h1>
          <p className="text-muted-foreground text-lg max-w-xs">Intelligent key tracking for secure environments.</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Button 
            onClick={() => initiateGoogleSignIn(auth)} 
            className="w-full h-12 gap-3 text-base shadow-md"
            variant="default"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pt-4">Staff Managed Access Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 pb-24 shadow-2xl relative border-x">
      <MobileHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-0">
          <KeyStats stats={stats} />
          
          <div className="px-6 mb-6">
            <Card className={`border-none shadow-lg bg-gradient-to-br overflow-hidden ${isStaffOrAdmin ? 'from-primary to-primary/80 text-white' : 'from-slate-200 to-slate-300 text-slate-500'}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Cabinet Control</h3>
                    {userRole === 'guest' && <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-400">RESTRICTED</Badge>}
                  </div>
                  <p className="text-xs opacity-80">{isStaffOrAdmin ? 'Trigger solenoid to unlock' : 'Staff access required to unlock'}</p>
                </div>
                <Button 
                  onClick={handleUnlockCabinet} 
                  disabled={!isStaffOrAdmin}
                  className={`${isStaffOrAdmin ? 'bg-accent hover:bg-accent/90 text-primary animate-pulse' : 'bg-slate-400 text-slate-100'} font-black rounded-full shadow-xl transition-all`}
                  size="icon"
                >
                  {isStaffOrAdmin ? <Unlock size={24} /> : <ShieldAlert size={24} />}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="px-6 mb-4">
            <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-accent rounded-full" />
              Live Inventory
            </h2>
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
            <h2 className="text-xl font-bold text-primary">Key Management</h2>
            {isAdminUser && <AddKeyDialog />}
          </div>
          <div className="space-y-1">
            {keys.map(key => (
              <KeyCard key={key.id} keyData={key} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="px-6 pt-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary">Activity Logs</h2>
          </div>
          <TransactionHistory transactions={transactions} keys={keys} assignees={INITIAL_ASSIGNEES} />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <SmartAssigner keys={keys} assignees={INITIAL_ASSIGNEES} transactions={transactions} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0 p-6">
           <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-8 bg-white rounded-3xl shadow-sm border">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-lg relative">
                  <UserIcon size={40} />
                  <Badge className="absolute -bottom-2 bg-accent text-primary font-bold border-2 border-white">
                    {userRole.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-primary">{user.displayName || 'Staff Member'}</h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <UserProfileDialog userId={user.uid} />
              <Button 
                variant="outline" 
                className="w-full border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                onClick={() => auth.signOut()}
              >
                Sign Out
              </Button>
           </div>
        </TabsContent>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t mobile-nav-shadow z-50 px-4 py-3">
          <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-1.5 py-1 px-0 h-auto rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <LayoutDashboard size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="flex flex-col items-center gap-1.5 py-1 px-0 h-auto rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <KeyIcon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Keys</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex flex-col items-center gap-1.5 py-1 px-0 h-auto rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <History size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Logs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="flex flex-col items-center gap-1.5 py-1 px-0 h-auto rounded-xl data-[state=active]:bg-accent/20 data-[state=active]:text-primary"
            >
              <Sparkles size={18} className="text-accent fill-accent" />
              <span className="text-[9px] font-bold uppercase tracking-tight">Smart</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex flex-col items-center gap-1.5 py-1 px-0 h-auto rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <UserIcon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      <Toaster />
    </div>
  );
}
