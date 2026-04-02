"use client";

import { useState } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  addDocumentNonBlocking, 
  useUser, 
  collection, 
  query, 
  orderBy, 
  doc 
} from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  Phone, 
  Mail, 
  Trash2, 
  ShieldAlert 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/lib/types';
import { EditUserDialog } from './EditUserDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

export function UserManagement() {
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'user_profiles'), orderBy('email', 'asc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = (users || []).filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.phoneNumber?.includes(search)
  );

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!firestore || !currentUser) return;
    
    const userRef = doc(firestore, 'user_profiles', userId);
    deleteDocumentNonBlocking(userRef);

    addDocumentNonBlocking(collection(firestore, 'system_logs'), {
      type: 'USER_MGMT',
      message: `Admin Override: User profile for ${userName} (ID: ${userId}) was DELETED`,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Admin',
      timestamp: new Date().toISOString()
    });

    toast({
      variant: "destructive",
      title: "User Deleted",
      description: `Profile for ${userName} has been removed.`,
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-primary text-white';
      case 'staff': return 'bg-accent text-primary';
      case 'student': return 'bg-blue-500 text-white';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="px-6 py-4 space-y-4 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary">User Management</h2>
        <p className="text-xs text-muted-foreground">Manage roles and contact details for all staff and students.</p>
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-primary leading-tight truncate">
                          {userProfile.fullName}
                        </h3>
                        <Badge className={`${getRoleBadgeColor(userProfile.role)} text-[9px] uppercase font-bold py-0 h-4 shrink-0`}>
                          {userProfile.role}
                        </Badge>
                      </div>
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
                    
                    <div className="flex items-center gap-1">
                      <EditUserDialog userProfile={userProfile} />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-full">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                              <ShieldAlert size={20} />
                              Confirm Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the profile for <b>{userProfile.fullName}</b>? 
                              This action cannot be undone and they will lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(userProfile.id, userProfile.fullName)}
                              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

