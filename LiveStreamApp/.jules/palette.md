## 2024-05-24 - Leaflet Marker Accessibility
**Learning:** By default, Leaflet map markers (`L.marker`) render as `<img>` elements without `alt` text or a `title` attribute. This makes them completely invisible to screen readers and difficult to navigate for keyboard-only users or users relying on native tooltips.
**Action:** When initializing Leaflet map markers, always include `title` (for native hover tooltips) and `alt` (for screen reader text) properties in the `MarkerOptions` object. This ensures the Point of Interest is properly announced and discoverable.
