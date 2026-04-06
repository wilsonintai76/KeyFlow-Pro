"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Loader2, Save, Hash, GraduationCap, BadgeCheck } from 'lucide-react';
import { useUser } from '@/lib/auth-provider';
import { api } from '@/lib/hono-client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/lib/types';

interface EditUserDialogProps {
  userProfile: UserProfile;
}

export function EditUserDialog({ userProfile }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [email, setEmail] = useState(userProfile.email);
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || '');
  const [registrationNumber, setRegistrationNumber] = useState(userProfile.registrationNumber || '');
  const [studentClass, setStudentClass] = useState(userProfile.studentClass || '');
  const [staffId, setStaffId] = useState(userProfile.staffId || '');
  const [role, setRole] = useState<UserRole>(userProfile.role);
  const [isSaving, setIsSaving] = useState(false);
  
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    // Validation
    if (role === 'student') {
      if (registrationNumber && !/^[a-zA-Z0-9]+$/.test(registrationNumber)) {
        toast({
          variant: "destructive",
          title: "Invalid Format",
          description: "Registration Number must be alphanumeric (letters and digits).",
        });
        return;
      }
    }

    if (role === 'staff' || role === 'admin') {
      if (staffId && !/^\d{4}$/.test(staffId)) {
        toast({
          variant: "destructive",
          title: "Invalid Format",
          description: "Staff ID must be exactly 4 digits.",
        });
        return;
      }
    }

    setIsSaving(true);
    
    try {
      const updateData: any = {
        fullName,
        email,
        phoneNumber,
        role,
        registrationNumber: role === 'student' ? (registrationNumber || null) : null,
        studentClass: role === 'student' ? (studentClass || null) : null,
        staffId: (role === 'staff' || role === 'admin') ? (staffId || null) : null,
      };

      await api.users[':id'].$patch({
        param: { id: userProfile.id },
        json: updateData
      });

      // Log the changes if role changed
      if (role !== userProfile.role && currentUser) {
        await api.logs.$post({
          json: {
            type: 'USER_MGMT',
            message: `Admin Override: Role of ${fullName} changed from ${userProfile.role} to ${role}`,
            userId: currentUser.id,
            userName: currentUser.user_metadata?.full_name || 'Admin',
          }
        });
      }

      toast({
        title: "User Updated",
        description: `Profile for ${fullName} has been saved.`,
      });
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save user changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary rounded-full">
          <Pencil size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Edit User Profile</DialogTitle>
            <DialogDescription>
              Modify user identity, contact details, or system role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6 max-h-[400px] overflow-y-auto px-1">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-fullname" className="font-bold text-xs uppercase text-muted-foreground">Full Name</Label>
              <Input
                id="edit-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email" className="font-bold text-xs uppercase text-muted-foreground">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone" className="font-bold text-xs uppercase text-muted-foreground">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+60..."
                  className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-role" className="font-bold text-xs uppercase text-muted-foreground">System Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role Specific Administration */}
            {role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-reg" className="font-bold text-xs uppercase text-muted-foreground">Reg. Number (Alphanumeric)</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      id="edit-reg"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="Letters & Digits"
                      className="h-11 bg-slate-50 border-slate-100 rounded-xl pl-9 focus:ring-accent"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-class" className="font-bold text-xs uppercase text-muted-foreground">Class</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      id="edit-class"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      placeholder="e.g. 5 Science"
                      className="h-11 bg-slate-50 border-slate-100 rounded-xl pl-9 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {(role === 'staff' || role === 'admin') && (
              <div className="grid gap-1.5">
                <Label htmlFor="edit-staffid" className="font-bold text-xs uppercase text-muted-foreground">Staff ID (4 Digits)</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="edit-staffid"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. 1234"
                    className="h-11 bg-slate-50 border-slate-100 rounded-xl pl-9 focus:ring-accent"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

