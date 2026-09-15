import { useState } from "react";
import { Check, GripVertical, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_DRAG_TYPE,
  GROUP_META,
  campaignPromotionAudiences,
  campaignPromotionId,
  setCampaignPromotion,
  useMarketing,
  type AudienceKey,
  type CampaignGroup,
  type MarketingCampaign,
  type Promotion,
} from "@/lib/marketing";

const GROUPS: CampaignGroup[] = ["invites", "transactional", "in_property"];
const AUDIENCES: { key: AudienceKey; label: string }[] = [
  { key: "direct", label: "Direct" },
  { key: "ota", label: "OTA" },
];

/** Small square checkbox used for the guest-segment toggles. */
function SegmentToggle({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
        on
          ? "border-brand/45 bg-brand-soft text-brand"
          : "border-border bg-background text-muted-foreground hover:border-brand/30"
      }`}
    >
      <span
        className={`grid size-3.5 place-items-center rounded-[3px] border ${
          on ? "border-brand bg-brand text-brand-foreground" : "border-muted-foreground/45"
        }`}
      >
        {on && <Check size={9} strokeWidth={3.5} />}
      </span>
      {label}
    </button>
  );
}

/**
 * Full-screen assignment surface for one promotion. Campaigns are dragged from
 * the right-hand list into one of the three automated message sections, then
 * checked on or off per guest segment.
 */
export function PromotionAssignOverlay({
  promotion,
  onClose,
}: {
  promotion: Promotion;
  onClose: () => void;
}) {
  const { campaigns } = useMarketing();
  const [query, setQuery] = useState("");
  const [overGroup, setOverGroup] = useState<CampaignGroup | null>(null);

  const assigned = campaigns.filter((c) => campaignPromotionId(c) === promotion.id);
  const q = query.trim().toLowerCase();
  const available = campaigns.filter(
    (c) => campaignPromotionId(c) === null && (!q || c.name.toLowerCase().includes(q)),
  );

  const drop = (event: React.DragEvent, group: CampaignGroup) => {
    const id = event.dataTransfer.getData(CAMPAIGN_DRAG_TYPE);
    setOverGroup(null);
    if (!id) return;
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign || campaign.group !== group) return;
    event.preventDefault();
    setCampaignPromotion(id, promotion.id);
  };

  const dragOver = (event: React.DragEvent, group: CampaignGroup) => {
    if (!event.dataTransfer.types.includes(CAMPAIGN_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverGroup(group);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            {assigned.length ? "Edit assignment" : "Assign campaigns"}
          </p>
          <h2 className="truncate text-[17px] font-semibold text-card-foreground">{promotion.name}</h2>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {promotion.detail} · {promotion.code}
          </p>
        </div>
        <Button variant="brand" size="sm" onClick={onClose}>
          Done
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="grid min-w-0 items-start gap-4 md:grid-cols-3">
          {GROUPS.map((group) => {
            const list = assigned.filter((c) => c.group === group);
            const active = overGroup === group;
            return (
              <section
                key={group}
                onDragOver={(event) => dragOver(event, group)}
                onDragLeave={() => setOverGroup(null)}
                onDrop={(event) => drop(event, group)}
                className={`flex min-h-[220px] flex-col rounded-lg border bg-card p-3 shadow-card transition-colors ${
                  active ? "border-brand bg-brand-soft/40 ring-2 ring-brand/25" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[12.5px] font-semibold text-card-foreground">
                    {GROUP_META[group].title}
                  </p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="mt-2.5 flex-1 space-y-2">
                  {list.map((campaign) => (
                    <AssignedRow key={campaign.id} campaign={campaign} promotionId={promotion.id} />
                  ))}
                  {list.length === 0 && (
                    <p className="grid min-h-[104px] place-items-center rounded-md border border-dashed border-border px-2 text-center text-[11.5px] text-muted-foreground">
                      Drag a campaign here
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-3 shadow-card">
          <p className="text-[12.5px] font-semibold text-card-foreground">Campaigns available</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            A campaign can carry one promotion at a time.
          </p>
          <div className="relative mt-2.5">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns"
              className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-2.5 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="mt-2.5 space-y-1.5 overflow-y-auto">
            {available.map((campaign) => (
              <div
                key={campaign.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(CAMPAIGN_DRAG_TYPE, campaign.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                className="flex cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 transition-colors hover:border-brand/45 active:cursor-grabbing"
              >
                <GripVertical size={13} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-card-foreground">
                    {campaign.name}
                  </span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">
                    {GROUP_META[campaign.group].title}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCampaignPromotion(campaign.id, promotion.id)}
                  className="shrink-0 rounded-md border border-border px-2 py-1 text-[10.5px] font-semibold text-brand hover:border-brand/45"
                >
                  Add
                </button>
              </div>
            ))}
            {available.length === 0 && (
              <p className="rounded-md border border-dashed border-border px-2.5 py-6 text-center text-[11.5px] text-muted-foreground">
                No campaigns available.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AssignedRow({ campaign, promotionId }: { campaign: MarketingCampaign; promotionId: string }) {
  const audiences = campaignPromotionAudiences(campaign);
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-card-foreground">{campaign.name}</p>
        <button
          type="button"
          onClick={() => setCampaignPromotion(campaign.id, null)}
          aria-label={`Remove ${campaign.name}`}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X size={13} />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {AUDIENCES.map(({ key, label }) => (
          <SegmentToggle
            key={key}
            on={audiences[key]}
            label={label}
            onChange={(value) => {
              const next = { ...audiences, [key]: value };
              if (!next.direct && !next.ota) setCampaignPromotion(campaign.id, null);
              else setCampaignPromotion(campaign.id, promotionId, next);
            }}
          />
        ))}
      </div>
    </div>
  );
}
