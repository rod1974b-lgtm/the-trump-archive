import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, ExternalLink, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { KIND_LABEL, RATING_LABEL, type Entry } from "@/lib/entries";
import { cn } from "@/lib/utils";

const kindColor: Record<string, string> = {
  accomplishment: "text-positive border-positive",
  setback: "text-negative border-negative",
  claim: "text-caution border-caution",
  event: "text-muted-foreground border-border",
};

const ratingColor = (r: string) =>
  r === "true" || r === "mostly_true"
    ? "bg-positive text-primary-foreground"
    : r === "mixed" || r === "unproven"
      ? "bg-caution text-primary-foreground"
      : "bg-negative text-primary-foreground";

export function useBookmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("bookmarks").select("entry_id");
      return new Set((data ?? []).map((b) => b.entry_id));
    },
  });
}

export function EntryCard({ entry }: { entry: Entry }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: saved } = useBookmarks();
  const isSaved = saved?.has(entry.id) ?? false;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save entries");
      if (isSaved) await supabase.from("bookmarks").delete().eq("entry_id", entry.id);
      else await supabase.from("bookmarks").insert({ user_id: user.id, entry_id: entry.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="border-b py-5">
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <time className="text-muted-foreground">{format(parseISO(entry.occurred_on), "MMM d, yyyy")}</time>
        <span className={cn("border px-1.5 py-0.5", kindColor[entry.kind])}>{KIND_LABEL[entry.kind]}</span>
        <span className="text-muted-foreground">Term {entry.term}</span>
        <span className="text-muted-foreground">· {entry.category}</span>
        {entry.ai_generated && (
          <span className="flex items-center gap-1 text-muted-foreground" title="Drafted automatically from news sources">
            <Sparkles className="h-3 w-3" /> Auto
          </span>
        )}
        <button
          onClick={() => toggle.mutate()}
          className="ml-auto text-muted-foreground hover:text-foreground"
          aria-label={isSaved ? "Remove from saved" : "Save entry"}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>
      <h3 className="mt-2 text-xl font-semibold leading-snug">
        {entry.rating && (
          <span className={cn("mr-2 inline-block rounded-sm px-2 py-0.5 align-middle font-mono text-xs uppercase", ratingColor(entry.rating))}>
            {RATING_LABEL[entry.rating]}
          </span>
        )}
        {entry.title}
      </h3>
      <p className="mt-1.5 text-muted-foreground">{entry.summary}</p>
      {entry.sources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {entry.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground">
              {s.title} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
