import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Kind = "event" | "accomplishment" | "setback" | "claim";
export type Rating = "true" | "mostly_true" | "mixed" | "mostly_false" | "false" | "unproven";
export type Entry = {
  id: string;
  kind: Kind;
  term: number;
  occurred_on: string;
  title: string;
  summary: string;
  category: string;
  rating: Rating | null;
  sources: { title: string; url: string }[];
  ai_generated: boolean;
};

export const entriesQuery = (kinds?: Kind[]) =>
  queryOptions({
    queryKey: ["entries", kinds?.join(",") ?? "all"],
    queryFn: async () => {
      let q = supabase.from("entries").select("*").order("occurred_on", { ascending: false }).limit(2000);
      if (kinds) q = q.in("kind", kinds);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Entry[];
    },
  });

export const lastRunQuery = queryOptions({
  queryKey: ["last-run"],
  queryFn: async () => {
    const { data } = await supabase.from("update_runs").select("*").order("ran_at", { ascending: false }).limit(1);
    return data?.[0] ?? null;
  },
});

export const RATING_LABEL: Record<Rating, string> = {
  true: "True",
  mostly_true: "Mostly true",
  mixed: "Mixed",
  mostly_false: "Mostly false",
  false: "False",
  unproven: "Unproven",
};

export const KIND_LABEL: Record<Kind, string> = {
  event: "Event",
  accomplishment: "Accomplishment",
  setback: "Setback",
  claim: "Claim",
};
