## Architectural Decisions & Principles (Atom)

* **03/11 - Extraction of `FavoritePassageCard`:**
  * **Rule Established:** Complex, domain-specific UI components (like Passage cards or customized list items) duplicated in multiple areas (even within the same file for different loops, such as `upcoming` vs `past` lists) must be extracted to `app/components/domain/`.
  * **Justification:** Avoids code duplication (DRY) and adheres to Atomic Design principles, making the UI logic cleaner and more maintainable without introducing overly-generic UI component bloat.
