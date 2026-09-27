<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All record items live in one `entries` table keyed by kind (event/accomplishment/setback/claim) and term — why: every page is a filtered view of the same data.
- Daily auto-update runs via pg_cron → `/api/public/hooks/daily-update` (cron-secret auth), which reads Google News RSS and has AI draft entries — why: real source links for every AI entry.
- `source_url_key` is unique so reruns never duplicate an article — why: idempotent daily job.
