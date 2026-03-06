"use client";

import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { keyAssignmentAssistant, type KeyAssignmentAssistantOutput } from '@/ai/flows/key-assignment-assistant';
import { Key } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SmartAssignerProps {
  keys: Key[];
  userRole: string;
}

export function SmartAssigner({ keys, userRole }: SmartAssignerProps) {
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KeyAssignmentAssistantOutput | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!purpose) return;
    setIsLoading(true);
    setResult(null);
    
    try {
      const output = await keyAssignmentAssistant({
        requestPurpose: purpose,
        userRole: userRole,
        availableKeys: keys.map(k => ({
          keyId: k.id,
          name: k.name,
          type: k.type,
          location: k.location,
          status: k.status
        }))
      });
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description: "Could not connect to the assignment assistant. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-6 py-4 flex flex-col gap-4 mb-20">
      <Card className="border-none shadow-lg overflow-hidden rounded-3xl bg-white">
        <CardHeader className="bg-primary text-white p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent fill-accent" size={20} />
            <CardTitle className="text-lg">Smart Assigner</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">AI-powered key matching & conflict detection</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="space-y-3">
            <Label htmlFor="purpose" className="font-bold text-primary">What do you need a key for?</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input 
                id="purpose" 
                placeholder="e.g. Workshop maintenance, Room 202 access" 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="pl-10 h-12 bg-slate-50 border-slate-100 focus-visible:ring-accent rounded-xl"
              />
            </div>
            <p className="text-[10px] text-muted-foreground px-1 italic">
              AI analyzes location, categories, and current availability.
            </p>
          </div>

          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold h-12 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95"
            disabled={isLoading || !purpose}
            onClick={handleAnalyze}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2" /> Consulting AI...</>
            ) : (
              <>Get Suggestions</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-5 border-none shadow-sm bg-slate-100 rounded-3xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Analysis Summary</h4>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{result.overallAnalysis}"
            </p>
          </Card>

          {result.suggestions.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2 px-1">
                <CheckCircle className="text-emerald-500" size={16} /> Recommended Keys
              </h4>
              {result.suggestions.map((s, idx) => (
                <Card key={idx} className="p-4 border-none shadow-sm bg-white rounded-2xl border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{s.name}</span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 uppercase font-black">
                      {Math.round(s.confidence * 100)}% Match
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reason}</p>
                </Card>
              ))}
            </div>
          ) : (
             <div className="p-6 text-center bg-white rounded-3xl border border-dashed">
                <p className="text-xs text-muted-foreground">No matching keys found for this purpose.</p>
             </div>
          )}

          {result.conflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2 px-1">
                <AlertTriangle className="text-amber-500" size={16} /> Policy Conflicts
              </h4>
              {result.conflicts.map((c, idx) => (
                <Card key={idx} className={`p-4 border-none shadow-sm rounded-2xl ${c.severity === 'high' ? 'bg-rose-50 border-l-4 border-l-rose-500' : 'bg-amber-50 border-l-4 border-l-amber-500'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary text-xs uppercase tracking-tight">
                      {c.severity} Severity Alert
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.description}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
