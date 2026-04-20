
"use client";

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { writeLog } from '@/firebase/rtdb';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useConnectivity } from '@/hooks/use-connectivity';
import { 
  Search, 
  UserCog, 
  Loader2, 
  Phone, 
  Mail, 
  Fingerprint, 
  Lock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';



export function UserManagement() {
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const { syncUserToHardware, isHardwareReachable } = useConnectivity();
  const [syncingId, setSyncingId] = useState<string | null>(null);


  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'user_profiles'), orderBy('email', 'asc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<any>(usersQuery);

  const filteredUsers = (users || []).filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.phoneNumber?.includes(search)
  );

  const handleUpdateUser = async (userId: string, userName: string, data: any) => {
    if (!firestore || !currentUser) return;
    const userRef = doc(firestore, 'user_profiles', userId);
    
    try {
      await updateDocumentNonBlocking(userRef, data);
      
      // If hardware is reachable, try auto-sync
      if (isHardwareReachable) {
        setSyncingId(userId);
        const result = await syncUserToHardware({ 
          staffId: data.staffId, 
          pin: data.pin,
          fullName: userName,
          role: data.role
        });
        setSyncingId(null);
        
        if (result.success) {
          toast({ title: "Auto-Sync Successful", description: `${userName} updated on hardware.` });
        } else {
          toast({ variant: 'destructive', title: "Sync Failed", description: "Hardware could not be updated." });
        }
      }

      writeLog('USER_MGMT', {
        type: 'USER_MGMT',
        message: `User ${userName} updated: ${JSON.stringify(data)}`,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Admin',
      });

      toast({ title: "Profile Updated", description: "Changes saved to cloud." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed", description: "Could not save changes." });
    }
  };


  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-white';
      case 'staff': return 'bg-accent text-primary';
      case 'student': return 'bg-sky-100 text-sky-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="px-6 py-4 space-y-4 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary">User Management</h2>
        <p className="text-xs text-muted-foreground">Manage roles and contact details for all staff.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          className="pl-9 bg-white border-none shadow-sm h-11 rounded-xl" 
          placeholder="Search by name, email or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed">
              <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
          ) : (
            filteredUsers.map((userProfile) => (
              <Card key={userProfile.id} className="border-none shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <h3 className="font-bold text-primary leading-tight truncate">
                        {userProfile.fullName}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Mail size={10} className="text-accent shrink-0" />
                          <span className="truncate">{userProfile.email}</span>
                        </div>
                        {userProfile.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Phone size={10} className="text-accent shrink-0" />
                            <span>{userProfile.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getRoleBadgeColor(userProfile.role)} text-[9px] uppercase font-bold py-0 h-5 shrink-0`}>
                      {userProfile.role}
                    </Badge>
                  </div>
                  
                  <div className="pt-3 border-t grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black">
                        <Fingerprint size={10} className="text-accent" />
                        Staff ID
                      </div>
                      <Input 
                        className="h-8 text-[11px] bg-slate-50 border-none rounded-lg font-mono font-bold" 
                        defaultValue={userProfile.staffId || ''}
                        placeholder="0000"
                        maxLength={4}
                        inputMode="numeric"
                        onBlur={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length === 4 && val !== userProfile.staffId) {
                            handleUpdateUser(userProfile.id, userProfile.fullName, { staffId: val });
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black">
                        <Lock size={10} className="text-accent" />
                        4-Digit PIN
                      </div>
                      <Input 
                        className="h-8 text-[11px] bg-slate-50 border-none rounded-lg font-mono font-bold" 
                        defaultValue={userProfile.pin || ''}
                        placeholder="0000"
                        maxLength={4}
                        inputMode="numeric"
                        onBlur={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length === 4 && val !== userProfile.pin) {
                            handleUpdateUser(userProfile.id, userProfile.fullName, { pin: val });
                          }
                        }}
                      />

                    </div>

                    <div className="col-span-2 flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black">
                          <UserCog size={10} className="text-accent" />
                          Role
                        </div>
                        <Select 
                          value={userProfile.role} 
                          onValueChange={(value) => handleUpdateUser(userProfile.id, userProfile.fullName, { role: value })}
                        >
                          <SelectTrigger className="h-7 w-24 text-[10px] font-bold bg-slate-50 border-none shadow-none rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guest" className="text-xs">Guest</SelectItem>
                            <SelectItem value="student" className="text-xs">Student</SelectItem>
                            <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                            <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {syncingId === userProfile.id ? (
                        <div className="flex items-center gap-1 text-[9px] text-amber-600 font-bold">
                          <Loader2 size={10} className="animate-spin" />
                          SYNCING...
                        </div>
                      ) : isHardwareReachable ? (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                          <CheckCircle2 size={10} />
                          SYNCED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                          <XCircle size={10} />
                          LOCAL ONLY
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
