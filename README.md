# ORIFACTA — Ideas made real

A bespoke digital studio website built around the supplied ORIFACTA identity. English copy, authored layouts, an original live ribbon sculpture and three explicitly labelled interactive product explorations.

## Stack

- React 19.2, strict TypeScript 5.9, Vinext / Vite 8, Cloudflare Workers.
- Original CSS composition and responsive layouts; no UI theme or component template used for the public experience.
- Native WebGL 2 renderers, lazily loaded: the hero sculpture is generated from parametric curves as three solid, twisting bands, and the closing invitation renders a live version of the supplied colour field. Neither is a video, GIF or sequence of still frames.
- One scroll engine (`lib/motion.ts`) drives Lenis smooth scrolling, section reveals, scroll-linked CSS custom properties, the navigation indicator and magnetic controls.
- Zod validates project enquiries in the client and on the server. Drizzle writes to the D1 `inquiries` table.
- Locally hosted Mona Sans variable font (weight and width axes); its OFL license is included.

## Development

Use Node 22.13 or newer. Install with `pnpm install`, then `pnpm dev` for local work. `pnpm build` builds the Worker and browser assets. The Sites environment uses its own documented installation and build helpers.

- `node node_modules/typescript/bin/tsc --noEmit` — strict type check.
- `node scripts/check.mjs` — validation, request handling and SQL persistence against an isolated in-memory SQLite database; server-rendered content and asset checks. No production enquiries are created.
- `pnpm db:generate` — generate schema migrations after changing `db/schema.ts`.

Apply the schema migration using the documented D1 lifecycle before local form testing. Hosted publication provisions D1 and applies the included migration automatically.

## Where to edit

- `app/components/Studio.tsx`: navigation, page sections, services, approach (including the generated ribbon path), studio, FAQ and global motion control.
- `lib/motion.ts`: smooth scrolling and every scroll-linked effect. Elements opt in with `data-scroll`, `data-magnetic`, `.reveal` and `.reveal-lines`.
- `lib/spectrum-field.ts`, `app/components/Field.tsx`: the live colour field behind the closing invitation.
- `app/components/Projects.tsx`: the interactive B2B catalogue, mobile habit app and architecture website concept.
- `app/components/Contact.tsx`: accessible native-dialog enquiry form and submission states.
- `app/api/inquiries/route.ts`: server validation and persistence. No public read endpoint exposes enquiry data.
- `app/globals.css`: design tokens and the fluid type scale, layouts, mockup styles, responsive rules, transitions and reduced-motion rules. Font sizes come from the `--t-*` tokens; breakpoints change composition only.
- `lib/ribbon-geometry.mjs`: the sculpture's original geometry. Each band is a closed solid (lens-shaped thickness, rounded rims, thinner tips); `THICKNESS` sets its body.
- `lib/ribbon-engine.ts`: the WebGL 2 renderer: satin lighting with a light clearcoat, 1.5–2× resolution, drag-to-turn with momentum and a return to face forward.
- `public/assets/brand`: supplied brand assets and faithful monochrome SVG outlines.
- `design/DESIGN-NOTES.md`: the composition and purpose of each section.

## Enquiries

The form saves project requests in D1 and returns a reference only after the insert succeeds. It validates input, checks the request origin, rejects oversized messages and honeypot submissions, and applies a short duplicate throttle. Visitors receive an honest failure message if persistence fails.

Enquiries can be inspected with the Sites database tools. **Email notifications are not configured.** There is no invented contact email, no automatic mailing list, and no public enquiries API. Before a public commercial launch, connect the studio's real notification destination and review the business's final contact/privacy wording.

## Motion & access

The sculpture stops when off-screen or in a background tab, caps its pixel ratio, reduces resolution under sustained frame pressure, and respects reduced motion and Save-Data. A visible pause control persists locally. A static poster is displayed before the renderer is ready or when WebGL is unavailable. Focus rings, keyboard-operated tabs, labelled controls, native dialog focus handling and responsive layouts are implemented.

## Content integrity

Supply, Morrow and Atelier N°12 are illustrative concepts, not real client engagements. Prices, names and products in the portal are demonstration data; placing a demo order causes no purchase. No testimonials, client logos, results or team metrics have been invented.

The architecture image at `public/assets/atelier-residence.webp` was created using the built-in ImageGen tool for the illustrative website. Its prompt and source description are recorded in `design/ASSETS.md`.

## Verification boundary

The production build, TypeScript, isolated API/database tests and rendered-HTML/asset checks were run. The sculpture was inspected from the front, three-quarter, side and back; the brand outlines were inspected as standalone renders. The rendered site has been reviewed in headless Chromium at 360, 390, 768, 1024 and 1440 pixels, including tabs, demo order, dialogs, menu, header behaviour and the process curve, with no console errors or horizontal overflow. Measured frame rates, Safari/Firefox and real-device layout, accessibility automation and end-to-end hosted form submission have **not** been certified. Do not present performance targets as measured results.
