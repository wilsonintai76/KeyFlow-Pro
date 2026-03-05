import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Lock, ShieldAlert } from "lucide-react";
import { DashboardStats } from "@/lib/types";

export function KeyStats({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Available', value: stats.available, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Checked Out', value: stats.checkedOut, icon: Lock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Overdue', value: stats.overdue, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Total Keys', value: stats.totalKeys, icon: Clock, color: 'text-primary', bg: 'bg-slate-100' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col items-start gap-2">
            <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}