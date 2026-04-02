import { Transaction, Key, Assignee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HistoryProps {
  transactions: Transaction[];
  keys: Key[];
  assignees: Assignee[];
}

export function TransactionHistory({ transactions, keys, assignees }: HistoryProps) {
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(t => {
    const key = keys.find(k => k.id === t.keyId);
    const assignee = assignees.find(a => a.id === t.assigneeId);
    return (
      key?.name.toLowerCase().includes(search.toLowerCase()) ||
      assignee?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.keyId.toLowerCase().includes(search.toLowerCase())
    );
  }).sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());

  return (
    <div className="px-6 py-4 space-y-4 mb-20">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          className="pl-9 bg-white border-none shadow-sm" 
          placeholder="Search by key or user..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const key = keys.find(k => k.id === t.keyId);
          const assignee = assignees.find(a => a.id === t.assigneeId);
          const isActive = !t.returnDate;

          return (
            <Card key={t.id} className="p-4 border-none shadow-sm">
              <div className="flex gap-4">
                <div className={`p-2 rounded-full h-fit ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  {isActive ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-primary">{key?.name || 'Unknown Key'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">User: <span className="text-foreground font-medium">{assignee?.name || t.assigneeId}</span></p>
                  <div className="flex justify-between items-end pt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase">Checkout</span>
                      <span className="text-xs font-semibold">{format(new Date(t.checkoutDate), 'MMM d, HH:mm')}</span>
                    </div>
                    {t.returnDate && (
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[10px] text-muted-foreground uppercase">Returned</span>
                        <span className="text-xs font-semibold">{format(new Date(t.returnDate), 'MMM d, HH:mm')}</span>
                      </div>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold text-blue-600 animate-pulse">CURRENTLY HELD</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
