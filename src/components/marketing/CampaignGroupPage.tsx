import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Gift, MessageSquareText, RotateCcw, Sparkles } from "lucide-react";
import { MarketingShell } from "./MarketingShell";
import { StrategyBar, StrategyPanel } from "./StrategyBar";
import { CampaignCard } from "./CampaignCard";
import { CampaignEditor } from "./CampaignEditor";
import { EditCampaignDialog } from "./EditCampaignDialog";
import { ConfirmRevertDialog, TestCampaignDialog } from "./MarketingDialogs";
import { PromotionManager } from "./PromotionManager";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  GROUP_META,
  defaultVariant,
  mutate,
  useMarketing,
  type AudienceKey,
  type CampaignGroup,
  type Strategy,
} from "@/lib/marketing";

export function CampaignGroupPage({ group }: { group: CampaignGroup }) {
  const state = useMarketing();
  const { campaigns, promotions, globalPromotions } = state;
  const meta = GROUP_META[group];
  const list = campaigns.filter((campaign) => campaign.group === group);
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [staged, setStaged] = useState<Record<string, Strategy>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editConfirm, setEditConfirm] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [managingPromotions, setManagingPromotions] = useState(false);
  const [revertTarget, setRevertTarget] = useState<string | "global" | null>(null);
  const allEnabled = list.length > 0 && list.every((campaign) => campaign.enabled);
  const activeCampaign = campaigns.find((campaign) => campaign.id === editConfirm) ?? null;

  const leaveManage = () => { setManaging(false); setSelected([]); setStaged({}); };
  const resetCampaign = (id: string) => mutate((draft) => {
    const campaign = draft.campaigns.find((item) => item.id === id);
    if (!campaign) return;
    campaign.variants.direct = defaultVariant(id, "direct");
    campaign.variants.ota = defaultVariant(id, "ota");
  });

  return (
    <MarketingShell title="Marketing messages">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <nav aria-label="Marketing message sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
          {[
            { label: "Automated invites", to: "/marketing/invites" as const, active: group === "invites" },
            { label: "Automated transactional", to: "/marketing/transactional" as const, active: group === "transactional" },
            { label: "Drip campaign", to: "/campaign" as const, active: false },
          ].map((item) => (
            <Link key={item.to} to={item.to} className={`shrink-0 border-b-2 px-3 py-2 text-[12.5px] font-medium ${item.active ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Automated guest communications</p>
            <h2 className="mt-1 text-[22px] font-semibold text-foreground">{meta.title}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{meta.desc}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Copy size={14} />Copy from...</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => list.forEach((campaign) => resetCampaign(campaign.id))}>Directful suggested setup</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => list.forEach((campaign) => resetCampaign(campaign.id))}>Sister property defaults</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand/20 bg-brand-soft px-4 py-3">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-card text-brand"><MessageSquareText size={16} /></span><p className="text-[12.5px] text-card-foreground">You have <strong>3000 complimentary texts</strong> available for a drip campaign.</p></div>
          <Button asChild variant="outline" size="sm"><Link to="/campaign">Create a drip campaign</Link></Button>
        </div>

        <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="text-[14px] font-semibold text-card-foreground">Promotions</h3><p className="mt-0.5 text-[12px] text-muted-foreground">Global defaults are available to campaigns unless a campaign overrides them.</p></div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setManagingPromotions(true)}><Gift size={14} />Manage promotions</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["ota", "direct"] as AudienceKey[]).map((audience) => {
              const promotion = promotions.find((item) => item.id === globalPromotions[audience]);
              return (
                <div key={audience} className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{audience === "direct" ? "Direct guests" : "OTA guests"}</p>
                    <p className="truncate text-[12.5px] font-semibold text-card-foreground">{promotion?.name ?? "No promotion selected"}</p>
                    {promotion && <p className="truncate text-[11px] text-muted-foreground">{promotion.detail}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setManagingPromotions(true)}>{promotion ? "Change" : "Add promo"}</Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div><h3 className="text-[15px] font-semibold text-foreground">{meta.title}</h3><p className="text-[11.5px] text-muted-foreground">{list.filter((campaign) => campaign.enabled).length} active · {list.length} total</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRevertTarget("global")}><RotateCcw size={14} />Revert to suggested content</Button>
              <StrategyBar managing={managing} allEnabled={allEnabled} allSelected={selected.length === list.length} onSelectAll={() => setSelected(selected.length === list.length ? [] : list.map((campaign) => campaign.id))} onToggleManage={() => managing ? leaveManage() : setManaging(true)} onEnableAll={(value) => mutate((draft) => draft.campaigns.forEach((campaign) => { if (campaign.group === group) campaign.enabled = value; }))} />
            </div>
          </div>

          {managing && <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground"><Sparkles size={14} className="text-brand" />Select campaigns below. Assignments are staged until you click Apply.</div>}
          <div className="mt-4 grid gap-4 pb-32 md:grid-cols-2 xl:grid-cols-3">
            {list.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={{ ...campaign, strategy: staged[campaign.id] ?? campaign.strategy }}
                selectable={managing}
                selected={selected.includes(campaign.id)}
                onSelect={(value) => setSelected((items) => value ? [...new Set([...items, campaign.id])] : items.filter((id) => id !== campaign.id))}
                onToggle={(value) => mutate((draft) => { const item = draft.campaigns.find((candidate) => candidate.id === campaign.id); if (item) item.enabled = value; })}
                onEdit={() => setEditConfirm(campaign.id)}
                onTest={() => setTesting(campaign.id)}
                onRevert={() => setRevertTarget(campaign.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {managing && (selected.length > 0 || Object.keys(staged).length > 0) && <StrategyPanel campaigns={list} selectedIds={selected} staged={staged} onChoose={(strategy) => { setStaged((current) => { const next = { ...current }; selected.forEach((id) => { next[id] = strategy; }); return next; }); setSelected([]); }} onApply={() => { mutate((draft) => draft.campaigns.forEach((campaign) => { if (staged[campaign.id]) campaign.strategy = staged[campaign.id]; })); leaveManage(); }} onCancel={leaveManage} />}
      <EditCampaignDialog campaign={activeCampaign} open={Boolean(editConfirm)} onClose={() => setEditConfirm(null)} onContinue={() => { const id = editConfirm; setEditConfirm(null); if (id) setEditing(id); }} />
      {editing && <CampaignEditor id={editing} onClose={() => setEditing(null)} />}
      <TestCampaignDialog campaign={campaigns.find((campaign) => campaign.id === testing) ?? null} open={Boolean(testing)} onClose={() => setTesting(null)} />
      <PromotionManager open={managingPromotions} group={group} onClose={() => setManagingPromotions(false)} />
      <ConfirmRevertDialog open={Boolean(revertTarget)} campaignName={revertTarget && revertTarget !== "global" ? campaigns.find((campaign) => campaign.id === revertTarget)?.name : undefined} onClose={() => setRevertTarget(null)} onConfirm={() => { if (revertTarget === "global") list.forEach((campaign) => resetCampaign(campaign.id)); else if (revertTarget) resetCampaign(revertTarget); setRevertTarget(null); }} />
    </MarketingShell>
  );
}