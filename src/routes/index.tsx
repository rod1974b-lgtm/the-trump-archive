import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { entriesQuery, lastRunQuery } from "@/lib/entries";
import { EntryCard } from "@/components/EntryCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Trump Record — Both Terms, Source-Cited" },
      { name: "description", content: "A neutral, source-cited record of Donald Trump's two terms: events, accomplishments, setbacks and fact-checked claims, updated daily." },
      { property: "og:title", content: "The Trump Record — Both Terms, Source-Cited" },
      { property: "og:description", content: "Events, accomplishments, setbacks and fact-checks across both Trump terms, updated daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(entriesQuery()), context.queryClient.ensureQueryData(lastRunQuery)]),
  component: Home,
  errorComponent: ({ error }) => <p role="alert">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});

function Home() {
  const { data: entries } = useSuspenseQuery(entriesQuery());
  const { data: run } = useSuspenseQuery(lastRunQuery);
  const count = (k: string, t?: number) => entries.filter((e) => e.kind === k && (!t || e.term === t)).length;
  const stats = [
    { label: "Events", k: "event", to: "/timeline" },
    { label: "Accomplishments", k: "accomplishment", to: "/record" },
    { label: "Setbacks", k: "setback", to: "/record" },
    { label: "Fact-checked claims", k: "claim", to: "/fact-checks" },
  ] as const;

  return (
    <div>
      <section className="grid gap-6 border-b pb-8 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Term 1 · Jan 20, 2017–Jan 20, 2021 &nbsp;|&nbsp; Term 2 · Jan 20, 2025–present</p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Everything on the record — the good, the bad, and what was said.</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            The first term is an expandable historical baseline, not a finished list. Term 2 begins January 20, 2025; daily news entries are source-linked, and newly verified history can be added to either term.
          </p>
        </div>
        <div className="self-end font-mono text-xs text-muted-foreground">
          <p>{entries.length} total entries</p>
          <p>Last daily update: {run ? `${formatDistanceToNow(new Date(run.ran_at))} ago (+${run.added})` : "pending first run"}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 border-b md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="border-r p-4 last:border-r-0 hover:bg-accent">
            <p className="font-display text-4xl font-bold">{count(s.k)}</p>
            <p className="font-mono text-xs uppercase tracking-wider">{s.label}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">T1 {count(s.k, 1)} · T2 {count(s.k, 2)}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Latest entries</h2>
          <Link to="/timeline" className="font-mono text-xs uppercase underline">Full timeline →</Link>
        </div>
        {entries.slice(0, 8).map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </section>
    </div>
  );
}
