# Atom's Architectural Journal ⚛️

## 2026-05-24
*   **Creation of `<UiIconBox>`**: Identified repetitive patterns for icon containers across `food.vue`, `afterparty.vue`, `plan.vue`, and `UiInfoTile.vue`. These containers shared properties like glassmorphism, solid backgrounds, gradients, borders, and shadows.
    *   **Rule Established**: "Icon containers with specific shapes (circle/square), variants (glass/solid/gradient), and effects (glow/pulse) must be implemented using `<UiIconBox>`."
    *   **Refactoring**: Extracted logic into `app/components/ui/IconBox.vue`.
    *   **Usage**: Used in `UiInfoTile` for consistency, and directly in pages where standalone icons or icon buttons are needed. Supports polymorphic rendering via `as` prop (e.g., `as="button"`).
