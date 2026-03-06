
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
import { Pencil, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Key } from '@/lib/types';

interface EditKeyDialogProps {
  keyData: Key & { pegIndex?: number };
}

export function EditKeyDialog({ keyData }: EditKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(keyData.name);
  const [type, setType] = useState(keyData.type);
  const [location, setLocation] = useState(keyData.location);
  const [pegIndex, setPegIndex] = useState(keyData.pegIndex !== undefined && keyData.pegIndex !== null ? (keyData.pegIndex + 1).toString() : '');
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<any>(settingsDocRef);

  const categories = settings?.categories && Array.isArray(settings.categories) 
    ? settings.categories 
    : ['Workshop', 'Room', 'Machine'];

  const pegCount = settings?.pegCount || 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !firestore) return;

    const keyRef = doc(firestore, 'keys', keyData.id);
    const numericPegIndex = pegIndex ? parseInt(pegIndex) - 1 : null;
    
    updateDocumentNonBlocking(keyRef, {
      keyIdentifier: name,
      description: type,
      location: location,
      pegIndex: numericPegIndex,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: "Success",
      description: `${name} has been updated.`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full">
          <Pencil size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Edit Key Details</DialogTitle>
            <DialogDescription>
              Modify the properties and cabinet slot for this key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name" className="font-bold text-xs uppercase text-muted-foreground">Key Identifier</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-type" className="font-bold text-xs uppercase text-muted-foreground">Category</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-pegIndex" className="font-bold text-xs uppercase text-muted-foreground">Slot (1-{pegCount})</Label>
                <Input
                  id="edit-pegIndex"
                  type="number"
                  min="1"
                  max={pegCount}
                  value={pegIndex}
                  onChange={(e) => setPegIndex(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-location" className="font-bold text-xs uppercase text-muted-foreground">Storage Detail</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
