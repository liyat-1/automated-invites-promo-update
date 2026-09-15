import { useState } from "react";
import { Gift, Pencil, Plus, Search, X } from "lucide-react";
import { MarketingShell } from "./MarketingShell";
import { PromotionAssignOverlay } from "./PromotionAssignOverlay";
import { Button } from "@/components/ui/button";
import { campaignPromotionId, mutate, uid, useMarketing } from "@/lib/marketing";

export function PromotionsPage() {
  const { campaigns, promotions } = useMarketing();
  const [managing, setManaging] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [code, setCode] = useState("");

  const q = query.trim().toLowerCase();
  const list = promotions.filter(
    (promotion) => !q || `${promotion.name} ${promotion.detail} ${promotion.code}`.toLowerCase().includes(q),
  );
  const active = promotions.find((promotion) => promotion.id === managing) ?? null;

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
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
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

        <div className="mt-4 space-y-2 pb-16">
          {list.map((promotion) => {
            const count = campaigns.filter((campaign) => campaignPromotionId(campaign) === promotion.id).length;
            return (
              <article
                key={promotion.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-colors hover:border-brand/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                  <Gift size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-card-foreground">{promotion.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {promotion.detail} · {promotion.code}
                  </p>
                </div>
                <span
                  className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${
                    count ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count === 0 ? "No campaigns" : `${count} campaign${count === 1 ? "" : "s"}`}
                </span>
                <Button
                  variant={count ? "outline" : "brand"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setManaging(promotion.id)}
                >
                  {count ? <Pencil size={13} /> : <Plus size={13} />}
                  {count ? "Edit" : "Assign"}
                </Button>
              </article>
            );
          })}
          {list.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted-foreground">
              No promotions match that search.
            </p>
          )}
        </div>
      </div>

      {active && <PromotionAssignOverlay promotion={active} onClose={() => setManaging(null)} />}
    </MarketingShell>
  );
}
