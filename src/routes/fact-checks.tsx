import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { entriesQuery, RATING_LABEL, type Rating } from "@/lib/entries";
import { EntryList } from "@/components/EntryList";

const q = entriesQuery(["claim"]);
const ratings: Rating[] = ["true", "mostly_true", "mixed", "mostly_false", "false", "unproven", "misleading", "half_truth"];

export const Route = createFileRoute("/fact-checks")({
  head: () => ({
    meta: [
      { title: "Fact-check Tracker — The Trump Record" },
      { name: "description", content: "A source-cited tracker of true, false, misleading, half-true, mixed and unproven claims." },
      { property: "og:title", content: "Fact-check Tracker — The Trump Record" },
      { property: "og:description", content: "A source-cited tracker of true, false, misleading, half-true, mixed and unproven claims." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: () => {
    const { data } = useSuspenseQuery(q);
    return (
      <div>
        <h1 className="text-3xl font-bold">Fact-check Tracker</h1>
        <div className="my-4 grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
          {ratings.map((r) => (
            <div key={r} className="bg-card p-3 text-center">
              <p className="font-display text-2xl font-bold">{data.filter((e) => e.rating === r).length}</p>
              <p className="font-mono text-[10px] uppercase">{RATING_LABEL[r]}</p>
            </div>
          ))}
        </div>
        <EntryList
          entries={data}
          filters={[{ label: "All ratings", test: () => true }, ...ratings.map((r) => ({ label: RATING_LABEL[r], test: (e: { rating: Rating | null }) => e.rating === r }))]}
        />
      </div>
    );
  },
  errorComponent: ({ error }) => <p role="alert">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});
