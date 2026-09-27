type NewsItem = { title: string; link: string; source: string; date: string };

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch("https://news.google.com/rss/search?q=Trump+administration+when:1d&hl=en-US&gl=US&ceid=US:en");
  if (!res.ok) throw new Error(`News feed ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30).map(([, b = ""]) => ({
    title: decode(b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
    link: decode(b.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? ""),
    source: decode(b.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "News"),
    date: new Date(b.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? Date.now()).toISOString().slice(0, 10),
  }));
}

async function streamText(apiKey: string, input: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") throw new Error("AI response failed");
      } catch (e) {
        if (e instanceof Error && e.message === "AI response failed") throw e;
      }
    }
  }
  return out;
}

const KINDS = ["event", "accomplishment", "setback", "claim"];
const RATINGS = ["true", "mostly_true", "mixed", "mostly_false", "false", "unproven"];

export async function runDailyUpdate() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing AI key");
    const news = await fetchNews();
    if (!news.length) throw new Error("No news items");

    const prompt = `You maintain a strictly neutral, source-cited record of Donald Trump's second term as U.S. President.
From the numbered news headlines below, select up to 8 of the most significant, distinct, factual developments directly involving Trump or his administration. Skip opinion pieces, duplicates, rumors and minor items.
For each, output an object with:
- "i": the headline number
- "kind": one of event | accomplishment | setback | claim. Use "accomplishment" only for completed actions (signed laws, finalized deals, confirmed appointments). Use "setback" for court losses, failed votes, reversals. Use "claim" only when the headline itself reports a fact-check or clearly documented false/accurate statement.
- "title": short neutral headline (max 90 chars)
- "summary": 1-2 neutral sentences, only facts stated or clearly implied by the headline. No adjectives of judgment.
- "category": one word or short phrase like Economy, Trade, Immigration, Judiciary, Foreign Policy, Health, Justice, Elections, Environment, Defense, Government, Media
- "rating": for claims only, one of true | mostly_true | mixed | mostly_false | false | unproven; otherwise null
Respond with ONLY a JSON array, no prose.

${news.map((n, i) => `${i}. [${n.date}] ${n.title}`).join("\n")}`;

    const text = await streamText(apiKey, prompt);
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const items = JSON.parse(json || "[]") as { i?: number; kind?: string; title?: string; summary?: string; category?: string; rating?: string | null }[];

    const rows = items
      .map((it) => {
        const n = news[Number(it.i)];
        if (!n || !KINDS.includes(String(it.kind))) return null;
        const kind = String(it.kind);
        const rating = kind === "claim" && RATINGS.includes(String(it.rating)) ? String(it.rating) : null;
        if (kind === "claim" && !rating) return null;
        return {
          kind: kind as "event",
          term: 2,
          occurred_on: n.date,
          title: String(it.title ?? n.title).slice(0, 140),
          summary: String(it.summary ?? "").slice(0, 600),
          category: String(it.category ?? "General").slice(0, 40),
          rating: rating as "false" | null,
          sources: [{ title: n.source, url: n.link }],
          ai_generated: true,
          source_url_key: n.link,
        };
      })
      .filter((r): r is NonNullable<typeof r> => !!r && !!r.summary);

    let added = 0;
    if (rows.length) {
      const { data, error } = await supabaseAdmin.from("entries").upsert(rows, { onConflict: "source_url_key", ignoreDuplicates: true }).select("id");
      if (error) throw new Error(error.message);
      added = data?.length ?? 0;
    }
    await supabaseAdmin.from("update_runs").insert({ added, status: "ok" });
    return { ok: true, added };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("daily update failed", message);
    await supabaseAdmin.from("update_runs").insert({ added: 0, status: "error", message: message.slice(0, 500) });
    return { ok: false, error: message };
  }
}
