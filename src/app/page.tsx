"use client";

import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Key as KeyIcon, Users, Loader2, Unlock, User as UserIcon, ShieldAlert, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { KeyStats } from '@/components/dashboard/KeyStats';
import { HardwareMonitor } from '@/components/dashboard/HardwareMonitor';
import { KeyCard } from '@/components/inventory/KeyCard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { ComplaintManager } from '@/components/admin/ComplaintManager';
import { AuditLog } from '@/components/admin/AuditLog';
import { AddKeyDialog } from '@/components/inventory/AddKeyDialog';
import { UserProfileDialog } from '@/components/profile/UserProfileDialog';
import { ReportProblemDialog } from '@/components/profile/ReportProblemDialog';
import { Key, DashboardStats, Complaint } from '@/lib/types';
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
  setDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc, where, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  // Inactivity session management
  useEffect(() => {
    if (!user || !auth) return;
    let timeoutId: any;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        auth.signOut();
        toast({
          title: "Session Expired",
          description: "Signed out due to inactivity.",
        });
      }, 15 * 60 * 1000);
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    events.forEach(event => document.addEventListener(event, handleActivity));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [user, auth, toast]);

  const profileDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'user_profiles', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(profileDocRef);

  // User Onboarding & Authorization Logic
  useEffect(() => {
    async function onboardUser() {
      if (!user || !firestore || isProfileLoading || !profileDocRef) return;
      
      const email = user.email?.toLowerCase();
      const isMasterAdmin = email === 'wilsonintai76@gmail.com';
      const isTrustedStaff = email === 'wilson@poliku.edu.my';

      if (!profile) {
        // Double check existence to prevent race conditions
        const snap = await getDoc(profileDocRef);
        if (!snap.exists()) {
          let role = 'guest';
          if (isMasterAdmin) role = 'admin';
          else if (isTrustedStaff) role = 'staff';

          setDocumentNonBlocking(profileDocRef, {
            id: user.uid,
            fullName: user.displayName || (isTrustedStaff ? 'Wilson Poliku' : 'Staff Member'),
            email: user.email || '',
            role: role,
            phoneNumber: isTrustedStaff ? '+60 12-345 6789' : '',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    }
    onboardUser();
  }, [user, isProfileLoading, profile, firestore, profileDocRef]);

  const userRole = profile?.role || 'guest';
  const isAdminUser = userRole === 'admin';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  // Stable Firestore queries
  const keysQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'keys'), orderBy('keyIdentifier', 'asc'));
  }, [firestore, user?.uid]);

  const pendingComplaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdminUser) return null;
    return query(collection(firestore, 'complaints'), where('status', '==', 'pending'));
  }, [firestore, user?.uid, isAdminUser]);

  const { data: keysData, isLoading: isKeysLoading } = useCollection<any>(keysQuery);
  const { data: pendingComplaints } = useCollection<Complaint>(pendingComplaintsQuery);

  const pendingComplaintsCount = pendingComplaints?.length || 0;

  const keys = useMemo(() => {
    return (keysData || []).map(k => ({
      id: k.id,
      name: k.keyIdentifier,
      type: k.description,
      location: k.location,
      status: k.currentStatus as any,
      currentAssigneeId: k.lastAssignedToUserId,
      lastCheckoutTimestamp: k.lastCheckoutTimestamp,
      pegIndex: k.pegIndex
    })) as Key[];
  }, [keysData]);

  const stats = useMemo((): DashboardStats => {
    return {
      totalKeys: keys.length,
      available: keys.filter(k => k.status === 'available').length,
      checkedOut: keys.filter(k => k.status === 'checked_out').length,
      overdue: keys.filter(k => k.status === 'overdue').length,
    };
  }, [keys]);

  const handleUnlockCabinet = () => {
    if (!firestore || !user || !isStaffOrAdmin) return;
    
    addDocumentNonBlocking(collection(firestore, 'hardware_triggers'), {
      action: 'UNLOCK_CABINET',
      timestamp: new Date().toISOString(),
      userId: user.uid,
      status: 'pending'
    });

    addDocumentNonBlocking(collection(firestore, 'system_logs'), {
      type: 'HARDWARE',
      message: `Cabinet unlocked by ${profile?.fullName || user.displayName || 'Staff member'}`,
      userId: user.uid,
      userName: profile?.fullName || user.displayName || 'Staff',
      timestamp: new Date().toISOString()
    });

    toast({
      title: "Opening Cabinet",
      description: "Solenoid triggered successfully.",
    });
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="relative">
           <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-xs font-bold text-primary animate-pulse tracking-widest uppercase">Secure Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-10 bg-slate-50">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative bg-primary text-white p-7 rounded-[2.5rem] shadow-2xl animate-in zoom-in-75 duration-700">
            <KeyIcon size={64} className="stroke-[2.5]" />
          </div>
        </div>
        <div className="space-y-3 z-10">
          <h1 className="text-4xl font-black tracking-tight text-primary">KeyFlow <span className="text-accent">Pro</span></h1>
          <p className="text-muted-foreground text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
            Intelligent physical key management for poliku staff.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-4 z-10">
          <Button 
            onClick={() => auth && initiateGoogleSignIn(auth)} 
            className="w-full h-14 gap-3 text-base font-bold shadow-xl rounded-2xl bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95" 
            variant="outline"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-px bg-slate-200 w-8" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Staff Restricted</p>
            <div className="h-px bg-slate-200 w-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 pb-24 shadow-2xl relative border-x border-slate-200/50">
      <MobileHeader onProfileClick={() => setActiveTab('profile')} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-0 animate-in fade-in duration-500">
          <KeyStats stats={stats} />
          <div className="px-5 mb-6">
            <HardwareMonitor minimalist />
          </div>
          <div className="px-5 mb-8">
            <Card className={`border-none shadow-xl rounded-[2rem] overflow-hidden ${isStaffOrAdmin ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl tracking-tight">Access Control</h3>
                    {userRole === 'guest' && <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-400 bg-white/50">LOCKED</Badge>}
                  </div>
                  <p className="text-xs font-medium opacity-70">
                    {isStaffOrAdmin ? 'Trigger physical cabinet solenoid' : 'Authorized staff access required'}
                  </p>
                </div>
                <Button 
                  onClick={handleUnlockCabinet} 
                  disabled={!isStaffOrAdmin}
                  className={`${isStaffOrAdmin ? 'bg-accent hover:bg-accent/90 text-primary shadow-[0_8px_20px_-4px_rgba(20,184,166,0.4)]' : 'bg-slate-400 text-slate-100'} h-14 w-14 rounded-2xl transition-all active:scale-90`}
                  size="icon"
                >
                  {isStaffOrAdmin ? <Unlock size={28} className="stroke-[2.5]" /> : <ShieldAlert size={28} />}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="px-5 mb-4">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-black text-primary flex items-center gap-2 tracking-tight">
                <div className="w-1.5 h-5 bg-accent rounded-full" />
                Live Inventory
              </h2>
              {isKeysLoading && <Loader2 className="animate-spin text-muted-foreground w-4 h-4" />}
            </div>
            
            <div className="space-y-1">
              {isKeysLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 w-full bg-white rounded-2xl mb-3 animate-pulse border" />
                ))
              ) : keys.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-dashed flex flex-col items-center gap-2">
                  <KeyIcon size={40} className="text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">No keys registered.</p>
                </div>
              ) : (
                keys.map(key => (
                  <KeyCard key={key.id} keyData={key} isAdmin={false} />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0 p-5 space-y-4 animate-in slide-in-from-right-4 duration-500">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-2xl font-black text-primary tracking-tight">Inventory</h2>
            {isAdminUser && <AddKeyDialog />}
          </div>
          <div className="space-y-1">
            {keys.map(key => (
              <KeyCard key={key.id} keyData={key} isAdmin={isAdminUser} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0 animate-in slide-in-from-right-4 duration-500">
          {isAdminUser ? (
            <UserManagement />
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-xl font-black text-primary">Restricted Area</h3>
              <p className="text-sm text-muted-foreground">This section is for system administrators only.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-0 animate-in slide-in-from-right-4 duration-500">
          {isAdminUser ? (
            <div className="space-y-2">
               <Tabs defaultValue="system" className="w-full">
                  <div className="px-5 pt-4">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-2xl p-1 h-12">
                      <TabsTrigger value="system" className="rounded-xl text-[10px] font-black uppercase tracking-tight data-[state=active]:shadow-md">Policies</TabsTrigger>
                      <TabsTrigger value="audit" className="rounded-xl text-[10px] font-black uppercase tracking-tight data-[state=active]:shadow-md">Logs</TabsTrigger>
                      <TabsTrigger value="complaints" className="rounded-xl text-[10px] font-black uppercase tracking-tight data-[state=active]:shadow-md relative">
                        Issues
                        {pendingComplaintsCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white font-black animate-bounce shadow-md">
                            {pendingComplaintsCount}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="system"><SystemSettings /></TabsContent>
                  <TabsContent value="audit"><AuditLog /></TabsContent>
                  <TabsContent value="complaints"><ComplaintManager /></TabsContent>
               </Tabs>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-xl font-black text-primary">Restricted Access</h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-0 p-5 space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="space-y-6">
              <div className="flex flex-col items-center gap-5 py-10 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary border-[6px] border-slate-50 shadow-2xl relative z-10">
                  <UserIcon size={48} className="stroke-[1.5]" />
                  <Badge className="absolute -bottom-2 bg-accent text-primary font-black border-4 border-white shadow-lg text-[10px] px-3">
                    {userRole.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center px-6 space-y-1 relative z-10">
                  <h3 className="text-2xl font-black text-primary tracking-tight">
                    {profile?.fullName || (user.displayName || 'Staff Member')}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">{user.email}</p>
                </div>
              </div>
              <UserProfileDialog userId={user.uid} />
              <ReportProblemDialog />
              <Button 
                variant="outline" 
                className="w-full border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl flex items-center justify-center gap-3 h-14 font-black shadow-sm transition-all active:scale-95" 
                onClick={() => auth?.signOut()}
              >
                <LogOut size={20} />
                SIGN OUT SESSION
              </Button>
           </div>
        </TabsContent>

        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-2xl border-t mobile-nav-shadow z-50 px-5 pb-6 pt-4 rounded-t-[2.5rem]">
          <TabsList className={`grid w-full ${isAdminUser ? 'grid-cols-4' : (isStaffOrAdmin ? 'grid-cols-3' : 'grid-cols-2')} bg-transparent gap-2`}>
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
              <LayoutDashboard size={20} className="stroke-[2]" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
              <KeyIcon size={20} className="stroke-[2]" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Keys</span>
            </TabsTrigger>
            {isAdminUser && (
              <>
                <TabsTrigger value="users" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                  <Users size={20} className="stroke-[2]" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Users</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 relative">
                  <SettingsIcon size={20} className="stroke-[2]" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Admin</span>
                  {pendingComplaintsCount > 0 && (
                    <span className="absolute top-2 right-4 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                  )}
                </TabsTrigger>
              </>
            )}
            {!isAdminUser && isStaffOrAdmin && (
               <TabsTrigger value="profile" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">
                <UserIcon size={20} className="stroke-[2]" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
              </TabsTrigger>
            )}
          </TabsList>
        </nav>
      </Tabs>
      <Toaster />
    </div>
  );
}
