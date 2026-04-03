"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Save, Loader2, User, Hash, GraduationCap, BadgeCheck, Mail } from 'lucide-react';
import { api } from '@/lib/hono-client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';

interface UserProfileDialogProps {
  userId: string;
}

export function UserProfileDialog({ userId }: UserProfileDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [staffId, setStaffId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with profile OR auth metadata on initial load
  useEffect(() => {
    if (profile) {
      if (!fullName && profile.fullName) setFullName(profile.fullName);
      else if (!fullName && user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
    } else if (!fullName && user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [profile, user, fullName]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const res = await api.users[':id'].$get({
          param: { id: userId }
        });
        const data = (await res.json()) as any;
        if (data && !('error' in data)) {
          setProfile(data as UserProfile);
          setFullName(data.fullName || '');
          setPhoneNumber(data.phoneNumber || '');
          setRegistrationNumber(data.registrationNumber || '');
          setStudentClass(data.studentClass || '');
          setStaffId(data.staffId || '');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const isGuest = profile?.role === 'guest';

  const handleSave = async () => {
    if (!userId || isGuest) return;

    // Validation
    if (profile?.role === 'student') {
      if (registrationNumber && !/^[a-zA-Z0-9]+$/.test(registrationNumber)) {
        toast({
          variant: "destructive",
          title: "Invalid Format",
          description: "Registration Number must be alphanumeric (letters and digits).",
        });
        return;
      }
    }

    if (profile?.role === 'staff' || profile?.role === 'admin') {
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
      const updateData = {
        fullName,
        phoneNumber,
        registrationNumber: profile?.role === 'student' ? (registrationNumber || null) : null,
        studentClass: profile?.role === 'student' ? (studentClass || null) : null,
        staffId: (profile?.role === 'staff' || profile?.role === 'admin') ? (staffId || null) : null,
      };

      await api.profile.$patch({
        json: updateData
      });

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save profile changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-10 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm overflow-hidden rounded-3xl">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <div className="flex items-center gap-2 text-primary">
          <User size={18} className="text-accent" />
          <CardTitle className="text-base font-bold">Identity & Contact</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {isGuest 
            ? "Guest profiles are read-only. Contact admin for role assignment." 
            : "Update how you appear in the system."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Email - Always Read Only */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
            <Input 
              value={profile?.email || user?.email || ''} 
              disabled 
              className="bg-slate-100/50 border-slate-100 h-11 pl-10 text-muted-foreground font-medium italic cursor-not-allowed uppercase" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
          <Input 
            id="fullName" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isGuest}
            className="bg-slate-50 border-slate-100 h-11 focus-visible:ring-accent font-semibold disabled:opacity-70"
            placeholder="Enter your full name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                id="phone" 
                type="tel"
                placeholder="+60..." 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isGuest}
                className="bg-slate-50 border-slate-100 h-11 pl-10 focus-visible:ring-accent font-semibold disabled:opacity-70"
              />
            </div>
          </div>

          {/* Role Specific Fields */}
          {profile?.role === 'student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="regNum" className="text-xs font-bold uppercase text-muted-foreground">Reg. Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="regNum" 
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    disabled={isGuest}
                    placeholder="ST-XXXX"
                    className="bg-slate-50 border-slate-100 h-11 pl-10 focus-visible:ring-accent font-semibold disabled:opacity-70"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentClass" className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="studentClass" 
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    disabled={isGuest}
                    placeholder="e.g. 5 Science"
                    className="bg-slate-50 border-slate-100 h-11 pl-10 focus-visible:ring-accent font-semibold disabled:opacity-70"
                  />
                </div>
              </div>
            </>
          )}

          {(profile?.role === 'staff' || profile?.role === 'admin') && (
            <div className="space-y-2">
              <Label htmlFor="staffId" className="text-xs font-bold uppercase text-muted-foreground">Staff ID</Label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  id="staffId" 
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  disabled={isGuest}
                  placeholder="EMP-XXXX"
                  className="bg-slate-50 border-slate-100 h-11 pl-10 focus-visible:ring-accent font-semibold disabled:opacity-70"
                />
              </div>
            </div>
          )}
        </div>

        {!isGuest && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-11 font-bold shadow-lg shadow-primary/20 mt-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} />
                Save Profile
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
