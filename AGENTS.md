# AGENTS.md

## Mobile Card Styling Rules

### Header pattern
- Use `AppShell`'s `mobileHeaderAddon` slot for all page headers (back buttons, titles, tabs).
- Never put headers inside `<main>` — they must stay fixed at the top while content scrolls.
- Pattern:
  ```tsx
  <AppShell mobileHeaderAddon={<div>...</div>}>
    <main>scrollable content</main>
  </AppShell>
  ```

### Card design (native mobile look)
- Use `rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm` for card containers.
- Never nest cards inside a bordered/wrapped section — each card stands on its own.
- For tappable cards, use `<button>` with `active:scale-[0.98]` for press feedback.
- Remove standalone "View" buttons when the whole card is tappable.

### Spacing
- Cards: `gap-3` between items in a list.
- Content padding: `px-4 py-4 pb-28 sm:px-6 md:px-9` inside `<main>`.
- Max width: `max-w-[78rem]` with `mx-auto`.

### Status badges
- Use `rounded-full border px-2.5 py-1 text-[0.6875rem] font-black capitalize` with status-specific colors.
- Status colors: `ACCEPTED` → emerald, `PENDING` → amber, `REJECTED` → red, `CANCELLED` → slate, `SENT` → blue.

### Icons
- Use `lucide-react` icons consistently.
- Card icons: `size-5` inside `size-11 rounded-xl` containers.
- Inline icons: `size-3.5` or `size-4`.
