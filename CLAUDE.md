# ProgSU Wiki — working context

The site is the ProgSU (Georgia State University programming club) wiki. Everything here is built for GSU students breaking into the industry.

## North star

**Calm, user-first, inviting — never overwhelming.** A first-time visitor should feel pulled in and at ease, not faced with choices to evaluate. If a screen feels noisy, the screen is wrong, not the user.

A user-first site is recognizable by what isn't there. **Reduce, don't add.**

## How to approach work

- **UI before data.** Build the screen first; let the data shape emerge from what the UI actually needs. Backend conforms to UX, not the other way around. Stub data lives inline in the page or component that needs it — no premature `types/`, `data/`, or `lib/` folders.
- **Progressive disclosure over walls of options.** Show the 80% case first. Hide the rest behind a quiet expander. Eight checkboxes in a sidebar is a failure state.
- **Inform, don't block.** Trust the user. Schedule conflicts get a soft warning, not a prevention. Confirmation modals are reserved for genuinely destructive actions.
- **Persistence is polish, not foundation.** Make the interaction feel good first. localStorage/backend wiring comes after the UX is settled.
- **Don't build for hypothetical needs.** No "future-proof" abstractions, no half-finished scaffolding, no scenarios that can't happen.

## Voice and copy

- Lowercase headlines, italic accents (e.g. *"find your next semester."*).
- Plain sentences. No jargon. No marketing voice. No emoji.
- Reassuring, not cute. Warm, not chirpy.
- Empty states encourage, never scold (*"star courses while browsing — they'll show up here."* not *"no saved courses"*).

## Visual language

Existing tokens live in [src/styles/global.css](src/styles/global.css). Use them — don't introduce new colors, fonts, or spacing values.

- **Theme:** cosmic dark — nebula + star layers from [Layout.astro](src/layouts/Layout.astro). Don't fight the background.
- **Surfaces:** glass (`surface-glass` class). Soft borders, subtle backdrop blur.
- **Type:** italic heading font for titles, mono for codes/numbers/technical bits, sans for body.
- **Accents:** purple and cyan. Use sparingly — accent is for one or two things on a screen, not everything.
- **Whitespace:** generous. Spacing scale tokens (`--space-*`) only.
- **Motion:** soft fades, subtle glow on hover, never harsh snaps or bouncy transitions.
- **Color is never the only signal.** Pair every colored indicator with text, icon, or shape.

## Existing building blocks (reuse before creating)

- [PageHeader.astro](src/components/PageHeader.astro) — every top-level page
- [CategoryCard.astro](src/components/CategoryCard.astro) — reference for card visual language
- [Breadcrumb.astro](src/components/Breadcrumb.astro), [Callout.astro](src/components/Callout.astro), [Badge.astro](src/components/Badge.astro), [SearchBar.astro](src/components/SearchBar.astro), [TableOfContents.astro](src/components/TableOfContents.astro)
- [ConstellationGraph.astro](src/components/ConstellationGraph.astro) — the signature visual; reach for it when visualizing relationships (prereq chains, learning paths, related topics)
- [Layout.astro](src/layouts/Layout.astro) — supports `wide` and `accent` props
- [ContentLayout.astro](src/layouts/ContentLayout.astro) — for long-form pages

Check `src/components/` before building new components. Extend existing ones with variant props before forking.

## Quality-of-life patterns to keep

- `/` keyboard shortcut focuses search from anywhere
- `g <letter>` navigation shortcuts; `?` opens shortcut help
- Visible focus rings on every interactive element
- Loading skeletons matched to final layout (no spinners, no layout shift)
- Undo toasts for any removal action (5-second window)
- All interactive elements reachable by Tab in visual order

## Audience

Writing for GSU students — many first-gen, many self-taught, many anxious about breaking into tech. They are smart but new. Don't condescend; don't assume. Frame everything as *"here's how"* not *"you should already know."*

## Things to avoid

- Adding features, refactors, or abstractions beyond what was asked
- Designing data models before the screen exists
- Walls of filters, dense option grids, multi-step forms
- Modals or confirmations for low-stakes actions
- Cute copy, marketing voice, exclamation points
- New design tokens, fonts, or color values
- Comments that explain what well-named code already says
- Documentation files (`.md`) unless explicitly requested

## When in doubt

Pick the calmer option. Pick fewer options. Pick more whitespace. Pick the version that respects the user's attention.
