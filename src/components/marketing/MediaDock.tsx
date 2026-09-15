import { useMemo, useRef, useState } from "react";
import { GripVertical, Library, Search, Upload } from "lucide-react";
import { MediaPicker, MediaThumb } from "./MediaPicker";
import { Button } from "@/components/ui/button";
import { MEDIA_DRAG_TYPE, mutate, uid, useMarketing, type MediaItem, type MediaType } from "@/lib/marketing";

function typeOf(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

/**
 * Media rail shown above the campaign grid. Assets can be dragged straight
 * onto a campaign card, and new files can be uploaded from the device.
 */
export function MediaDock() {
  const { media, folders } = useMarketing();
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      [...media]
        .filter((item) => !q || item.name.toLowerCase().includes(q))
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, 24),
    [media, q],
  );

  const upload = (files: FileList | File[] | null) => {
    const arr = Array.from(files ?? []);
    if (!arr.length) return;
    mutate((draft) =>
      arr.forEach((file) =>
        draft.media.unshift({
          id: uid(),
          name: file.name,
          type: typeOf(file),
          folder: folders[0] ?? "Uploads",
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          url: file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : undefined,
          addedAt: Date.now(),
        }),
      ),
    );
  };

  const startDrag = (event: React.DragEvent, item: MediaItem) => {
    event.dataTransfer.setData(MEDIA_DRAG_TYPE, item.id);
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <section
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        if (!event.dataTransfer.files?.length) return;
        event.preventDefault();
        setDragOver(false);
        upload(event.dataTransfer.files);
      }}
      className={`overflow-hidden rounded-lg border bg-card p-4 shadow-card transition-colors sm:p-5 ${dragOver ? "border-brand bg-brand-soft" : "border-border"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-card-foreground">Media</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Drag any file onto a campaign below to attach it, or drop files here to upload.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setLibrary(true)}>
            <Library size={14} />
            Browse library
          </Button>
          <Button variant="brand" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} />
            Upload media
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.csv,.xls,.xlsx"
        className="hidden"
        onChange={(event) => {
          upload(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="relative mt-3 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search media"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {list.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(event) => startDrag(event, item)}
            title={`Drag ${item.name} onto a campaign`}
            className="w-32 shrink-0 cursor-grab overflow-hidden rounded-lg border border-border bg-background text-left transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-card active:cursor-grabbing"
          >
            <div className="aspect-[4/3] bg-muted">
              <MediaThumb item={item} />
            </div>
            <p className="flex items-center gap-1 px-1.5 py-1 text-[10.5px] text-muted-foreground">
              <GripVertical size={11} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </p>
          </div>
        ))}
        {list.length === 0 && <p className="py-4 text-[12.5px] text-muted-foreground">No media matches that search.</p>}
      </div>

      <MediaPicker open={library} multi selectedIds={[]} onClose={() => setLibrary(false)} onSelect={() => {}} />
    </section>
  );
}
