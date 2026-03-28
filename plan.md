1. **Analyze `FilterSheet.vue`:**
   - Remove redundant `useState` local copy logic. The component currently duplicates state: `selectedDivision`, `selectedSalle`, `selectedApparatus`, and `selectedHidePast`. Instead, these should either directly mutate `filtersStore.value` or cleanly bind to local refs initialized from the store without complex watch synchronization on `isOpen`.
   - Explicitly type the shared state from `schedule.vue` instead of using `useState<any>('scheduleMeta')`.

2. **Analyze `schedule.vue`:**
   - Ensure the filters state synchronization aligns with the changes in `FilterSheet.vue`.

3. **Verify other `any` occurences in `results.vue` and `admin/dashboard.vue`**
   - In `results.vue`: line 154 `const code = data.apparatus.code || (data as any).apparatusCode`. We should update `ScoreUpdatePayload` or use proper type narrowing instead of `any`.
   - In `admin/dashboard.vue`: line 151 and 320 `} catch (e: any) {`. Update to `catch (e: unknown)` and properly typecast or handle error message.

I will request plan review.
