"use client";

import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Key as KeyIcon, Users, Unlock, User as UserIcon, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
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
import { CabinetControl } from '@/components/cabinet/CabinetControl';

import { Key, DashboardStats, Complaint, UserRole } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/card';
import { 
  useUser, 
  useAuth,
} from '@/lib/auth-provider';
import { api } from '@/lib/hono-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [keys, setKeys] = useState<Key[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(true);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);

  // Auto-logout timer
  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        signOut();
        toast({
          title: "Session Expired",
          description: "Signed out to conserve system resources.",
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
  }, [user, signOut, toast]);

  // Fetch Profile
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const res = await api.profile.$get();
        const data = await res.json();
        
        if (data && !('error' in data)) {
          setProfile(data);
        } else {
          // Create profile if not exists
          const email = user.email?.toLowerCase();
          const isMasterAdmin = email === 'wilsonintai76@gmail.com';
          const role = isMasterAdmin ? 'admin' : 'guest';
          
          const createRes = await api.profile.$post({
            json: {
              fullName: user.user_metadata?.full_name || 'Guest User',
              email: user.email || '',
              role: role,
            }
          });
          const newData = await createRes.json();
          if (!('error' in newData)) setProfile(newData);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch Keys & Complaints
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const keysRes = await api.keys.$get();
        const keysData = await keysRes.json();
        if (Array.isArray(keysData)) {
          setKeys(keysData.map((k: any) => ({
            id: k.id,
            name: k.keyIdentifier || k.name || 'Unnamed Key',
            type: k.description || k.type || 'General',
            location: k.location || 'Unknown',
            status: (k.currentStatus || k.status || 'available') as any,
            currentAssigneeId: k.lastAssignedToUserId || k.currentAssigneeId,
            lastCheckoutTimestamp: k.lastCheckoutTimestamp,
            pegIndex: k.pegIndex
          })));
        }

        if (profile?.role === 'admin') {
          const complaintsRes = await api.complaints.pending.$get();
          const complaintsData = await complaintsRes.json();
          if (Array.isArray(complaintsData)) {
            setPendingComplaintsCount(complaintsData.length);
          }
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setIsKeysLoading(false);
      }
    };

    fetchData();
  }, [user, profile?.role]);

  const userRole = profile?.role || 'guest';
  const isAdminUser = userRole === 'admin';
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  const stats = useMemo((): DashboardStats => {
    return {
      totalKeys: keys.length,
      available: keys.filter(k => k.status === 'available').length,
      checkedOut: keys.filter(k => k.status === 'checked_out').length,
      overdue: keys.filter(k => k.status === 'overdue').length,
    };
  }, [keys]);

  const handleUnlockCabinet = async () => {
    if (!user || !isStaffOrAdmin) return;
    
    try {
      await api.unlock.$post({
        json: {
          userId: user.id,
          userName: profile?.fullName || user.user_metadata?.full_name || 'Staff',
        }
      });

      toast({
        title: "Opening Cabinet",
        description: "Hardware signal dispatched.",
      });
    } catch (err) {
      toast({
        title: "Unlock Failed",
        description: "Could not dispatch hardware signal.",
        variant: "destructive"
      });
    }
  };

  if (isLoading || (user && isProfileLoading && !profile)) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-10 bg-slate-50">
        <div className="bg-primary text-white p-7 rounded-[2.5rem] shadow-2xl">
          <KeyIcon size={64} className="stroke-[2.5]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight text-primary">KeyFlow <span className="text-accent">Pro</span></h1>
          <p className="text-muted-foreground text-sm font-medium">Intelligent staff key management.</p>
        </div>
        <Button onClick={() => signInWithGoogle()} className="w-full h-14 gap-3 text-base font-bold shadow-xl rounded-2xl bg-white text-slate-900 border transition-all active:scale-95" variant="outline">
          Continue with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 pb-24 shadow-2xl border-x">
      <MobileHeader onProfileClick={() => setActiveTab('profile')} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-0">
          <KeyStats stats={stats} />
          <div className="px-5 mb-6">
            <HardwareMonitor minimalist />
          </div>
          <div className="px-5 mb-8">
            {userRole !== 'guest' && <CabinetControl />}
          </div>
          <div className="px-5">
            <h2 className="text-lg font-black text-primary mb-4">Live Inventory</h2>
            <div className="space-y-1">
              {keys.map(key => <KeyCard key={key.id} keyData={key} isAdmin={false} />)}
            </div>
          </div>
        </TabsContent>



        <TabsContent value="inventory" className="mt-0 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-primary">Inventory</h2>
            {isAdminUser && <AddKeyDialog />}
          </div>
          <div className="space-y-1">
            {keys.map(key => <KeyCard key={key.id} keyData={key} isAdmin={isAdminUser} />)}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          {isAdminUser ? <UserManagement /> : <div className="p-12 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Restricted Access</div>}
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          {isAdminUser ? (
            <Tabs defaultValue="system">
              <div className="px-5 pt-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-2xl h-12">
                  <TabsTrigger value="system" className="rounded-xl text-[10px] font-black uppercase">Hub</TabsTrigger>
                  <TabsTrigger value="audit" className="rounded-xl text-[10px] font-black uppercase">Logs</TabsTrigger>
                  <TabsTrigger value="complaints" className="rounded-xl text-[10px] font-black uppercase relative">
                    Issues {pendingComplaintsCount > 0 && <span className="ml-1 text-rose-500">•</span>}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="system"><SystemSettings /></TabsContent>
              <TabsContent value="audit"><AuditLog /></TabsContent>
              <TabsContent value="complaints"><ComplaintManager /></TabsContent>
            </Tabs>
          ) : <div className="p-12 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Restricted Access</div>}
        </TabsContent>

        <TabsContent value="profile" className="mt-0 p-5 space-y-6">
          <div className="flex flex-col items-center gap-5 py-10 bg-white rounded-[2.5rem] shadow-xl border">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-primary border shadow-2xl relative">
              <UserIcon size={48} />
              <Badge className="absolute -bottom-2 bg-accent text-primary font-black shadow-lg text-[10px]">
                {userRole.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center px-6">
              <h3 className="text-2xl font-black text-primary">{profile?.fullName || user.user_metadata?.full_name}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase">{user.email}</p>
            </div>
          </div>
          <UserProfileDialog userId={user.id} />
          <ReportProblemDialog />
          <Button variant="outline" className="w-full border-rose-100 text-rose-500 rounded-2xl h-14 font-black" onClick={() => signOut()}>
            SIGN OUT
          </Button>
        </TabsContent>

        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-2xl border-t z-50 px-5 pb-6 pt-4 rounded-t-[2.5rem]">
          <TabsList className={`grid w-full ${isAdminUser ? 'grid-cols-4' : (isStaffOrAdmin ? 'grid-cols-3' : 'grid-cols-2')} bg-transparent gap-2`}>
            <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white">
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-black uppercase">Dash</span>
            </TabsTrigger>

            <TabsTrigger value="inventory" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white">
              <KeyIcon size={20} />
              <span className="text-[10px] font-black uppercase">Keys</span>
            </TabsTrigger>
            {isAdminUser && (
              <>
                <TabsTrigger value="users" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users size={20} />
                  <span className="text-[10px] font-black uppercase">Users</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white">
                  <SettingsIcon size={20} />
                  <span className="text-[10px] font-black uppercase">Settings</span>
                </TabsTrigger>
              </>
            )}
            {!isAdminUser && isStaffOrAdmin && (
               <TabsTrigger value="profile" className="flex flex-col items-center gap-1.5 py-2 px-0 h-auto rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white">
                <UserIcon size={20} />
                <span className="text-[10px] font-black uppercase">Me</span>
              </TabsTrigger>
            )}
          </TabsList>
        </nav>
      </Tabs>
      <Toaster />
    </div>
  );
}
