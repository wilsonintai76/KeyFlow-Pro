import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Lock, ShieldAlert } from "lucide-react";
import { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KeyStats({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Available', value: stats.available, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Taken', value: stats.checkedOut, icon: Lock, color: 'text-primary', bg: 'bg-slate-100', border: 'border-slate-200' },
    { label: 'Overdue', value: stats.overdue, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'Total', value: stats.totalKeys, icon: Clock, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-100' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 px-5 py-6">
      {cards.map((card) => (
        <Card key={card.label} className={cn("border-none shadow-sm rounded-2xl overflow-hidden ring-1", card.bg, card.border)}>
          <CardContent className="p-4 flex flex-col items-start gap-2.5">
            <div className={cn("p-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-100", card.color)}>
              <card.icon size={20} className="stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-black tracking-tight text-slate-900 leading-none">{card.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
