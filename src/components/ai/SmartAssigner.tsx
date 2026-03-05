import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { keyAssignmentAssistant, KeyAssignmentAssistantOutput } from '@/ai/flows/key-assignment-assistant';
import { Key, Assignee, Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SmartAssignerProps {
  keys: Key[];
  assignees: Assignee[];
  transactions: Transaction[];
}

export function SmartAssigner({ keys, assignees, transactions }: SmartAssignerProps) {
  const [purpose, setPurpose] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KeyAssignmentAssistantOutput | null>(null);

  const handleAnalyze = async () => {
    if (!purpose || !assigneeId) return;
    setIsLoading(true);
    try {
      const output = await keyAssignmentAssistant({
        desiredKeyPurpose: purpose,
        assigneeId: assigneeId,
        currentAvailability: keys.map(k => ({
          keyId: k.id,
          status: k.status as any,
          location: k.location,
          type: k.type,
          currentAssigneeId: k.currentAssigneeId
        })),
        historicalUsage: transactions.map(t => ({
          keyId: t.keyId,
          assigneeId: t.assigneeId,
          checkoutDate: t.checkoutDate,
          returnDate: t.returnDate,
          lateReturn: false // simplified for mock
        }))
      });
      setResult(output);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-6 py-4 flex flex-col gap-4 mb-20">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-primary text-white p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent fill-accent" size={20} />
            <CardTitle className="text-lg">Smart Assigner</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80">AI-powered key matching & conflict detection</CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">What is the key for?</Label>
            <Input 
              id="purpose" 
              placeholder="e.g. Server Room Access, Fleet Vehicle" 
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Who is it for?</Label>
            <Select onValueChange={setAssigneeId} value={assigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an individual" />
              </SelectTrigger>
              <SelectContent>
                {assignees.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.department})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold"
            disabled={isLoading || !purpose || !assigneeId}
            onClick={handleAnalyze}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2" /> Analyzing...</>
            ) : (
              'Get Suggestions'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} /> Recommended Keys
              </h4>
              {result.suggestions.map((s, idx) => (
                <Card key={idx} className="p-3 border-none shadow-sm bg-emerald-50/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{s.keyId}</span>
                    <Badge variant="outline" className="text-[10px] bg-white">MATCH</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </Card>
              ))}
            </div>
          )}

          {result.conflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={16} /> Potential Conflicts
              </h4>
              {result.conflicts.map((c, idx) => (
                <Card key={idx} className={`p-3 border-none shadow-sm ${c.severity === 'high' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{c.keyId || 'Policy'}</span>
                    <Badge variant={c.severity === 'high' ? 'destructive' : 'default'} className="text-[10px]">
                      {c.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-4 border-none shadow-sm bg-slate-100">
            <h4 className="text-sm font-bold mb-2">Analysis Summary</h4>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{result.overallAnalysis}"
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}