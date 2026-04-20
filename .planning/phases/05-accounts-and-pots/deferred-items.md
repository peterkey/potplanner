# Deferred Items — Phase 05

## Pre-existing type errors (out of scope)

### pot-form module missing
- **Discovered during:** Plan 05-02 final verification
- **Error:** `Cannot find module '@/components/pots/pot-form'`
- **Origin:** Plan 05-01 created `pot-list.tsx` which imports `pot-form.tsx` that doesn't exist yet
- **Resolution:** Will be resolved when Plan 05-03 creates `src/components/pots/pot-form.tsx`
- **Impact:** `npm run type-check` fails until Plan 05-03 completes
