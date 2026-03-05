
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Save, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserProfileDialogProps {
  userId: string;
}

export function UserProfileDialog({ userId }: UserProfileDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Memoize the document reference to satisfy hook requirements
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'user_profiles', userId);
  }, [firestore, userId]);

  const { data: profile, isLoading } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber(profile.phoneNumber);
    }
  }, [profile]);

  const handleSave = () => {
    if (!firestore || !userId || !userDocRef) return;
    setIsSaving(true);

    setDocumentNonBlocking(userDocRef, {
      id: userId,
      phoneNumber: phoneNumber,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Profile Updated",
        description: "Your contact information has been saved successfully.",
      });
    }, 500);
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
          <Phone size={18} className="text-accent" />
          <CardTitle className="text-base font-bold">Contact Details</CardTitle>
        </div>
        <CardDescription className="text-xs">Update your profile information.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Input 
              id="phone" 
              type="tel"
              placeholder="+1 (555) 000-0000" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-slate-50 border-slate-100 h-11 focus-visible:ring-accent"
            />
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-11 font-bold shadow-lg shadow-primary/20"
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
      </CardContent>
    </Card>
  );
}
