import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { entriesQuery } from "@/lib/entries";
import { EntryList } from "@/components/EntryList";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — The Trump Record" },
      { name: "description", content: "Day-by-day timeline of both Trump terms with sources." },
      { property: "og:title", content: "Timeline — The Trump Record" },
      { property: "og:description", content: "Day-by-day timeline of both Trump terms with sources." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(entriesQuery()),
  component: () => {
    const { data } = useSuspenseQuery(entriesQuery());
    return (
      <div>
        <h1 className="mb-4 text-3xl font-bold">Timeline</h1>
        <EntryList entries={data} />
      </div>
    );
  },
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});
