"use client";

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserManagement() {
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'user_profiles'), orderBy('email', 'asc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<any>(usersQuery);

  const filteredUsers = (users || []).filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'user_profiles', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    
    toast({
      title: "Role Updated",
      description: `User role has been changed to ${newRole}.`,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-white';
      case 'staff': return 'bg-accent text-primary';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="px-6 py-4 space-y-4 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary">User Management</h2>
        <p className="text-xs text-muted-foreground">Manage roles and permissions for all registered users.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          className="pl-9 bg-white border-none shadow-sm h-11 rounded-xl" 
          placeholder="Search users..." 
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
                    <div className="flex flex-col">
                      <h3 className="font-bold text-primary leading-tight">
                        {userProfile.firstName} {userProfile.lastName}
                      </h3>
                      <span className="text-[10px] text-muted-foreground">{userProfile.email}</span>
                    </div>
                    <Badge className={`${getRoleBadgeColor(userProfile.role)} text-[9px] uppercase font-bold py-0 h-5`}>
                      {userProfile.role}
                    </Badge>
                  </div>
                  
                  <div className="pt-3 border-t flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold">
                      <UserCog size={12} className="text-accent" />
                      Assign Role
                    </div>
                    <Select 
                      value={userProfile.role} 
                      onValueChange={(value) => handleRoleChange(userProfile.id, value)}
                    >
                      <SelectTrigger className="h-8 w-28 text-[11px] font-bold bg-slate-50 border-none shadow-none rounded-lg focus:ring-accent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest" className="text-xs">Guest</SelectItem>
                        <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                        <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                      </SelectContent>
                    </Select>
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
