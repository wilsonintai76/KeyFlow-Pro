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
import { Key } from '@/lib/types';
import { Plus } from 'lucide-react';

interface AddKeyDialogProps {
  onAddKey: (key: Key) => void;
}

export function AddKeyDialog({ onAddKey }: AddKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Building');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    const newKey: Key = {
      id: `K${Math.floor(100 + Math.random() * 900)}`,
      name,
      type,
      location,
      status: 'available',
    };

    onAddKey(newKey);
    setOpen(false);
    // Reset form fields
    setName('');
    setType('Building');
    setLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20">
          <Plus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Key</DialogTitle>
            <DialogDescription>
              Enter the details for the new physical key to add it to the inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master Lab Key"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Category</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Building">Building</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="High Security">High Security</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Security Desk Drawer 2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">Create Key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
