
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
import { Textarea } from '@/components/ui/textarea';
import { MessageSquareWarning, Loader2, Send } from 'lucide-react';
import { useFirestore, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function ReportProblemDialog() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !firestore || !user) return;

    setIsSubmitting(true);

    addDocumentNonBlocking(collection(firestore, 'complaints'), {
      userId: user.uid,
      userName: user.displayName || 'Anonymous User',
      userEmail: user.email || 'N/A',
      description: description,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    // UX delay
    setTimeout(() => {
      setIsSubmitting(false);
      setOpen(false);
      setDescription('');
      toast({
        title: "Complaint Received",
        description: "The system administrator has been notified.",
      });
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-12 flex items-center justify-center gap-2 font-semibold">
          <MessageSquareWarning size={18} className="text-accent" />
          Report a Problem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Report a Problem</DialogTitle>
            <DialogDescription>
              Encountering issues with a key or the hardware? Describe it below for the administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea
              placeholder="Explain the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-accent"
              required
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || !description}
              className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Submit Complaint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
