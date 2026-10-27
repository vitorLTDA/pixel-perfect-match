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
- All server access goes through `src/lib/api` (typed modules over `request()`); UI never calls fetch directly, so mock and real API stay swappable.
- `VITE_API_MODE=real` + `VITE_API_BASE_URL` switches to the external Express `/api/v1` backend; default is the in-memory adapter in `src/mocks`, which must mirror backend authorization rules (covered by `src/mocks/adapter.test.ts`).
- Public gig payloads never carry street/complement; the exact address is fetched only via `agreementsApi.address` and never cached long-term.
- Auth state comes only from `/auth/me` via TanStack Query; no tokens in storage (backend uses HttpOnly cookies).
- Route guards (`RequireAuth`) are UX only; the API is authoritative.
