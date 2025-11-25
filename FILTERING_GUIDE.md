# Hebrew Calendar Event Filtering Guide

## Overview

The MMM-HebrewCalendar module now supports filtering options to hide certain types of Jewish holidays and events. This allows you to customize your calendar display based on your preferences.

## Available Filtering Options

### 1. `noModern` - Hide Modern Israeli Holidays

**Default:** `false` (shows all modern holidays)

**When set to `true`, hides:**
- יום השואה (Yom HaShoah - Holocaust Remembrance Day)
- יום הזיכרון (Yom HaZikaron - Memorial Day) 
- יום העצמאות (Yom HaAtzmaut - Independence Day)
- יום ירושלים (Yom Yerushalayim - Jerusalem Day)
- יום בן גוריון (Ben Gurion Day)
- סיגד (Sigd - Ethiopian Jewish holiday)
- חג הבנות (Family Day)
- Other modern Israeli observances

**Use case:** If you prefer to only see traditional Torah-based and Rabbinic holidays.

### 2. `noMinorFast` - Hide Minor Fast Days

**Default:** `false` (shows all fast days)

**When set to `true`, hides:**
- צום גדליה (Fast of Gedaliah - 3rd of Tishrei)
- עשרה בטבת (Tenth of Tevet)
- תענית אסתר (Fast of Esther - day before Purim)
- י"ז בתמוז (Seventeenth of Tammuz)

**Note:** Major fasts are NOT hidden:
- ✅ יום כפור (Yom Kippur) - still shown
- ✅ תשעה באב (Tisha B'Av) - still shown

**Use case:** If you want to show only major fasts without cluttering the calendar with minor fast days.

### 3. `noRoshChodesh` - Hide Rosh Chodesh

**Default:** `false` (shows Rosh Chodesh)

**When set to `true`, hides:**
- All Rosh Chodesh (ר"ח) - new month celebrations
- חג הבנות (Chag HaBanot/Girls Holiday) - a Rosh Chodesh Tevet celebration observed in Sephardic/Mizrahi communities

**Note:** "חג הבנות" is specifically filtered when `noRoshChodesh: true` because it's celebrated on Rosh Chodesh Tevet (during Chanukah) and is considered a Rosh Chodesh-related observance.

**Use case:** If you want a cleaner calendar without monthly new moon markers and related celebrations.

## Configuration Examples

### Example 1: Hide Modern Holidays Only

Perfect if you want traditional holidays only:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    noModern: true,        // ← Hides Ben Gurion Day, Sigd, etc.
    noMinorFast: false,    // Shows minor fasts
    noRoshChodesh: false,  // Shows Rosh Chodesh
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

**Result:**
- ✅ Shows: Rosh Hashanah, Yom Kippur, Sukkot, Chanukah, Purim, Pesach, Shavuot
- ✅ Shows: Torah portions, candle lighting, havdalah
- ✅ Shows: All fast days
- ✅ Shows: Rosh Chodesh
- ❌ Hides: Ben Gurion Day, Sigd, Yom HaAtzmaut, etc.

### Example 2: Ultra-Clean Calendar

Shows only the most important holidays:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    noModern: true,         // Hide modern holidays
    noMinorFast: true,      // Hide minor fasts
    noRoshChodesh: true,    // Hide Rosh Chodesh
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      name: "New York",
      countryCode: "US",
      timezone: "America/New_York",
      israelObservance: false
    }
  }
}
```

**Result:**
- ✅ Shows: Major holidays only
- ✅ Shows: Torah portions, candle lighting, havdalah
- ✅ Shows: Yom Kippur and Tisha B'Av (major fasts)
- ❌ Hides: Modern holidays
- ❌ Hides: Minor fasts
- ❌ Hides: Rosh Chodesh

### Example 3: Hide Minor Fasts Only

If you observe major fasts but not minor ones:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    noModern: false,       // Show modern holidays
    noMinorFast: true,     // ← Hide minor fasts only
    noRoshChodesh: false,  // Show Rosh Chodesh
    location: {
      latitude: 31.7683,
      longitude: 35.2137,
      name: "Jerusalem",
      countryCode: "IL",
      timezone: "Asia/Jerusalem",
      israelObservance: true
    }
  }
}
```

**Result:**
- ✅ Shows: All holidays including modern ones
- ✅ Shows: Yom Kippur and Tisha B'Av
- ✅ Shows: Rosh Chodesh
- ❌ Hides: Fast of Gedaliah, Tenth of Tevet, Fast of Esther, 17th of Tammuz

### Example 4: Diaspora with No Modern Holidays

Traditional diaspora setup:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    noModern: true,        // Hide Israeli modern holidays
    noMinorFast: false,    // Show all fasts (more commonly observed in diaspora)
    noRoshChodesh: false,  // Show Rosh Chodesh
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      name: "London",
      countryCode: "GB",
      timezone: "Europe/London",
      israelObservance: false  // Diaspora observance
    }
  }
}
```

**Reasoning:** Many diaspora communities don't observe modern Israeli holidays like Yom HaAtzmaut.

## Technical Details

### How It Works

These filtering options use the hebcal library's built-in filtering capabilities:

1. **Client side (`MMM-HebrewCalendar.js`):** Configuration options are read from `config.js`
2. **Communication:** Options are sent to `node_helper.js` via socket notification
3. **Server side (`node_helper.js`):** Options are passed to the hebcal API
4. **Hebcal library:** Filters events before returning them
5. **Display:** Only filtered events are rendered on the calendar

### hebcal API Options

The module passes these options directly to hebcal's `HebrewCalendar.calendar()` method:

```javascript
const monthlyOptions = {
  year: 2025,
  month: 11,
  location: currentLocation,
  candlelighting: true,
  havdalah: true,
  sedrot: true,
  locale: 'he',
  il: true,
  noModern: true,           // ← Our filtering option
  noMinorFast: false,       // ← Our filtering option
  noRoshChodesh: false      // ← Our filtering option
};
```

### Performance Impact

**None.** Filtering happens at the hebcal library level before events are returned, so there's no performance penalty. In fact, filtering reduces:
- Network data transfer (fewer events sent)
- Memory usage (fewer events stored)
- DOM elements (cleaner display)

## Troubleshooting

### Events Still Showing After Enabling Filters

**Problem:** You set `noModern: true` or `noRoshChodesh: true` but still see certain holidays.

**Specific case - "חג הבנות" (Chag HaBanot) still showing:**

"חג הבנות" (Chag HaBanot/Girls Holiday) is a Rosh Chodesh-related celebration observed on Rosh Chodesh Tevet during Chanukah, primarily in Sephardic and Mizrahi communities. To hide it:

1. **Set `noRoshChodesh: true` in your config:**
   ```javascript
   {
     module: "MMM-HebrewCalendar",
     config: {
       noRoshChodesh: true,  // This will hide Chag HaBanot
       // ... other config
     }
   }
   ```

2. **Restart MagicMirror completely:**
   ```bash
   # Stop MagicMirror (Ctrl+C)
   cd ~/MagicMirror
   npm start
   ```

3. **Verify in logs:**
   Look for: `"Skipping Chag HaBanot due to noRoshChodesh filter"`

**Why it works:**
The module now includes a specific check for "חג הבנות" when `noRoshChodesh` is enabled, since this celebration is intrinsically linked to Rosh Chodesh Tevet.

**Solutions for other events:**
1. **Restart MagicMirror completely:**
   ```bash
   # Stop MagicMirror (Ctrl+C)
   cd ~/MagicMirror
   npm start
   ```

2. **Check console for errors:**
   - Open browser console (F12)
   - Look for: `"Filtering options: noModern=true"`
   - This confirms options are being sent correctly

3. **Verify configuration syntax:**
   ```javascript
   // Correct:
   noModern: true,
   
   // Wrong:
   noModern: "true",  // String instead of boolean
   NoModern: true,    // Wrong capitalization
   ```

### Unsure Which Events Are Filtered

**Solution:** Check the terminal where you run `npm start`:

```
Fetching Jewish holidays for 2025/11 and next month
Filtering options: noModern=true, noMinorFast=false, noRoshChodesh=false
Processing 47 events for 2025/11
```

This log shows which filters are active.

### Want to Filter Specific Holidays

**Problem:** You want to hide only specific holidays (e.g., just Sigd) but not all modern holidays.

**Solution:** Use the `hideCalendars` option instead:

```javascript
hideCalendars: ["Jewish Holidays"]  // Hides all Jewish holidays (not recommended)
```

Unfortunately, hebcal doesn't support per-holiday filtering. The available filters are:
- All modern holidays (or none)
- All minor fasts (or none)
- All Rosh Chodesh (or none)

**Workaround:** If you need granular control, you would need to modify the code to filter by event title after receiving events from hebcal.

## Migration Guide

### Upgrading from Previous Versions

If you're upgrading from an older version without filtering support:

**Before:**
```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    location: { /* ... */ }
  }
}
```

**After (no changes needed):**
```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    // New options are optional - defaults maintain old behavior
    noModern: false,       // Optional: defaults to false
    noMinorFast: false,    // Optional: defaults to false
    noRoshChodesh: false,  // Optional: defaults to false
    location: { /* ... */ }
  }
}
```

**All filtering options are backward compatible** - if you don't specify them, the module behaves exactly as before.

## FAQ

### Q: Will this affect my custom `hebrewEvents`?
**A:** No. Custom events you add via `hebrewEvents` configuration are never filtered. Only hebcal-provided holidays are affected.

### Q: Can I hide Chanukah or Purim?
**A:** No. These are traditional holidays and cannot be filtered. Only modern holidays, minor fasts, and Rosh Chodesh can be filtered.

### Q: What about Torah portions (Parasha)?
**A:** Torah portions are never filtered regardless of settings. They always show on Shabbat.

### Q: What about candle lighting times?
**A:** Candle lighting and Havdalah times are never filtered. They always show when applicable.

### Q: Does this work with both Israel and Diaspora observance?
**A:** Yes. Filtering works regardless of the `israelObservance` setting.

### Q: Can I hide all holidays?
**A:** Yes, but you'd need to use the hebcal option `noHolidays: true`. This is not exposed in the module configuration but could be added if needed.

## Support

For issues or feature requests related to filtering:
1. Check the [GitHub issues](https://github.com/neshkoli/MMM-HebrewCalendar/issues)
2. Review the [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
3. Check hebcal library documentation: https://hebcal.github.io/api/core/

---

**Version:** 1.1.0  
**Last Updated:** November 2025  
**Hebcal Version:** @hebcal/core v5.9.8

