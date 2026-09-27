import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { entriesQuery } from "@/lib/entries";
import { EntryList } from "@/components/EntryList";

const q = entriesQuery(["accomplishment", "setback"]);

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Accomplishments & Setbacks — The Trump Record" },
      { name: "description", content: "Laws, policies and outcomes from both Trump terms — successes and failures, with sources." },
      { property: "og:title", content: "Accomplishments & Setbacks — The Trump Record" },
      { property: "og:description", content: "Successes and failures from both Trump terms, source-cited." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: () => {
    const { data } = useSuspenseQuery(q);
    return (
      <div>
        <h1 className="mb-4 text-3xl font-bold">Accomplishments & Setbacks</h1>
        <EntryList
          entries={data}
          filters={[
            { label: "Both", test: () => true },
            { label: "Accomplishments", test: (e) => e.kind === "accomplishment" },
            { label: "Setbacks", test: (e) => e.kind === "setback" },
          ]}
        />
      </div>
    );
  },
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Not found.</p>,
});
