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
import { Pencil } from 'lucide-react';
import { useUser } from '@/lib/auth-provider';
import { api } from '@/lib/hono-client';
import { useToast } from '@/hooks/use-toast';
import { Key, KeyStatus } from '@/lib/types';

interface EditKeyDialogProps {
  keyData: Key & { pegIndex?: number };
}

export function EditKeyDialog({ keyData }: EditKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(keyData.name);
  const [type, setType] = useState(keyData.type);
  const [location, setLocation] = useState(keyData.location);
  const [pegIndex, setPegIndex] = useState(keyData.pegIndex !== undefined && keyData.pegIndex !== null ? (keyData.pegIndex + 1).toString() : '');
  const [status, setStatus] = useState<KeyStatus>(keyData.status);
  
  const { user } = useUser();
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
      const updateData: any = {
        name: name,
        keyIdentifier: name,
        description: type,
        location: location,
        pegIndex: numericPegIndex as any,
        status: status,
      };

      await api.keys[':id'].$patch({
        param: { id: keyData.id },
        json: updateData
      });

      if (status !== keyData.status && user) {
        await api.logs.$post({
          json: {
            type: 'INVENTORY',
            message: `Admin Override: Status of ${name} manually changed from ${keyData.status} to ${status}`,
            userId: user.id,
            userName: user.user_metadata?.full_name || 'Admin',
          }
        });
      }

      toast({
        title: "Update Success",
        description: `${name} has been updated.`,
      });

      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save key changes.",
      });
    }
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
              Modify key properties or perform a system override.
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
                <Label htmlFor="edit-status" className="font-bold text-xs uppercase text-muted-foreground">Status (Override)</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as KeyStatus)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
