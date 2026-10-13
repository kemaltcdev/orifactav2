# ORIFACTA design rationale

## Direction: the spectrum, the turn

The identity supplies a tapered, twisting ribbon, a confident lowercase wordmark and a five-stop colour field: orange, magenta, violet, blue, cyan. The site treats those as a system rather than decoration.

- **The turn.** A ribbon twists to show its other side; an idea turns into something real. Headlines turn up into place (a short rotateX from below), the hero sculpture turns between the two halves of the headline, and the approach curve is drawn as a real twisting ribbon with a shaded reverse side.
- **The spectrum as information.** Five services map to the five stops (Websites orange, Web applications magenta, Mobile violet, B2B blue, Automation cyan). The colour follows the service into its row, its tags, the concept in "In practice" and the navigation indicator. The four process steps sit on the same scale, warm to cool.

## Type

One family, Mona Sans, used for everything. Its width axis is part of the design: headlines are set slightly expanded (104–106%), the hero stretches from 78% to full width as it loads, and a service name widens when it is hovered or opened. Sizes come from the fluid tokens in `:root`; breakpoints change composition only. Floors: body 15px, labels 12px. No eyebrow labels: wayfinding comes from the header indicator, which slides under the section you are reading in that section's colour.

## Section by section

1. **Hero.** Three twisting bands in the brand colours, a sculptural relative of the mark. Each band is a closed solid with rounded rims, so it has body from every side; the frames are smoothed so the satin surfaces carry no creases. "Ideas made" sits above it and "real." beneath, so the ribbon passes behind the first line and in front of the second. Dragging turns it with momentum; it always settles facing forward. On scroll the two lines drift apart and the sculpture leans.
2. **Point of view.** The statement lights word by word as it is read (scroll-linked opacity, no timers). The second sentence settles in a lilac tint because it is the point being made.
3. **Expertise.** Sticky introduction; five rows, each marked with a small leaf of its spectrum colour. Opening a row widens the name, tints the row and preselects the service in the enquiry form.
4. **In practice.** The three interactive concepts are unchanged in function. The section is lit in the colour of the active concept (a registered `--c` property, so the light cross-fades), and each stage tilts up into place as it enters.
5. **Approach.** The paper surface opens from an inset card to full bleed as it arrives. On screens where the whole composition fits (≥1024 × 740) it is held in place while a generated ribbon draws through the four steps, lighting each one in turn. Elsewhere it is a static list.
6. **Studio.** Large statement, a 24-hour dial for Sarajevo local time (night violet, dawn orange, noon cyan, dusk magenta), the studio paragraph and three principles in columns.
7. **Questions.** Accordion; the toggle turns into a close mark.
8. **Invitation.** The supplied gradient becomes a live, slow WebGL field (rendered at half resolution, paused off-screen). The frame opens to full bleed as it enters. The round action fills from the centre and turns its arrow.
9. **Footer.** The traced wordmark rises into place; the pointer lights it with the spectrum, and it drifts its own light when nobody is pointing.

## Motion

- One page-load sequence: field, headline lines, sculpture, copy, rule, header.
- Headings reveal once; supporting copy fades in once. Lists do not animate row by row.
- Scroll-linked effects are CSS custom properties written by one requestAnimationFrame loop (`lib/motion.ts`). Lenis provides smooth wheel scrolling; touch scrolling stays native.
- `prefers-reduced-motion` and the persistent "Pause motion" control disable smooth scrolling, all keyframes and transitions, scroll parallax and the WebGL animation, and show every scroll-revealed element in its final state.

## Constraints and judgement

- Text stays neutral and legible; colour marks meaning.
- No scroll hijacking: the only held section is the approach, and only where it fits.
- JavaScript enhances server-rendered content. WebGL failures leave authored posters.
- Fonts, imagery and logo assets are served locally.
- The contact flow writes to a database and never claims to have sent an email.
