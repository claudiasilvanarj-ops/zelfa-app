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

## ZELFA architecture
- Music copyright policy and trusted external search URLs live in browser-safe src/lib/music.ts; include the policy in every chat mode, use explicit external links for protected songs, and never embed or download external service audio. Open catalog playback requires verified composition and recording licenses.
- Live family video uses WebRTC with user-scoped invitation and signal policies, server-enforced Brasília schedules and revocation polling; never store media, automatically start cameras, or infer health from auxiliary motion/sound events. STUN-only connectivity is not guaranteed across restrictive networks and requires a TURN service for reliable remote coverage.
- AI chat streams from the server route `src/routes/api/chat.ts` (Responses API via AI SDK); the client sends only the newest message and the server loads history from `chat_messages`, so history stays authoritative server-side.
- Chat tools (`criar_compromisso`, `adicionar_compras`) run server-side with a user-scoped client (`src/lib/supabase-user.server.ts`) so RLS applies.
- ZELFA persona and per-button modes live in `src/lib/zelfa-prompts.ts`; home cards in `src/lib/features.ts` — add new buttons there.
- Chef product rules live in the browser-safe `src/lib/chef.ts` and generate the food-mode prompt, so regression tests and AI instructions use the same rules.
- Shopping grouping, estimates and market-list formatting share `src/lib/shopping.ts`; market appointments persist a list snapshot in notes and notifications use the current pending list, so purchases stay visible and up to date.
- Household tasks reuse appointments; shared browser-safe scheduling rules enforce availability, conflicts and daily workload, while user-scoped server helpers reconcile overdue tasks on authenticated reminder checks and chat requests so all views share one plan.
- Voice input uses browser speech recognition; all narration uses authenticated server audio (Hugging Face TTS first when HUGGINGFACE_API_KEY is set, Kore as plan 2) through `src/lib/voice.ts` and `quel-voice.functions.ts`, never browser synthesis as a fallback, so provider/playback failures cannot change the persona. Ambient sounds and playlists use Web Audio (`src/lib/ambient.ts`).
- Admin access uses `user_roles` + `has_role()`; never derive roles from profiles.
- Visual games live on the authenticated /jogos page with shared pure rules in src/lib/games.ts; game state and family photos stay in component memory to avoid retaining private photos or changing chat history.
- Dietary restrictions live in browser-safe src/lib/diet.ts (forbidden-ingredient lists, validator, substitutions, home categories) and feed the chat prompt via `dietary_restrictions`, so tests and AI share one rigid filter.
- Voice limits live in browser-safe src/lib/voice-rules.ts (essential-only speech, greeting, speeds); speak() reads user voice settings from localStorage and stops any current speech first, so only one utterance plays at a time.
- Recipe categories use the fixed browser-safe bank in src/lib/recipes.ts; category button requests are answered server-side from that bank (no AI), filtered by profile + category restrictions and rotated against recent answers, so categories never mix.
- Saved recipes live in saved_recipes (owner-only RLS) and are never touched by clearing chat; chat answers are split into compact recipe cards by src/lib/recipe-cards.ts so chat, notebook and tests share one parser.
- Chat input is text or voice only: the chat server answers any image part with NO_PHOTO_REPLY (src/lib/chef.ts) without saving it or sending it to the AI. The only photo input is DishPhotoButton (recipe cards + timer "Fotografou seu prato?"): camera or gallery menu, HEIC→JPG via src/lib/photo-prep.ts, preview before saving, stored in the private dish-photos bucket + community_photos (owner/admin RLS); Instagram sharing needs the consent checkbox (status pendente) plus admin approval via admin_approve_photo.
- Instagram community constants (Direct link, caption, badge) live in browser-safe src/lib/community.ts; the share card appears on celebration replies and the badge is stored on the device because Instagram cannot confirm a photo was sent.
- Device changes go only through the switch_device RPC (monthly limit enforced in SQL, logged in device_switches for the admin ACESSOS list); claim_device never takes over an active account, so the limit cannot be bypassed from the browser.
- Paid access + one device per account live in account_access (written only via security-definer RPCs or the signed payment webhooks at /api/public/kiwify (active, matched by customer e-mail) and /api/public/pagbank (legacy)); AccessGate in the _authenticated layout and /api/chat both check access_status, so the UI gate is not the only lock.
- Admin area is the public /admin route (own login, ssr:false): access needs the authorized e-mail (ADMIN_EMAIL env override, default in src/lib/admin.ts) plus the admin role, checked server-side by verifyAdmin; blocked attempts, visits (track_visit) and app sessions (app_heartbeat) are written only via security-definer RPCs and read only by admins, so tracking never exposes data to visitors.
- Recipe cards show no stock photo: a camera placeholder invites the user's own dish photo (any recipe, including bank ones), which then becomes that card's image; a one-time intro (localStorage) explains the change.
- Recipe step timers live in browser-safe src/lib/timers.ts (time parsing, alert plan, device-stored store with one global tick); the CookingNow bar in AppShell shows active timers and delivers toasts/voice, while browser notifications cover a backgrounded open tab (no push server, so a fully closed app gets no alerts).
