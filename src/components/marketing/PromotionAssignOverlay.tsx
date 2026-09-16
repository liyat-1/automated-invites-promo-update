import { useState } from "react";
import { Check, Info, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GROUP_META,
  promotionAudiencesOn,
  setVariantPromotion,
  useMarketing,
  variantPromotionId,
  type AudienceKey,
  type CampaignGroup,
  type MarketingCampaign,
  type MarketingState,
  type Promotion,
} from "@/lib/marketing";

const GROUPS: CampaignGroup[] = ["invites", "transactional", "in_property"];
const AUDIENCES: { key: AudienceKey; label: string }[] = [
  { key: "direct", label: "Direct" },
  { key: "ota", label: "OTA" },
];

/** Name of the promotion blocking a guest segment on this campaign, if any. */
function blockedBy(state: MarketingState, campaign: MarketingCampaign, audience: AudienceKey, promotionId: string) {
  const id = variantPromotionId(campaign, audience);
  if (!id || id === promotionId) return null;
  return state.promotions.find((p) => p.id === id)?.name ?? "another promotion";
}

/** Small square checkbox used for the guest-segment toggles. */
function SegmentToggle({
  on,
  label,
  disabled,
  title,
  onChange,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  title?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
        disabled
          ? "cursor-not-allowed border-dashed border-border bg-muted/50 text-muted-foreground"
          : on
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
      {disabled && <Info size={11} className="text-muted-foreground" />}
    </button>
  );
}

/**
 * Assignment surface for one promotion. Each automated message section has an
 * Assign campaign button; guest segments already used by another promotion on
 * the same campaign stay locked and explain themselves.
 */
export function PromotionAssignOverlay({
  promotion,
  onClose,
}: {
  promotion: Promotion;
  onClose: () => void;
}) {
  const state = useMarketing();
  const { campaigns } = state;
  const [picking, setPicking] = useState<CampaignGroup | null>(null);
  const [query, setQuery] = useState("");

  const openPicker = (group: CampaignGroup) => {
    setPicking((current) => (current === group ? null : group));
    setQuery("");
  };

  const assignFree = (campaign: MarketingCampaign) => {
    AUDIENCES.forEach(({ key }) => {
      if (!variantPromotionId(campaign, key)) setVariantPromotion(campaign.id, key, promotion.id);
    });
    setPicking(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Assign campaigns</p>
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

      <p className="flex items-start gap-2 border-b border-border bg-brand-soft/50 px-4 py-2 text-[11.5px] text-muted-foreground sm:px-6">
        <Info size={13} className="mt-[1px] shrink-0 text-brand" />
        Each campaign can carry one promotion per guest segment. If Direct is already used by another offer, only OTA
        stays available here.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid items-start gap-4 md:grid-cols-3">
          {GROUPS.map((group) => {
            const list = campaigns.filter(
              (c) => c.group === group && (promotionAudiencesOn(c, promotion.id).direct || promotionAudiencesOn(c, promotion.id).ota),
            );
            const q = query.trim().toLowerCase();
            const available = campaigns.filter(
              (c) =>
                c.group === group &&
                !list.includes(c) &&
                AUDIENCES.some(({ key }) => !variantPromotionId(c, key)) &&
                (!q || c.name.toLowerCase().includes(q)),
            );

            return (
              <section key={group} className="flex flex-col rounded-lg border border-border bg-card p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[12.5px] font-semibold text-card-foreground">
                    {GROUP_META[group].title}
                  </p>
                  <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {list.length}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  {list.map((campaign) => (
                    <AssignedRow key={campaign.id} campaign={campaign} promotion={promotion} state={state} />
                  ))}
                  {list.length === 0 && (
                    <p className="rounded-md border border-dashed border-border px-2 py-5 text-center text-[11.5px] text-muted-foreground">
                      No campaigns yet
                    </p>
                  )}
                </div>

                <Button
                  variant={picking === group ? "brand" : "outline"}
                  size="sm"
                  className="mt-2.5 w-full"
                  onClick={() => openPicker(group)}
                >
                  {picking === group ? <X size={13} /> : <Plus size={13} />}
                  {picking === group ? "Close" : "Assign campaign"}
                </Button>

                {picking === group && (
                  <div className="mt-2.5 rounded-md border border-border bg-muted/40 p-2.5">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search campaigns"
                        className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-2.5 text-[12px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {available.map((campaign) => {
                        const free = AUDIENCES.filter(({ key }) => !variantPromotionId(campaign, key));
                        const taken = AUDIENCES.filter(({ key }) => variantPromotionId(campaign, key));
                        return (
                          <button
                            key={campaign.id}
                            type="button"
                            onClick={() => assignFree(campaign)}
                            className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-brand/45"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12px] font-medium text-card-foreground">
                                {campaign.name}
                              </span>
                              <span className="block truncate text-[10.5px] text-muted-foreground">
                                {free.map((a) => a.label).join(" + ")} available
                                {taken.length > 0 &&
                                  ` · ${taken.map((a) => a.label).join(", ")} on ${blockedBy(state, campaign, taken[0].key, promotion.id)}`}
                              </span>
                            </span>
                            <Plus size={13} className="shrink-0 text-brand" />
                          </button>
                        );
                      })}
                      {available.length === 0 && (
                        <p className="px-1 py-3 text-center text-[11.5px] text-muted-foreground">
                          No campaigns left to assign here.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AssignedRow({
  campaign,
  promotion,
  state,
}: {
  campaign: MarketingCampaign;
  promotion: Promotion;
  state: MarketingState;
}) {
  const on = promotionAudiencesOn(campaign, promotion.id);
  const removeAll = () =>
    AUDIENCES.forEach(({ key }) => {
      if (on[key]) setVariantPromotion(campaign.id, key, null);
    });

  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-card-foreground">{campaign.name}</p>
        <button
          type="button"
          onClick={removeAll}
          aria-label={`Remove ${campaign.name}`}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X size={13} />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {AUDIENCES.map(({ key, label }) => {
          const blocker = blockedBy(state, campaign, key, promotion.id);
          return (
            <SegmentToggle
              key={key}
              on={on[key]}
              label={label}
              disabled={Boolean(blocker)}
              title={
                blocker
                  ? `${label} guests already use “${blocker}” on this campaign. One promotion per guest segment.`
                  : undefined
              }
              onChange={(value) => setVariantPromotion(campaign.id, key, value ? promotion.id : null)}
            />
          );
        })}
      </div>
    </div>
  );
}
