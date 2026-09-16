import { useState } from "react";
import { CalendarClock, Gift, Info, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CODE_TYPE_LABEL,
  GROUP_META,
  PROMO_DRAG_TYPE,
  promotionValidity,
  setVariantPromotion,
  useMarketing,
  variantPromotionId,
  type AudienceKey,
  type CampaignGroup,
  type MarketingCampaign,
  type Promotion,
} from "@/lib/marketing";

const AUDIENCES: { key: AudienceKey; label: string }[] = [
  { key: "direct", label: "Direct" },
  { key: "ota", label: "OTA" },
];

/**
 * Drag-and-drop promo manager for one group of campaigns. A promotion can be
 * dropped on the whole campaign (both guest segments) or on a single segment.
 */
export function PromoDropOverlay({ group, onClose }: { group: CampaignGroup; onClose: () => void }) {
  const { campaigns, promotions } = useMarketing();
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const list = campaigns.filter((c) => c.group === group);
  const q = query.trim().toLowerCase();
  const promoList = promotions.filter((p) => !q || `${p.name} ${p.detail} ${p.code}`.toLowerCase().includes(q));
  const byId = (id: string | null) => promotions.find((p) => p.id === id) ?? null;

  const drop = (event: React.DragEvent, campaign: MarketingCampaign, audiences: AudienceKey[]) => {
    const id = event.dataTransfer.getData(PROMO_DRAG_TYPE) || dragging;
    if (!id) return;
    event.preventDefault();
    audiences.forEach((key) => setVariantPromotion(campaign.id, key, id));
    setOver(null);
    setDragging(null);
  };

  const allow = (event: React.DragEvent, key: string) => {
    if (!event.dataTransfer.types.includes(PROMO_DRAG_TYPE) && !dragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setOver(key);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Manage promo</p>
          <h2 className="truncate text-[17px] font-semibold text-card-foreground">{GROUP_META[group].title}</h2>
          <p className="truncate text-[11.5px] text-muted-foreground">
            Drag a promotion onto a campaign, or onto a single guest segment.
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
        A campaign carries one promotion per guest segment. Dropping on the campaign header applies the offer to both
        Direct and OTA; dropping on a segment replaces only that one.
      </p>

      <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-border bg-card p-4 md:border-b-0 md:border-r">
          <h3 className="text-[13px] font-semibold text-card-foreground">Promotions</h3>
          <div className="relative mt-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search promotions"
              className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-2.5 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {promoList.map((promotion) => (
              <PromoChip key={promotion.id} promotion={promotion} onDrag={setDragging} />
            ))}
            {promoList.length === 0 && (
              <p className="px-1 py-4 text-center text-[11.5px] text-muted-foreground">No promotions match.</p>
            )}
          </div>
        </aside>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {list.map((campaign) => {
              const wholeKey = `${campaign.id}:all`;
              return (
                <section key={campaign.id} className="rounded-md border border-border bg-card shadow-card">
                  <div
                    onDragOver={(event) => allow(event, wholeKey)}
                    onDragLeave={() => setOver((c) => (c === wholeKey ? null : c))}
                    onDrop={(event) => drop(event, campaign, ["direct", "ota"])}
                    className={`rounded-t-md border-b px-3 py-2.5 transition-colors ${
                      over === wholeKey ? "border-brand bg-brand-soft" : "border-border"
                    }`}
                  >
                    <p className="truncate text-[12.5px] font-semibold text-card-foreground">{campaign.name}</p>
                    <p className="text-[10.5px] text-muted-foreground">Drop here to apply to the whole campaign</p>
                  </div>
                  <div className="space-y-2 p-3">
                    {AUDIENCES.map(({ key, label }) => {
                      const dropKey = `${campaign.id}:${key}`;
                      const promotion = byId(variantPromotionId(campaign, key));
                      return (
                        <div
                          key={key}
                          onDragOver={(event) => allow(event, dropKey)}
                          onDragLeave={() => setOver((c) => (c === dropKey ? null : c))}
                          onDrop={(event) => drop(event, campaign, [key])}
                          className={`rounded-md border border-dashed px-2.5 py-2 transition-colors ${
                            over === dropKey ? "border-brand bg-brand-soft" : "border-border bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {label}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11.5px] text-card-foreground">
                              {promotion ? promotion.name : "Drop a promotion here"}
                            </span>
                            {promotion && (
                              <button
                                type="button"
                                aria-label={`Remove promotion from ${label}`}
                                onClick={() => setVariantPromotion(campaign.id, key, null)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          {promotion && (
                            <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                              {promotion.code} · {promotionValidity(promotion)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoChip({ promotion, onDrag }: { promotion: Promotion; onDrag: (id: string | null) => void }) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(PROMO_DRAG_TYPE, promotion.id);
        event.dataTransfer.setData("text/plain", promotion.id);
        event.dataTransfer.effectAllowed = "copy";
        onDrag(promotion.id);
      }}
      onDragEnd={() => onDrag(null)}
      className="cursor-grab rounded-md border border-border bg-background px-2.5 py-2 transition-colors hover:border-brand/45 active:cursor-grabbing"
    >
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-card-foreground">
        <Gift size={12} className="shrink-0 text-brand" />
        <span className="truncate">{promotion.name}</span>
      </p>
      <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
        {CODE_TYPE_LABEL[promotion.codeType ?? "promo"]} {promotion.code}
        {promotion.discountPercent ? ` · ${promotion.discountPercent}% off` : ""}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted-foreground">
        <CalendarClock size={10} className="shrink-0" />
        <span className="truncate">{promotionValidity(promotion)}</span>
      </p>
    </div>
  );
}
