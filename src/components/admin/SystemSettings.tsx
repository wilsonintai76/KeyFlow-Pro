
"use client";

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Clock, Save, Loader2, Info, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SystemSettings() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [duration, setDuration] = useState('24');
  const [categoriesText, setCategoriesText] = useState('Workshop, Room, Machine');
  const [isSaving, setIsSaving] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<any>(settingsDocRef);

  useEffect(() => {
    if (settings) {
      if (settings.maxBorrowDurationHours) {
        setDuration(settings.maxBorrowDurationHours.toString());
      }
      if (settings.categories && Array.isArray(settings.categories)) {
        setCategoriesText(settings.categories.join(', '));
      }
    }
  }, [settings]);

  const handleSave = () => {
    if (!firestore || !settingsDocRef) return;
    setIsSaving(true);

    const numericDuration = parseInt(duration);
    if (isNaN(numericDuration) || numericDuration <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Duration",
        description: "Please enter a valid number of hours.",
      });
      setIsSaving(false);
      return;
    }

    // Process categories: split by comma, trim, and remove empty strings
    const categoriesArray = categoriesText
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    setDocumentNonBlocking(settingsDocRef, {
      maxBorrowDurationHours: numericDuration,
      categories: categoriesArray,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Artificial delay for UX feel
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "System policies and categories have been updated.",
      });
    }, 600);
  };

  return (
    <div className="px-6 py-4 space-y-6 mb-20">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Settings size={22} className="text-accent" />
          System Settings
        </h2>
        <p className="text-xs text-muted-foreground">Global configuration for the KeyFlow Pro ecosystem.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Borrow Policies</CardTitle>
          </div>
          <CardDescription className="text-xs">Configure overdue thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-sm font-bold">Max Borrow Duration (Hours)</Label>
            <div className="flex items-center gap-3">
              <Input 
                id="duration" 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-50 border-slate-100 h-12 text-lg font-bold focus-visible:ring-accent"
                min="1"
              />
              <span className="text-sm font-medium text-muted-foreground">Hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Tag size={18} className="text-accent" />
            <CardTitle className="text-base font-bold">Category Management</CardTitle>
          </div>
          <CardDescription className="text-xs">Define available key categories.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="categories" className="text-sm font-bold">Key Categories</Label>
            <Textarea 
              id="categories" 
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              placeholder="e.g. Workshop, Room, Machine"
              className="bg-slate-50 border-slate-100 min-h-[100px] focus-visible:ring-accent"
            />
            <div className="p-3 bg-blue-50/50 rounded-2xl flex items-start gap-3 border border-blue-100">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Enter categories separated by commas. These will appear in the "Category" dropdown when adding new keys.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} />
                Update System Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="p-6 border border-dashed rounded-3xl text-center">
        <p className="text-xs text-muted-foreground italic">Hardware synchronization and API integration settings are currently managed by technical staff.</p>
      </div>
    </div>
  );
}
