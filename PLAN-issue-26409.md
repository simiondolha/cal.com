# Implementation Plan: Issue #26409

## Problem

Toggling a day OFF and back ON resets custom availability times to 9 AM - 5 PM.

## Root Cause

`packages/features/schedules/components/Schedule.tsx`, line 99-100:

```tsx
onCheckedChange={(isChecked) => {
  setValue(name, (isChecked ? [DEFAULT_DAY_RANGE] : []) as TFieldValues[typeof name]);
}}
```

When toggling ON, it always uses the default range instead of preserving the user's custom times.

## Solution

Cache the time range before clearing. Restore it when re-enabling.

### File to modify

`packages/features/schedules/components/Schedule.tsx`

### Changes

**1. Add ref to store previous value (inside `ScheduleDay` component, after line 76):**

```tsx
// Cache for restoring times when day is toggled back on
const previousRangeRef = useRef<TimeRange[]>([]);
```

**2. Replace the `onCheckedChange` handler (lines 99-100):**

```tsx
onCheckedChange={(isChecked) => {
  if (isChecked) {
    // Restore cached times, or use default if none cached
    const timesToRestore = previousRangeRef.current.length > 0
      ? previousRangeRef.current
      : [DEFAULT_DAY_RANGE];
    setValue(name, timesToRestore as TFieldValues[typeof name]);
  } else {
    // Cache current times before clearing
    if (watchDayRange?.length > 0) {
      previousRangeRef.current = watchDayRange;
    }
    setValue(name, [] as TFieldValues[typeof name]);
  }
}}
```

**3. Add TimeRange import if not present:**

```tsx
import type { TimeRange } from "@calcom/types/schedule";
```

## Why This Works

- `useRef` persists values across renders without causing re-renders
- Each day has its own ref, so toggling one day doesn't affect others
- Falls back to default (9-5) when no previous value exists (first toggle)
- Simple, minimal change with no architectural impact

## Test

1. Set Monday to 11 AM - 3 PM
2. Toggle Monday OFF
3. Toggle Monday ON
4. Verify it shows 11 AM - 3 PM (not 9 AM - 5 PM)
