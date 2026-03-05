
"use client";

import { useState, useEffect } from 'react';
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
import { Plus, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function AddKeyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Room');
  const [location, setLocation] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch dynamic categories from settings
  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const { data: settings, isLoading: isSettingsLoading } = useDoc<any>(settingsDocRef);

  const categories = settings?.categories && Array.isArray(settings.categories) 
    ? settings.categories 
    : ['Workshop', 'Room', 'Machine'];

  // Ensure default type is valid when categories load
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(type)) {
      setType(categories[0]);
    }
  }, [categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !firestore) return;

    const keysCollection = collection(firestore, 'keys');
    
    addDocumentNonBlocking(keysCollection, {
      keyIdentifier: name,
      description: type,
      location: location,
      currentStatus: 'available',
      createdAt: new Date().toISOString()
    });

    toast({
      title: "Success",
      description: `${name} has been added to the inventory.`,
    });

    setOpen(false);
    setName('');
    setLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20">
          <Plus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Add New Key</DialogTitle>
            <DialogDescription>
              Enter the details for the physical key to register it in the inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-bold text-sm">Key Identifier</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. M7M / LAB-01"
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="font-bold text-sm">Category</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {categories.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location" className="font-bold text-sm">Storage Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hitech Cabinet / Drawer 2"
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10">
              Register Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
