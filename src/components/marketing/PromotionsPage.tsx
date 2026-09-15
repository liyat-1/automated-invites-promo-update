import { useState } from "react";
import { Check, ChevronDown, Gift, Minus, Plus, Search, X } from "lucide-react";
import { MarketingShell } from "./MarketingShell";
import { Button } from "@/components/ui/button";
import {
  AUDIENCE_LABEL,
  GROUP_META,
  campaignPromotionAudiences,
  campaignPromotionId,
  mutate,
  setCampaignPromotion,
  uid,
  useMarketing,
  type AudienceKey,
  type CampaignGroup,
  type MarketingCampaign,
} from "@/lib/marketing";

const GROUPS: CampaignGroup[] = ["invites", "transactional", "in_property"];
const AUDIENCES: AudienceKey[] = ["direct", "ota"];

function AudienceMark({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${
        on ? "border-brand/40 bg-brand-soft text-brand" : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {on ? <Check size={11} /> : <Minus size={11} />}
      {label}
    </span>
  );
}

function Breakdown({ campaigns }: { campaigns: MarketingCampaign[] }) {
  return (
    <div className="grid gap-3 border-t border-border bg-muted/30 p-4 md:grid-cols-3">
      {GROUPS.map((group) => {
        const list = campaigns.filter((campaign) => campaign.group === group);
        return (
          <section key={group} className="rounded-md border border-border bg-background p-3">
            <p className="text-[12px] font-semibold text-card-foreground">{GROUP_META[group].title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{list.length} campaigns</p>
            <div className="mt-2 space-y-2">
              {list.map((campaign) => {
                const audiences = campaignPromotionAudiences(campaign);
                return (
                  <div key={campaign.id} className="rounded-md border border-border px-2.5 py-2">
                    <p className="truncate text-[12px] font-medium text-card-foreground">{campaign.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {AUDIENCES.map((audience) => (
                        <AudienceMark
                          key={audience}
                          on={audiences[audience]}
                          label={audience === "direct" ? "Direct" : "OTA"}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && (
                <p className="rounded-md border border-dashed border-border px-2.5 py-3 text-center text-[11px] text-muted-foreground">
                  No campaigns
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function PromotionsPage() {
  const state = useMarketing();
  const { campaigns, promotions } = state;
  const [openId, setOpenId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [code, setCode] = useState("");

  const free = campaigns.filter((campaign) => campaignPromotionId(campaign) === null);
  const q = query.trim().toLowerCase();
  const list = promotions.filter(
    (promotion) => !q || `${promotion.name} ${promotion.detail} ${promotion.code}`.toLowerCase().includes(q),
  );

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    mutate((draft) =>
      draft.promotions.push({
        id: uid(),
        name: clean,
        detail: detail.trim() || "Custom hotel offer.",
        code: code.trim() || "OFFER",
      }),
    );
    setName("");
    setDetail("");
    setCode("");
    setCreating(false);
  };

  return (
    <MarketingShell title="Promotions">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Marketing assets</p>
            <h2 className="mt-1 text-[22px] font-semibold text-foreground">Promotions</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              Every offer used across automated invites, transactional and in-property messages. A campaign can carry
              one promotion at a time.
            </p>
          </div>
          <Button variant="brand" size="sm" onClick={() => setCreating((v) => !v)}>
            {creating ? <X size={14} /> : <Plus size={14} />}
            {creating ? "Cancel" : "New promotion"}
          </Button>
        </div>

        {creating && (
          <div className="mt-4 grid gap-2 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-[1.2fr_1.6fr_0.7fr_auto]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Promotion name"
              className="rounded-md border border-input bg-background px-3 py-2 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <input
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Short description"
              className="rounded-md border border-input bg-background px-3 py-2 text-[12.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="CODE"
              className="rounded-md border border-input bg-background px-3 py-2 text-[12.5px] uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <Button variant="brand" size="sm" onClick={create}>
              Save
            </Button>
          </div>
        )}

        <div className="relative mt-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search promotions"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div className="mt-4 space-y-3 pb-16">
          {list.map((promotion) => {
            const attached = campaigns.filter((campaign) => campaignPromotionId(campaign) === promotion.id);
            const open = openId === promotion.id;
            return (
              <article key={promotion.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                <button
                  onClick={() => setOpenId(open ? null : promotion.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                    <Gift size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-card-foreground">
                      {promotion.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {promotion.detail} · {promotion.code}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      attached.length ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {attached.length} campaign{attached.length === 1 ? "" : "s"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <>
                    <Breakdown campaigns={attached} />
                    <div className="border-t border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] text-muted-foreground">
                          {free.length} campaign{free.length === 1 ? "" : "s"} still without a promotion.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssigning(assigning === promotion.id ? null : promotion.id)}
                        >
                          <Plus size={13} />
                          Assign campaigns
                        </Button>
                      </div>
                      {assigning === promotion.id && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {free.map((campaign) => (
                            <button
                              key={campaign.id}
                              onClick={() => setCampaignPromotion(campaign.id, promotion.id)}
                              className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left hover:border-brand/45"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[12px] font-semibold text-card-foreground">
                                  {campaign.name}
                                </span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {GROUP_META[campaign.group].title}
                                </span>
                              </span>
                              <Plus size={14} className="shrink-0 text-brand" />
                            </button>
                          ))}
                          {free.length === 0 && (
                            <p className="text-[12px] text-muted-foreground">
                              Every campaign already carries a promotion.
                            </p>
                          )}
                        </div>
                      )}
                      {attached.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attached.map((campaign) => (
                            <span
                              key={campaign.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-card-foreground"
                            >
                              {campaign.name}
                              <button
                                onClick={() => setCampaignPromotion(campaign.id, null)}
                                aria-label={`Remove ${promotion.name} from ${campaign.name}`}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
          {list.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted-foreground">
              No promotions match that search.
            </p>
          )}
        </div>

        <p className="sr-only">{AUDIENCE_LABEL.direct}</p>
      </div>
    </MarketingShell>
  );
}
