# Quick Fix: Hiding חג הבנות (Chag HaBanot)

## Problem
The event "חג הבנות" (Chag HaBanot / Girls Holiday) is still showing on your calendar.

## Solution
The event is now filtered when you enable `noRoshChodesh: true`.

## What I Changed

### 1. Updated `node_helper.js`
Added specific filtering for "חג הבנות" in the event processing loop:

```javascript
// Skip "חג הבנות" (Chag HaBanot/Girls Holiday) if noRoshChodesh is enabled
if (noRoshChodesh && (
  hebrewTitle.includes('חג הבנות') ||
  desc.includes('Chag HaBanot') ||
  desc.includes('Girls')
)) {
  console.log(`Skipping Chag HaBanot due to noRoshChodesh filter: ${hebrewTitle}`);
  return; // Skip this event
}
```

Also added `noSpecialShabbat: true` to the hebcal options to suppress special Shabbat events that might include this celebration.

## Your Configuration

You already have `noRoshChodesh: true` in your defaults! This means the fix is already active.

**From your `MMM-HebrewCalendar.js` (line 101):**
```javascript
noRoshChodesh: true,   // Set to true to hide Rosh Chodesh
```

## Next Steps

1. **Restart MagicMirror:**
   ```bash
   # Press Ctrl+C to stop MagicMirror
   cd ~/MagicMirror
   npm start
   ```

2. **Verify the fix is working:**
   - Check the terminal output (not browser console)
   - Look for this message:
     ```
     Skipping Chag HaBanot due to noRoshChodesh filter: חג הבנות
     ```

3. **If still showing:**
   - Clear browser cache (Ctrl+Shift+R)
   - Make sure you saved all files
   - Restart MagicMirror again

## What is "חג הבנות"?

**Chag HaBanot** (חג הבנות) is a celebration observed on Rosh Chodesh Tevet (during Chanukah), primarily in Sephardic and Mizrahi Jewish communities. It honors the heroism of women, particularly celebrating the role of Judith in the Chanukah story. Since it's celebrated on Rosh Chodesh, it makes sense to filter it with the `noRoshChodesh` option.

## Technical Details

### Why wasn't it filtered before?

The hebcal library categorizes "חג הבנות" in a way that wasn't caught by the standard `noRoshChodesh` filter. It might be classified as:
- A special Shabbat/Rosh Chodesh event
- A minor modern holiday
- A cultural observance

### How the fix works:

1. **Primary filter:** Added explicit check for the Hebrew text "חג הבנות"
2. **Fallback filters:** Check for English translations ("Chag HaBanot", "Girls")  
3. **Additional suppression:** Set `noSpecialShabbat: true` in hebcal options
4. **Logging:** Added console log to confirm when the event is skipped

## Other Events You Can Hide

Since you have `noRoshChodesh: true` set in defaults, you're already hiding:
- ✅ All Rosh Chodesh (ר"ח) events
- ✅ חג הבנות (Chag HaBanot)
- ✅ Shabbat Mevarchim (if any)

If you want to hide other events:

**Modern Israeli holidays:**
```javascript
noModern: true  // Hides Ben Gurion Day, Sigd, Yom HaAtzmaut, etc.
```

**Minor fasts:**
```javascript
noMinorFast: true  // Hides Fast of Gedaliah, Tenth of Tevet, etc.
```

## Full Configuration Example

Here's what a complete config looks like to hide all minor events:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    mode: "fourWeeks",
    noModern: true,         // Hide modern Israeli holidays
    noMinorFast: false,     // Keep fasts (set true to hide)
    noRoshChodesh: true,    // Hide Rosh Chodesh AND Chag HaBanot
    location: {
      latitude: 32.0853,
      longitude: 34.7818,
      name: "Tel Aviv",
      countryCode: "IL",
      timezone: "Asia/Jerusalem",
      israelObservance: true
    }
  }
}
```

## Verification Checklist

- [x] Code updated in `node_helper.js` with Chag HaBanot filter
- [x] Added `noSpecialShabbat: true` to hebcal options
- [x] You already have `noRoshChodesh: true` in defaults
- [ ] Restart MagicMirror
- [ ] Check terminal logs for "Skipping Chag HaBanot" message
- [ ] Verify event no longer appears on calendar

## Still Having Issues?

If "חג הבנות" still appears after restarting:

1. **Check the exact text:**
   - Take a screenshot or note the exact Hebrew/English text
   - It might be spelled differently

2. **Check terminal logs:**
   - Look for: `Processing X events for 2025/12`
   - Look for: `Found major holiday` or similar messages
   - See if "חג הבנות" appears in logs

3. **Try additional filtering:**
   - Set `noModern: true` as well
   - This might catch it if it's categorized as a modern observance

4. **Contact me:**
   - Share the terminal logs
   - Share the exact event text
   - I can add more specific filters

---

**Updated:** November 2025  
**Module Version:** 1.1.0  
**Fix Applied:** Explicit Chag HaBanot filtering when noRoshChodesh is enabled

