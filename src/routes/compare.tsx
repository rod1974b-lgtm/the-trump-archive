import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { entriesQuery, type Entry } from "@/lib/entries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Term 1 vs Term 2 — The Trump Record" },
      { name: "description", content: "Side-by-side comparison of Trump's first and second terms by topic." },
      { property: "og:title", content: "Term 1 vs Term 2 — The Trump Record" },
      { property: "og:description", content: "Side-by-side comparison of both Trump terms by topic." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(entriesQuery()),
  component: Compare,
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});

const dot: Record<string, string> = { accomplishment: "bg-positive", setback: "bg-negative", claim: "bg-caution", event: "bg-muted-foreground" };

function Column({ items, term }: { items: Entry[]; term: number }) {
  const n = (k: string) => items.filter((e) => e.kind === k).length;
  return (
    <div className="border p-4">
      <h2 className="text-xl font-bold">Term {term}</h2>
      <p className="font-mono text-xs text-muted-foreground">
        {n("accomplishment")} wins · {n("setback")} setbacks · {n("claim")} claims · {n("event")} events
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((e) => (
          <li key={e.id} className="flex gap-2 text-sm">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[e.kind])} />
            <span>
              <span className="font-mono text-xs text-muted-foreground">{format(parseISO(e.occurred_on), "MMM yyyy")}</span> {e.title}
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Nothing recorded yet.</li>}
      </ul>
    </div>
  );
}

function Compare() {
  const { data } = useSuspenseQuery(entriesQuery());
  const cats = Array.from(new Set(data.map((e) => e.category))).sort();
  const [cat, setCat] = useState(cats.includes("Economy") ? "Economy" : cats[0]);
  const items = data.filter((e) => e.category === cat);
  return (
    <div>
      <h1 className="text-3xl font-bold">Term 1 vs Term 2</h1>
      <div className="my-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("border px-3 py-1 font-mono text-xs uppercase", c === cat ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Column term={1} items={items.filter((e) => e.term === 1)} />
        <Column term={2} items={items.filter((e) => e.term === 2)} />
      </div>
    </div>
  );
}
