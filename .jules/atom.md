# Atom's Architecture Journal ⚛️

## 03/11 - Création de `<UiBackButton>`

- **Component:** `app/components/ui/BackButton.vue`
- **Pattern:** Abstracted the "Back Button" logic (Glassmorphism, Icon, Text) into a reusable component.
- **Rule:** All generic UI components (buttons, badges, cards) must be prefixed with `Ui` and placed in `app/components/ui/`.
- **Logic:** The component handles both `NuxtLink` (via `to` prop) and history navigation (via `router.back()`).
