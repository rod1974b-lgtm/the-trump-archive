import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { entriesQuery } from "@/lib/entries";
import { useAuth } from "@/lib/auth";
import { EntryCard, useBookmarks } from "@/components/EntryCard";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Entries — The Trump Record" },
      { name: "description", content: "Your saved entries from the Trump Record." },
      { property: "og:title", content: "Saved Entries — The Trump Record" },
      { property: "og:description", content: "Your saved entries from the Trump Record." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { user, ready } = useAuth();
  const { data: entries = [] } = useQuery(entriesQuery());
  const { data: saved } = useBookmarks();
  if (!ready) return null;
  if (!user)
    return (
      <p>
        <Link to="/auth" className="underline">Sign in</Link> to save entries.
      </p>
    );
  const list = entries.filter((e) => saved?.has(e.id));
  return (
    <div>
      <h1 className="text-3xl font-bold">Saved</h1>
      {list.map((e) => (
        <EntryCard key={e.id} entry={e} />
      ))}
      {list.length === 0 && <p className="mt-4 text-muted-foreground">Nothing saved yet. Tap the bookmark on any entry.</p>}
    </div>
  );
}
