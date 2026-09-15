import { Check, Layers, Mail, MessageSquare, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRATEGIES, STRATEGY_LABEL, type MarketingCampaign, type Strategy } from "@/lib/marketing";

const ICONS: Record<Strategy, React.ComponentType<{ size?: number; className?: string }>> = { text: MessageSquare, text_email: Mail, text_fallback: Shuffle };

export function StrategyBar({ managing, onToggleManage, onEnableAll, allEnabled, allSelected, onSelectAll }: { managing: boolean; onToggleManage: () => void; onEnableAll: (value: boolean) => void; allEnabled: boolean; allSelected: boolean; onSelectAll: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={managing ? "brand" : "outline"} size="sm" onClick={onToggleManage} aria-pressed={managing}><Layers size={15} />{managing ? "Cancel strategy changes" : "Manage channel strategy"}</Button>
      <Button variant="outline" size="sm" onClick={() => onEnableAll(!allEnabled)}>{allEnabled ? "Disable all" : "Enable all campaigns"}</Button>
      {managing && <Button variant="ghost" size="sm" onClick={onSelectAll}>{allSelected ? "Clear all" : "Select all"}</Button>}
    </div>
  );
}

export function StrategyPanel({ campaigns, selectedIds, staged, onChoose, onApply, onCancel }: { campaigns: MarketingCampaign[]; selectedIds: string[]; staged: Record<string, Strategy>; onChoose: (strategy: Strategy) => void; onApply: () => void; onCancel: () => void }) {
  const groups = STRATEGIES.map((strategy) => ({ ...strategy, names: campaigns.filter((campaign) => (staged[campaign.id] ?? campaign.strategy) === strategy.value).map((campaign) => campaign.name) }));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[65] flex justify-center px-4 pb-4 sm:justify-end sm:pr-6">
      <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-lg border border-brand/25 bg-card shadow-float">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div><p className="text-[13.5px] font-semibold text-card-foreground">Channel strategy</p><p className="mt-0.5 text-[11.5px] text-muted-foreground">{selectedIds.length} selected · changes apply together</p></div>
          <Button variant="ghost" size="icon" className="size-7" onClick={onCancel} aria-label="Cancel strategy changes"><X size={15} /></Button>
        </div>
        <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-3">
          {STRATEGIES.map((strategy) => { const Icon = ICONS[strategy.value]; const group = groups.find((item) => item.value === strategy.value); const names = group?.names ?? []; return <button key={strategy.value} onClick={() => onChoose(strategy.value)} disabled={!selectedIds.length} className="flex min-h-28 flex-col items-start rounded-md border border-border p-2.5 text-left transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-45"><Icon size={14} className="text-brand" /><span className="mt-2 text-[11.5px] font-semibold text-card-foreground">{strategy.label}</span><span className="mt-2 flex flex-wrap gap-1">{names.slice(0, 3).map((name) => <span key={name} className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground">{name}</span>)}{names.length > 3 && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-semibold text-brand">+{names.length - 3} more</span>}</span></button>; })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="brand" size="sm" onClick={onApply} disabled={!Object.keys(staged).length}><Check size={14} />Apply changes</Button>
        </div>
      </div>
    </div>
  );
}