import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { entriesQuery, RATING_LABEL, type Rating } from "@/lib/entries";
import { EntryList } from "@/components/EntryList";

const q = entriesQuery(["claim"]);
const ratings: Rating[] = ["true", "mostly_true", "mixed", "mostly_false", "false", "unproven"];

export const Route = createFileRoute("/fact-checks")({
  head: () => ({
    meta: [
      { title: "Fact-check Tracker — The Trump Record" },
      { name: "description", content: "Public claims rated against independent fact-checks and primary sources." },
      { property: "og:title", content: "Fact-check Tracker — The Trump Record" },
      { property: "og:description", content: "Public claims rated against independent fact-checks and primary sources." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: () => {
    const { data } = useSuspenseQuery(q);
    return (
      <div>
        <h1 className="text-3xl font-bold">Fact-check Tracker</h1>
        <div className="my-4 grid grid-cols-3 gap-px border bg-border sm:grid-cols-6">
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
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});
