# Spark's Journal

## Group Info Card Stats
- **Interaction**: Animated counting numbers and staggered entrance for stats cards.
- **Result**: The static numbers felt dead. Animating them from 0 gives a sense of calculation and liveness.
- **Learning**: `tabular-nums` is essential for counters to prevent jitter. 50ms delay is enough for the DOM to be ready for transition.
- **Feeling**: 2000ms duration for the counter feels "epic" but might be too slow for repetitive viewing. Settled on 2000ms for now as it matches the entrance animation vibe.
