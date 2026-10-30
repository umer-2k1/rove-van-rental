# 05 · Design system

## Intent

Monochrome, quiet, and legible. The product is a booking form, so the interface
should feel like a well-set document: strong type, hairline rules, generous
space, one photograph per idea. No gradients, no glass, no decorative motion.

The palette is warm paper (`#f5f4f0`) and near-black ink (`#171614`) — a true
`#ffffff`/`#000000` pair reads harsh on a page this empty.

## Tokens

Defined once in `src/app/globals.css` as CSS variables and exposed to Tailwind
through `@theme inline`.

| Token | Value | Use |
|---|---|---|
| `--background` | `oklch(0.968 0.004 95)` ≈ `#f5f4f0` | Page canvas |
| `--foreground` | `oklch(0.19 0.004 90)` ≈ `#171614` | Text, primary button |
| `--card` | `oklch(0.988 0.003 95)` ≈ `#fbfaf8` | Panels, booking card |
| `--muted` | `oklch(0.945 0.004 95)` | Secondary surfaces |
| `--muted-foreground` | `oklch(0.495 0.006 90)` | Labels, secondary copy |
| `--border` | `oklch(0.893 0.005 95)` ≈ `#e0ddd5` | Hairlines, card edges |
| `--input` | `oklch(0.872 0.005 95)` | Field borders |
| `--destructive` | `oklch(0.53 0.17 27)` | Errors, destructive action |
| `--ring` | `oklch(0.55 0.005 90)` | Focus ring |

There is intentionally **no accent hue**. State is communicated with fill:

- outline pill + dot = locked / confirmed
- solid black pill = unlocked (attention-worthy)
- muted pill = cancelled
- red text = destructive or invalid

## Type

| Role | Font | Size / treatment |
|---|---|---|
| UI | Geist Sans (variable) | 13–15 px body, 1.6 line-height |
| Display | Geist Sans | `clamp(2.6rem, 7vw, 5.2rem)`, weight 500, tracking −0.045em, leading 0.95 |
| Section heading | Geist Sans | `clamp(1.75rem, 3.4vw, 2.6rem)` |
| Eyebrow / label | Geist Sans | 10.5 px, uppercase, tracking 0.18em, muted |
| Reference, code, money | Geist Mono / tabular nums | `num` utility for aligned figures |

Rules:

- One family for everything; hierarchy comes from size, weight, and space.
- Maximum measure ~44rem for prose.
- Numbers are tabular so totals in a column line up.

## Layout

- Shell: `max-width: 72rem` (1152 px), padding 20 px mobile / 32 px desktop.
- Grid: 12 columns on desktop, single column below `md`.
- Section rhythm: 56 px mobile, 80 px desktop (`py-14 md:py-20`).
- Borders do the dividing; shadows are not used on cards.
- Radii: 10 px (`--radius: 0.625rem`), 6 px on small controls.

## Components

| Component | Notes |
|---|---|
| `Button` | Heights 36/40/44 px by context; solid black primary, hairline outline secondary; disabled uses muted fill, not 50% opacity |
| `Input` | 40 px on forms, border `--input`, focus ring; `aria-invalid` turns border red |
| `Card` / panel | `bg-card` + 1px border + 10 px radius; no shadow |
| `Pill` | 11 px, rounded-full, dot + label; encodes status |
| `Calendar` | react-day-picker, booked nights struck through with a dot; range selection |
| `Dialog` | Radix focus trap, used for cancellation confirmation |
| `Sheet` | Mobile navigation |
| `Toaster` | Sonner, bottom-right, for mutation results |

## Imagery

- All fleet and hero photographs are rendered in greyscale (`filter: grayscale`)
  so the palette cannot be broken by a supplier's colour cast.
- Fixed aspect ratios: 4:3 cards, 16:10 detail, 4:5 hero on desktop.
- `object-position` is stored per van (`imagePosition`) because portrait photos
  need a different crop.
- Alt text describes the vehicle and setting, not "image".

## Motion

- 150–200 ms colour/opacity transitions on hover and focus.
- 400–500 ms image scale (max 1.02) on card hover.
- No entrance animations, parallax, or scroll effects.
- `prefers-reduced-motion` disables smooth scrolling and shortens all durations.

## Accessibility

Target: WCAG 2.1 AA.

- Body text `#171614` on `#f5f4f0` is ~15:1. Muted text is ~5.5:1.
- Focus is never removed: `:focus-visible` gets a 2 px ink outline with offset.
- Every field has a visible `<label for>`.
- Validation errors use `role="alert"` and `aria-invalid` on the input.
- The booking calendar is a grid with day buttons and keyboard support from
  react-day-picker.
- Tables use `<th scope="col">`; mobile lists are real lists.
- Dialogs trap focus and restore it (Radix).
- Skip link to `#main` on every public page.
- Status is never conveyed by colour alone — pills carry text.

## Responsive breakpoints

| Width | Layout |
|---|---|
| < 640 | Single column, stacked cards, mobile sheet nav |
| 640–1023 | Two-column fleet, van page still stacked |
| ≥ 1024 | 12-column hero, sticky booking panel, 3-column fleet, admin table |
| ≥ 1280 | Wider shell only; no new structure |

Verified with Playwright at 390 px (iPhone 13) and 1440 px. No horizontal
scroll at either width.
