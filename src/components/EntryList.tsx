import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EntryCard } from "./EntryCard";
import type { Entry } from "@/lib/entries";
import { cn } from "@/lib/utils";

export function EntryList({ entries, filters }: { entries: Entry[]; filters?: { label: string; test: (e: Entry) => boolean }[] }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState<0 | 1 | 2>(0);
  const [cat, setCat] = useState("All");
  const [f, setF] = useState(0);
  const cats = useMemo(() => ["All", ...Array.from(new Set(entries.map((e) => e.category))).sort()], [entries]);
  const list = entries.filter(
    (e) =>
      (!term || e.term === term) &&
      (cat === "All" || e.category === cat) &&
      (!filters || (filters[f]?.test(e) ?? true)) &&
      (!q || (e.title + " " + e.summary).toLowerCase().includes(q.toLowerCase())),
  );
  const pill = (active: boolean) =>
    cn("border px-3 py-1 font-mono text-xs uppercase tracking-wider", active ? "bg-primary text-primary-foreground" : "hover:bg-accent");

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Input placeholder="Search entries…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {([0, 1, 2] as const).map((t) => (
            <button key={t} className={pill(term === t)} onClick={() => setTerm(t)}>
              {t ? `Term ${t}` : "Both terms"}
            </button>
          ))}
          {filters?.map((fl, i) => (
            <button key={fl.label} className={pill(f === i)} onClick={() => setF(i)}>
              {fl.label}
            </button>
          ))}
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="border bg-background px-2 py-1 font-mono text-xs uppercase">
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">{list.length} entries</p>
      {list.map((e) => (
        <EntryCard key={e.id} entry={e} />
      ))}
      {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No entries match.</p>}
    </div>
  );
}
