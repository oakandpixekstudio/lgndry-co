# Standing rules for Claude sessions: LGNDRY.Co Studio Desk

Read `00_CLAUDE_BUILD_PROMPT.md`, then `docs/01_PRODUCT_REQUIREMENTS.md`, before changing anything.

## Non-negotiables
- Brand is **LGNDRY.Co** (uppercase LGNDRY, `.Co`). Never "LGNRY", never "Legendary" in UI or code.
- Keep the approved editorial design: floating charcoal sidebar, paper background, oversized bold sans with
  italic serif contrast, hairlines, squared controls. Do not substitute a generic dashboard template.
- Never mark a payment as paid without verification. Never allocate an edition number before verified payment.
  Never expose service-role keys or payment credentials to the browser.
- Money is integer ZAR cents. Timestamps are UTC in the database; display in Africa/Johannesburg.
- Do not invent business facts (VAT status, legal entity, provider, policies). Log them as open questions in
  `docs/12_DECISIONS_AND_ASSUMPTIONS.md` and leave the live action disabled.
- Demo data must always be visibly marked and only returned while `DEMO_MODE` is on.
- Never edit or delete anything in `references/`. Never commit secrets (`.env*`, `client_secret*.json`).

## Working rules
- `pnpm typecheck`, `pnpm lint` and `pnpm build` must pass before reporting a milestone.
- Do not run `next build` while a dev server is running in the same app: it corrupts `.next`.
- This Next.js version differs from older releases. Read `apps/studio/node_modules/next/dist/docs/` before using an API.
- `apps/storefront` is its own git repository and is not a workspace member yet.
- Report what actually works, with commands run and outcomes. Separate mock-only from integrated features.
