import { useMemo, useState } from "react";
import { Icon } from "@/components/base/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/base/badge";
import { useDataProvider, type WorkspaceNote } from "@/lib/data-provider";

/**
 * Tag management for a single note row. Anchored under a [Tag] button in the
 * row's hover actions. Current tags show as dismissible chips; the "Add tag…"
 * input filters existing tags and, on Enter, adds the first match or creates a
 * new tag with the typed name.
 */
export function TagPopover({ note }: { note: WorkspaceNote }) {
  const dp = useDataProvider();
  const { data: allTags } = dp.useTags();
  const addTag = dp.useAddTagToNote();
  const removeTag = dp.useRemoveTagFromNote();
  const createTag = dp.useCreateTag();

  const [query, setQuery] = useState("");

  const available = useMemo(() => {
    const applied = new Set(note.tags.map((t) => t.id));
    return allTags
      .filter((t) => !applied.has(t.id))
      .filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [allTags, note.tags, query]);

  const handleSubmit = () => {
    const name = query.trim();
    if (!name) return;
    if (available.length > 0) {
      addTag.mutate({ notepadId: note.id, tagId: available[0].id });
    } else {
      // Create the tag and apply it to the note in one step: useCreateTag
      // resolves with the new tag's id, which we hand straight to useAddTagToNote.
      createTag
        .mutate({ name })
        .then(({ id }) => {
          if (id) addTag.mutate({ notepadId: note.id, tagId: id });
        })
        .catch(() => {
          // Error surfaced via the mutation's own toast; nothing to apply.
        });
    }
    setQuery("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Manage tags"
        >
          <Icon name="sell" size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">Tags</p>

        {note.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <Badge key={t.id} color="gray" className="gap-1 pr-1">
                {t.name}
                <button
                  type="button"
                  aria-label={`Remove ${t.name}`}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={() =>
                    removeTag.mutate({ notepadId: note.id, tagId: t.id })
                  }
                >
                  <Icon name="close" size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add tag…"
          className="h-8"
        />

        {available.length > 0 && (
          <div className="mt-2 border-t border-border pt-2">
            {available.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() =>
                  addTag.mutate({ notepadId: note.id, tagId: t.id })
                }
              >
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                {t.name}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
