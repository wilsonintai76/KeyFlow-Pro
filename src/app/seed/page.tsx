'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/hono-client';
import { INITIAL_KEYS, INITIAL_ASSIGNEES, MOCK_USER } from '@/lib/mock-data';

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const handleSeed = async () => {
    setStatus('seeding');
    setMessage('Initializing database...');

    try {
      // 1. Seed User Profiles
      for (const assignee of INITIAL_ASSIGNEES) {
         await api.profile.$post({
           json: {
             fullName: assignee.fullName,
             email: assignee.email,
             role: assignee.id === MOCK_USER.uid ? 'admin' : 'staff',
           }
         });
      }

      // 2. Seed Keys
      for (const key of INITIAL_KEYS) {
        await api.keys.$post({
          json: {
            keyIdentifier: key.keyIdentifier,
            description: key.description,
            location: key.location,
            status: (key.currentStatus || 'available') as any,
            pegIndex: key.pegIndex
          }
        });
      }

      setStatus('success');
      setMessage('Database successfully initialized with 5 keys and 3 user profiles.');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(`Seeding failed: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-none overflow-hidden">
        <CardHeader className="bg-primary text-white p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Database className="text-primary" size={32} />
          </div>
          <CardTitle className="text-2xl font-black">System Init</CardTitle>
          <CardDescription className="text-primary-foreground/70 font-medium">
            Seed your live Firestore with initial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
            status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            status === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
            'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {status === 'seeding' && <Loader2 className="animate-spin" size={20} />}
            {status === 'success' && <CheckCircle2 size={20} />}
            {status === 'error' && <AlertCircle size={20} />}
            {status === 'idle' && <Database size={20} />}
            {message || 'Ready to initialize.'}
          </div>

          <Button 
            onClick={handleSeed}
            disabled={status === 'seeding' || status === 'success'}
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 bg-primary hover:bg-primary/90"
          >
            {status === 'seeding' ? 'SEEDING...' : 'INITIALIZE DATABASE'}
          </Button>

          {status === 'success' && (
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-black border-2"
              onClick={() => window.location.href = '/'}
            >
              GO TO DASHBOARD
            </Button>
          )}

          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
            Note: This will overwrite documents with the same IDs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
