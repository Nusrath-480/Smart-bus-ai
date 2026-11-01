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
- Roles live in `user_roles` and are checked with `has_role()`; UI `RoleGate` is cosmetic, RLS is the real enforcement.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); shared queries in `src/lib/data.ts`, auth helpers in `src/lib/auth.ts`.
- The first admin is created via the `claim_first_admin()` RPC, which only works while no admin exists; later admins are granted by admins.
- Prediction/telemetry tables carry an `is_demo` flag so simulated data is never mixed with live data.
- Driver writes require a current assignment and driver role; real telemetry also requires an owned active trip. Trip ownership is immutable for driver updates, and driver-role revocation ends assignments transactionally.
- Privileged helper functions use an empty search path and explicit execution grants; trigger functions are not callable by client roles. Internal settings remain administrator-only.
