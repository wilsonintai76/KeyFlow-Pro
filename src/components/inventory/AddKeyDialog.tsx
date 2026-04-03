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
import { Plus } from 'lucide-react';
import { api } from '@/lib/hono-client';
import { useToast } from '@/hooks/use-toast';

export function AddKeyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Room');
  const [location, setLocation] = useState('');
  const [pegIndex, setPegIndex] = useState('');
  const { toast } = useToast();

  const categories = ['Workshop', 'Room', 'Machine'];
  const pegCount = 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    const numericPegIndex = pegIndex ? parseInt(pegIndex) - 1 : null;
    
    if (numericPegIndex !== null && (numericPegIndex < 0 || numericPegIndex >= pegCount)) {
      toast({
        variant: "destructive",
        title: "Configuration Violation",
        description: `Selected slot (#${pegIndex}) exceeds the ${pegCount} slots configured in Admin Settings.`,
      });
      return;
    }

    try {
      await api.keys.$post({
        json: {
          keyIdentifier: name,
          description: type,
          location: location,
          pegIndex: numericPegIndex as any,
          status: 'available',
        }
      });

      toast({
        title: "Key Registered",
        description: `${name} has been added to the inventory.`,
      });

      setOpen(false);
      setName('');
      setLocation('');
      setPegIndex('');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not add key to inventory.",
      });
    }
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
              Register a physical key and assign it to a cabinet slot.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="font-bold text-xs uppercase text-muted-foreground">Key Identifier</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. LAB-01"
                className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="type" className="font-bold text-xs uppercase text-muted-foreground">Category</Label>
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
                <Label htmlFor="pegIndex" className="font-bold text-xs uppercase text-muted-foreground">Slot (1-{pegCount})</Label>
                <Input
                  id="pegIndex"
                  type="number"
                  min="1"
                  max={pegCount}
                  value={pegIndex}
                  onChange={(e) => setPegIndex(e.target.value)}
                  placeholder="Optional"
                  className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="location" className="font-bold text-xs uppercase text-muted-foreground">Storage Detail</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Drawer 2 / Bench A"
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
