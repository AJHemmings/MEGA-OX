# Cash Shop — Future Scope

**Status:** Parked. Implement after Tasks 18–22 are complete and the app is shipped.

## What It Is

A cosmetics shop accessible from the main menu where players can spend in-game currency
on board themes, cell marker styles, and colour palettes. Real-money top-ups via Stripe
(primary) and possibly PayPal come later.

## Architecture Decision

**Option chosen: Backend API (private repo) + shop UI in main MEGA-OX repo.**

- The private repo is a small API server (Node/Express or Supabase Edge Functions).
  It owns all payment logic, Stripe/PayPal keys, and makes the writes to `currency_balance`
  and `player_inventory`. Nothing sensitive lives in the public repo.
- The shop page is a normal React route in the main app (`/shop`). It reads
  `cosmetic_items` and `player_inventory` from Supabase directly, and calls the private
  API only when a purchase is made.
- Separation of concerns: the main app can display what a player owns and what is available
  without touching the private API at all. The private API is only invoked at the moment
  of purchase.

## DB Tables Already in Place

- `cosmetic_items` — catalogue of purchasable items (name, type, price, preview)
- `player_inventory` — which items each player owns
- `currency_balance` — each player's current coin balance
- `transactions` — audit log of all purchases

## Build Order (when ready)

1. Seed `cosmetic_items` with initial catalogue (board themes, marker styles)
2. Build `/shop` page in main repo — reads catalogue, shows owned vs not owned
3. Wire in-game currency earning (post-game reward via DB trigger or edge function)
4. Build private repo API — currency top-up endpoint, purchase endpoint, Stripe webhook
5. Add real-money purchase flow in `/shop` (Stripe Checkout or PayPal)

## Key UX Requirement

Players must clearly see which items they already own vs which are available to buy.
Owned items show an "Equipped" or "Owned" badge — no buy button.

## Notes

- Stripe is the primary payment provider. PayPal is a possible addition.
- The private repo will be a separate GitHub repo, deployed independently to Vercel
  or Railway.
- Do not add shop UI stubs or routes to the main app until the private API exists —
  no half-built pages in the portfolio build.
