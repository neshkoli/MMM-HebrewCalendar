# MMM-HebrewCalendar Technical Architecture Documentation

> **Comprehensive guide to the internal workings, hebcal integration, and configuration of the MMM-HebrewCalendar module**

## Table of Contents
1. [Module Architecture](#module-architecture)
2. [Hebcal Library Integration](#hebcal-library-integration)
3. [Configuration Deep Dive](#configuration-deep-dive)
4. [Hebcal Configuration Details](#hebcal-configuration-details)
5. [Data Flow](#data-flow)
6. [Event Categories and Styling](#event-categories-and-styling)
7. [Advanced Customization Examples](#advanced-customization-examples)
8. [Hebrew Calendar Utilities](#hebrew-calendar-utilities)
9. [Technical Insights](#technical-insights)

---

## Module Architecture

The MMM-HebrewCalendar module follows the standard MagicMirror module architecture with a client-server split:

### Component Overview

```
MMM-HebrewCalendar/
├── MMM-HebrewCalendar.js    # Client-side module (DOM rendering)
├── node_helper.js            # Server-side helper (hebcal API)
├── calendar-utils.js         # Hebrew date utilities
├── ip-utils.js               # IP address detection
├── MMM-HebrewCalendar.css    # Styling for events
└── package.json              # Dependencies (@hebcal/core)
```

### Client-Side Module (`MMM-HebrewCalendar.js`)

**Responsibilities:**
- Rendering the calendar UI with Hebrew dates
- Processing configuration and managing state
- Communicating with node_helper via socket notifications
- Handling calendar events from other MagicMirror modules
- Displaying Jewish holidays, Torah portions, and custom Hebrew events
- Managing IP address display

**Key Methods:**
- `start()`: Initializes the module, loads Hebrew events from config, triggers holiday fetch
- `getDom()`: Builds and returns the calendar DOM structure
- `notificationReceived()`: Handles calendar events from other modules
- `socketNotificationReceived()`: Receives Jewish holiday data from node_helper
- `addJewishHolidays()`: Requests holidays from node_helper
- `getHolidayCssClass()`: Classifies holidays and returns appropriate CSS class

### Server-Side Helper (`node_helper.js`)

**Responsibilities:**
- Loading and interfacing with the hebcal library
- Fetching Jewish holidays, Torah portions, candle lighting times
- Location-based calculations for accurate times
- IP address fetching (external and internal)

**Key Methods:**
- `socketNotificationReceived()`: Handles requests from the client
- `GET_JEWISH_HOLIDAYS`: Main handler that calls hebcal API
- `fetchIpAddressFromNode()`: Fetches external IP address
- `fetchInternalIpAddressFromNode()`: Fetches internal network IP

### Utility Modules

**calendar-utils.js:**
- Hebrew date conversion using `Intl.DateTimeFormat`
- Hebrew month/day parsing and formatting
- Date arithmetic for calendar rendering

**ip-utils.js:**
- IP address detection via WebRTC (internal IP)
- Fallback to node_helper for IP fetching
- DOM element creation for location/IP display

### Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│  MMM-HebrewCalendar.js (Client)                        │
│  - Renders calendar                                     │
│  - Manages user configuration                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Socket Notifications
                 │ (GET_JEWISH_HOLIDAYS)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  node_helper.js (Server)                               │
│  - Calls hebcal library                                 │
│  - Fetches holidays, Torah portions, times             │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ @hebcal/core API calls
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Hebcal Library                                         │
│  - Jewish calendar calculations                         │
│  - Location-based times                                 │
│  - Holiday/Parasha data                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Hebcal Library Integration

The module uses the hebcal library ecosystem for all Jewish calendar calculations. It implements a dual-library approach for robustness.

### Dual Library Strategy

#### Primary: `@hebcal/core` (v5.9.8+)

**Modern API with full feature support:**
```javascript
const { Location, HebrewCalendar } = require('@hebcal/core');

const location = new Location(
  32.0853,        // latitude
  34.7818,        // longitude
  true,           // israelObservance
  'Asia/Jerusalem', // timezone
  'Tel Aviv',     // name
  'IL'            // countryCode
);

const events = HebrewCalendar.calendar({
  year: 2025,
  month: 11,
  location: location,
  isHebrewYear: false,
  candlelighting: true,
  havdalah: true,
  sedrot: true,
  locale: 'he',
  il: true
});
```

**Features utilized:**
- `HebrewCalendar.calendar()`: Fetches monthly events
- `Location` class: Geographic location with timezone support
- `candlelighting: true`: Enables candle lighting times
- `havdalah: true`: Enables havdalah (end of Shabbat) times
- `sedrot: true`: Enables Torah portion (Parasha) readings
- `locale: 'he'`: Returns Hebrew text for event names
- `il: true/false`: Israel vs Diaspora observance

#### Fallback: `hebcal` (v2.3.2)

**Legacy library for backward compatibility:**
```javascript
const Hebcal = require('hebcal');

Hebcal.location = {
  latitude: 32.0853,
  longitude: 34.7818,
  cc: 'IL',
  tzid: 'Asia/Jerusalem'
};

const hdate = new Hebcal.HDate(new Date());
hdate.il = true; // Israel observance
const holidays = hdate.holidays();
```

**When used:**
- If `@hebcal/core` fails to load
- Legacy MagicMirror installations
- Limited feature set (no Parasha, no timed events)

### Hebcal API Usage in node_helper.js

The node_helper implements the following workflow:

```javascript
// 1. Create location from configuration
const currentLocation = new Location(
  configLocation.latitude, 
  configLocation.longitude, 
  configLocation.israelObservance, 
  configLocation.timezone, 
  configLocation.name, 
  configLocation.countryCode
);

// 2. Fetch events for current and next month
const monthlyOptions = {
  year: targetYear,
  month: targetMonth,
  location: currentLocation,
  isHebrewYear: false,
  candlelighting: true,    // Get candle lighting times
  havdalah: true,          // Get havdalah times
  sedrot: true,            // Get Torah portions
  omer: false,
  locale: 'he',            // Hebrew locale for text
  il: configLocation.israelObservance,
  noModern: noModern || false,           // Filter modern holidays
  noMinorFast: noMinorFast || false,     // Filter minor fasts
  noRoshChodesh: noRoshChodesh || false  // Filter Rosh Chodesh
};

const monthlyEvents = HebrewCalendar.calendar(monthlyOptions);
```

### Event Categories from Hebcal

Hebcal returns events with categories that the module classifies:

```javascript
const categories = event.getCategories();

// Major holidays
categories.includes('major') || categories.includes('yomtov')

// Torah portions (Parasha)
categories.includes('parashat')

// Candle lighting
categories.includes('candles')

// Havdalah
categories.includes('havdalah')
```

### Hebrew Text Rendering

The module requests Hebrew text from hebcal:

```javascript
const hebrewTitle = event.render('he');  // Hebrew rendering

// For Parasha, clean up the prefix
const cleanTitle = hebrewTitle
  .replace(/^פָּרָשַׁת\s+/, '')  // Remove vocalized prefix
  .replace(/^פרשת\s+/, '')      // Remove unvocalized prefix
  .replace(/^Parashat\s+/, ''); // Remove English prefix
```

### Time Extraction for Candle Lighting

```javascript
// Extract time from eventTime Date object
const timeString = event.eventTime ? 
  `${event.eventTime.getHours()}:${event.eventTime.getMinutes().toString().padStart(2, '0')}` 
  : null;

// Result: "18:15", "20:34", etc.
```

---

## Configuration Deep Dive

The module supports extensive configuration through the MagicMirror config.js file.

### Default Configuration

```javascript
defaults: {
  mode: "FourWeeks",
  firstDayOfWeek: "sunday",
  displaySymbol: true,
  wrapTitles: true,
  hideCalendars: [],
  hebrewEvents: [],
  showBottomText: true,
  noModern: false,        // Filter modern Israeli holidays
  noMinorFast: false,     // Filter minor fast days
  noRoshChodesh: false,   // Filter Rosh Chodesh
  location: {
    latitude: 32.0853,
    longitude: 34.7818,
    name: "Tel Aviv",
    countryCode: "IL",
    timezone: "Asia/Jerusalem",
    israelObservance: true
  }
}
```

### Configuration Options Explained

#### `mode` (String)

Controls the calendar view time range.

**Options:**
- `"lastMonth"`: Previous calendar month
- `"currentMonth"`: Current calendar month (default for some views)
- `"nextMonth"`: Next calendar month
- `"currentWeek"`: Current week only
- `"twoWeeks"`: Two weeks starting from current week
- `"threeWeeks"`: Three weeks starting from current week
- `"fourWeeks"`: Four weeks starting from current week (default)

**Implementation:**
```javascript
function calculateMonthDays(now, cellIndex, config) {
  const mode = config.mode.toLowerCase();
  const weeksToMonthDays = {
    currentweek: 0,
    twoweeks: 7,
    threeweeks: 14,
    fourweeks: 21
  };
  
  if (mode in weeksToMonthDays) {
    while (cellIndex > now.getDate()) {
      cellIndex -= 7;
    }
    return cellIndex + weeksToMonthDays[mode];
  }
  // Handle month modes...
}
```

#### `firstDayOfWeek` (String)

Sets which day appears in the first column.

**Options:**
- `"sunday"`: Week starts on Sunday (default)
- `"monday"`: Week starts on Monday
- `"today"`: Week starts on current day (dynamic)

**Implementation:**
```javascript
calculateStartCellIndex: function (now, days) {
  let firstDayOfWeek = this.config.firstDayOfWeek.toLowerCase();
  
  if (firstDayOfWeek === "today") {
    firstDayOfWeek = days[now.getDay()].toLowerCase();
  }
  
  // Rotate days array to match configured start
  while (firstDayOfWeek !== days[0].toLowerCase()) {
    days.push(days.shift());
  }
  
  return now.getDate() - now.getDay() + startDayOffset;
}
```

#### `displaySymbol` (Boolean)

Controls emoji display for holidays.

**Behavior:**
- `true` (default): Shows 🕎 emoji for holidays
- `false`: Text only
- **Note:** Parasha (📜), candle lighting (🕯️), and havdalah (✨) symbols always show

**Implementation:**
```javascript
if (self.config.displaySymbol || isParasha || isCandleLighting || isHavdalah) {
  if (isParasha) {
    event.title = `📜 ${event.title}`;
  } else if (isCandleLighting) {
    event.title = `🕯️ ${event.title}`;
  } else if (isHavdalah) {
    event.title = `✨ ${event.title}`;
  } else if (self.config.displaySymbol) {
    event.title = `🕎 ${event.title}`;
  }
}
```

#### `wrapTitles` (Boolean)

Controls text wrapping for event titles.

- `true` (default): Titles wrap to multiple lines
- `false`: Titles truncate with ellipsis

**CSS Implementation:**
```css
.MMM-HebrewCalendar .event-nowrap {
  white-space: nowrap;
  overflow-x: hidden;
}
```

#### `hideCalendars` (Array)

Filters out calendars by name.

**Example:**
```javascript
hideCalendars: ["Work Calendar", "US Holidays"]
```

**Implementation:**
```javascript
.filter((e) => {
  return !self.config.hideCalendars.includes(e.calendarName);
})
```

#### `hebrewEvents` (Array)

Custom recurring Hebrew date events.

**Format:**
```javascript
hebrewEvents: [
  {
    name: "David's Birthday",
    hebrewMonth: "ניסן",  // Hebrew or English month name
    hebrewDay: 5,
    type: "birthday"  // birthday, anniversary, memorial, other
  }
]
```

**Supported types and emojis:**
- `"birthday"`: 🎂
- `"anniversary"`: 💍
- `"memorial"`: 🕯️
- `"other"`: ⭐

#### `showBottomText` (Boolean)

Controls display of location and IP address below calendar.

- `true` (default): Shows "Zmanim for [Location]" and "IP: [address]"
- `false`: No bottom text

#### `location` (Object)

Geographic location for accurate Jewish times. See next section for details.

#### `noModern` (Boolean)

Filters out modern Israeli holidays.

**Options:**
- `false` (default): Show all modern holidays
- `true`: Hide modern Israeli holidays

**Hidden holidays when `true`:**
- יום השואה (Yom HaShoah - Holocaust Remembrance Day)
- יום הזיכרון (Yom HaZikaron - Memorial Day)
- יום העצמאות (Yom HaAtzmaut - Independence Day)
- יום ירושלים (Yom Yerushalayim - Jerusalem Day)
- יום בן גוריון (Ben Gurion Day)
- סיגד (Sigd - Ethiopian Jewish holiday)
- חג הבנות (Family Day)

**Example:**
```javascript
noModern: true  // Hides all modern Israeli holidays
```

**Use case:** Users who prefer to only see traditional holidays from the Torah and Talmud.

#### `noMinorFast` (Boolean)

Filters out minor fast days.

**Options:**
- `false` (default): Show all fast days
- `true`: Hide minor fast days

**Hidden fasts when `true`:**
- צום גדליה (Fast of Gedaliah - 3 Tishrei)
- עשרה בטבת (Tenth of Tevet)
- תענית אסתר (Fast of Esther - day before Purim)
- י"ז בתמוז (Seventeenth of Tammuz)

**Note:** Major fasts (Yom Kippur and Tisha B'Av) are NOT hidden by this option.

**Example:**
```javascript
noMinorFast: true  // Hides minor fasts only
```

#### `noRoshChodesh` (Boolean)

Filters out Rosh Chodesh (new month) celebrations.

**Options:**
- `false` (default): Show Rosh Chodesh
- `true`: Hide Rosh Chodesh events

**Example:**
```javascript
noRoshChodesh: true  // Hides all Rosh Chodesh events
```

**Use case:** Users who want a less cluttered calendar without monthly new moon observances.

---

## Hebcal Configuration Details

The `location` object is crucial for accurate Jewish calendar calculations. Hebcal uses geographic coordinates to calculate sun-based times (candle lighting, havdalah) and apply location-specific holiday rules.

### Location Object Structure

```javascript
location: {
  latitude: 32.0853,           // Required: GPS latitude
  longitude: 34.7818,          // Required: GPS longitude
  name: "Tel Aviv",            // Required: Display name
  countryCode: "IL",           // Required: ISO 3166-1 alpha-2 code
  timezone: "Asia/Jerusalem",  // Required: IANA timezone identifier
  israelObservance: true       // Required: Israel vs Diaspora rules
}
```

### Location Parameters Explained

#### `latitude` and `longitude` (Numbers)

GPS coordinates for sun-based time calculations.

**Purpose:**
- Calculate sunset time for candle lighting
- Calculate nightfall time for havdalah
- Determine day length for seasonal prayers

**Example coordinates:**
- Tel Aviv: `32.0853, 34.7818`
- Jerusalem: `31.7683, 35.2137`
- New York: `40.7128, -74.0060`
- London: `51.5074, -0.1278`
- Los Angeles: `34.0522, -118.2437`

**How to find coordinates:**
1. Google Maps: Right-click → "What's here?"
2. [latlong.net](https://www.latlong.net/)
3. GPS device or smartphone

#### `timezone` (String)

IANA timezone identifier for accurate time conversion.

**Purpose:**
- Convert UTC times to local time
- Handle daylight saving time transitions
- Display times in user's local timezone

**Common timezones:**
- Israel: `"Asia/Jerusalem"`
- US Eastern: `"America/New_York"`
- US Pacific: `"America/Los_Angeles"`
- UK: `"Europe/London"`
- France: `"Europe/Paris"`

**Full list:** [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

#### `israelObservance` (Boolean)

Critical setting that affects holiday duration and candle lighting customs.

**Israel Observance (`true`):**
- One-day holidays (except Rosh Hashanah)
- Candle lighting: 18 minutes before sunset
- Example: Sukkot is 7 days (not 8)

**Diaspora Observance (`false`):**
- Two-day holidays (safeguarding ancient calendar uncertainty)
- Candle lighting: varies by community (typically 18-40 minutes)
- Example: Sukkot is 8 days

**Historical context:**
In ancient times, the Jewish calendar was based on witness testimony of the new moon in Jerusalem. Due to communication delays, diaspora communities observed an extra day to ensure they celebrated on the correct day. This practice continues today.

**Code implementation:**
```javascript
// In node_helper.js
const monthlyOptions = {
  // ... other options
  il: configLocation.israelObservance  // true = Israel, false = Diaspora
};
```

#### `countryCode` (String)

ISO 3166-1 alpha-2 country code.

**Purpose:**
- Country-specific holiday variations
- Regional calendar customs
- Future extensibility

**Common codes:**
- Israel: `"IL"`
- United States: `"US"`
- United Kingdom: `"GB"`
- Canada: `"CA"`
- France: `"FR"`
- Australia: `"AU"`

### How Location Affects Calculations

#### Candle Lighting Time

Calculated based on sunset time at the location:

```javascript
// Hebcal internal calculation (simplified)
const sunsetTime = calculateSunset(latitude, longitude, date);
const candleLightingTime = subtractMinutes(sunsetTime, 18); // Israel custom
```

**Location impact:**
- **Summer (long days):** Later candle lighting (e.g., 8:00 PM)
- **Winter (short days):** Earlier candle lighting (e.g., 4:00 PM)
- **Northern latitudes:** More dramatic seasonal variation
- **Equatorial regions:** Consistent times year-round

**Example:**
- Tel Aviv in July: Candle lighting ~7:30 PM
- Tel Aviv in December: Candle lighting ~4:00 PM
- London in July: Candle lighting ~8:45 PM
- London in December: Candle lighting ~3:30 PM

#### Havdalah Time

Calculated based on nightfall (when three stars are visible):

```javascript
// Hebcal internal calculation (simplified)
const sunsetTime = calculateSunset(latitude, longitude, date);
const havdalahTime = addMinutes(sunsetTime, 42); // Standard: 3 stars at 8.5° below horizon
```

**Customs vary:**
- Standard: 42 minutes after sunset (8.5° below horizon)
- Stringent: 50 minutes after sunset (7.083° below horizon)
- Lenient: 25 minutes after sunset (when visible darkness appears)

#### Holiday Observance

```javascript
// Example: Sukkot duration
if (israelObservance) {
  // Sukkot: 7 days (15-21 Tishrei)
  // Followed by: Shmini Atzeret (22 Tishrei) and Simchat Torah (same day)
} else {
  // Sukkot: 7 days (15-21 Tishrei)
  // Followed by: Shmini Atzeret (22 Tishrei) and Simchat Torah (23 Tishrei, separate day)
}
```

### Location Configuration Examples

#### Example 1: Jerusalem, Israel

```javascript
location: {
  latitude: 31.7683,
  longitude: 35.2137,
  name: "Jerusalem",
  countryCode: "IL",
  timezone: "Asia/Jerusalem",
  israelObservance: true
}
```

**Characteristics:**
- Israel observance rules
- High elevation affects sunset times slightly
- Historical and religious center

#### Example 2: New York, USA

```javascript
location: {
  latitude: 40.7128,
  longitude: -74.0060,
  name: "New York",
  countryCode: "US",
  timezone: "America/New_York",
  israelObservance: false
}
```

**Characteristics:**
- Diaspora observance (two-day holidays)
- Daylight saving time (handled by timezone)
- Large seasonal variation in daylight

#### Example 3: London, UK

```javascript
location: {
  latitude: 51.5074,
  longitude: -0.1278,
  name: "London",
  countryCode: "GB",
  timezone: "Europe/London",
  israelObservance: false
}
```

**Characteristics:**
- Northern latitude = extreme seasonal variation
- Summer: Very late candle lighting (9+ PM)
- Winter: Very early candle lighting (3:30 PM)

#### Example 4: Sydney, Australia

```javascript
location: {
  latitude: -33.8688,
  longitude: 151.2093,
  name: "Sydney",
  countryCode: "AU",
  timezone: "Australia/Sydney",
  israelObservance: false
}
```

**Characteristics:**
- Southern hemisphere (seasons reversed)
- Summer in December, winter in June
- Moderate seasonal variation

### Customizing Hebcal Through Location

The location object is the primary way to customize hebcal behavior. All hebcal calculations are location-aware.

**What you can customize:**
- ✅ Holiday observance (Israel vs Diaspora)
- ✅ Candle lighting times (via coordinates)
- ✅ Havdalah times (via coordinates)
- ✅ Seasonal variations (via coordinates)
- ✅ Timezone display (via timezone)

**What is fixed by hebcal:**
- ❌ Holiday dates (based on Hebrew calendar)
- ❌ Fast day dates (based on Hebrew calendar)
- ❌ Torah portions (fixed annual cycle)
- ❌ Hebrew months/days (calculated from Hebrew calendar)

---

## Data Flow

Understanding the complete data flow helps with debugging and customization.

### Module Lifecycle

```
┌─────────────────────────────────────────────────────┐
│ 1. MagicMirror starts                               │
│    - Loads config.js                                │
│    - Initializes all modules                        │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. MMM-HebrewCalendar.start()                       │
│    - Initialize state variables                     │
│    - Load hebrewEvents from config                  │
│    - Parse Hebrew dates for custom events           │
│    - Initialize IP utilities                        │
│    - Call addJewishHolidays()                       │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Send socket notification                         │
│    this.sendSocketNotification(                     │
│      'GET_JEWISH_HOLIDAYS',                         │
│      { year, month, location }                      │
│    )                                                │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. node_helper.socketNotificationReceived()         │
│    - Validate hebcal library is loaded              │
│    - Create Location object from config             │
│    - Call HebrewCalendar.calendar() for 2 months    │
│    - Process and categorize events                  │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Hebcal API processing                            │
│    - Calculate holidays for current & next month    │
│    - Generate Torah portions (if Saturday)          │
│    - Calculate candle lighting times (if Friday)    │
│    - Calculate havdalah times (if Saturday)         │
│    - Render Hebrew text for event names             │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Return results to client                         │
│    this.sendSocketNotification(                     │
│      'JEWISH_HOLIDAYS_RESULT',                      │
│      holidays                                       │
│    )                                                │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. Client receives results                          │
│    socketNotificationReceived()                     │
│    - Store in sourceEvents['jewishHolidays']        │
│    - Add symbols to event titles                    │
│    - Call processEvents()                           │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. Process and merge events                         │
│    - Merge jewishHolidays with other calendars      │
│    - Sort by date                                   │
│    - Call updateDom()                               │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 9. Render calendar DOM                              │
│    getDom()                                         │
│    - Create calendar table                          │
│    - Add Hebrew date headers to cells               │
│    - Add custom Hebrew events to cells              │
│    - Add Jewish holidays to cells                   │
│    - Add other calendar events to cells             │
│    - Apply CSS styling based on event type          │
│    - Add location/IP display (if enabled)           │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 10. Display calendar                                │
│     - Calendar visible on MagicMirror               │
│     - Updates when new events arrive                │
│     - Refreshes daily at midnight                   │
└─────────────────────────────────────────────────────┘
```

### Detailed Event Processing Flow

#### Step 1: Custom Hebrew Events

```javascript
// In start() method
if (self.config.hebrewEvents && Array.isArray(self.config.hebrewEvents)) {
  self.config.hebrewEvents.forEach(event => {
    const month = getHebMonthNumber(event);  // Convert month name to number
    const day = getHebDayNumber(event);      // Extract day number
    const text = event.text || event.name;
    self.addHebrewEvent(month, day, text, event.type || 'custom');
  });
}
```

**Hebrew month conversion:**
```javascript
const monthNames = {
  'Tishrei': 1, 'Cheshvan': 2, 'Kislev': 3, 'Tevet': 4,
  'Shevat': 5, 'Adar': 6, 'Nisan': 7, 'Iyyar': 8,
  'Sivan': 9, 'Tammuz': 10, 'Av': 11, 'Elul': 12,
  'תשרי': 1, 'חשוון': 2, 'כסלו': 3, 'טבת': 4,
  'שבט': 5, 'אדר': 6, 'ניסן': 7, 'אייר': 8,
  'סיוון': 9, 'תמוז': 10, 'אב': 11, 'אלול': 12
};
```

#### Step 2: Jewish Holiday Fetching

```javascript
// Request holidays for 2 months
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

self.sendSocketNotification('GET_JEWISH_HOLIDAYS', { 
  year, 
  month, 
  location: self.config.location 
});
```

#### Step 3: Hebcal Processing (node_helper)

```javascript
// Loop through current and next month
for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
  let targetMonth = month + monthOffset;
  let targetYear = year;
  
  if (targetMonth > 12) {
    targetMonth = 1;
    targetYear++;
  }
  
  const monthlyOptions = {
    year: targetYear,
    month: targetMonth,
    location: currentLocation,
    candlelighting: true,
    havdalah: true,
    sedrot: true,
    locale: 'he',
    il: configLocation.israelObservance
  };
  
  const monthlyEvents = HebrewCalendar.calendar(monthlyOptions);
  
  // Process each event
  monthlyEvents.forEach(event => {
    const categories = event.getCategories();
    
    if (categories.includes('major')) {
      // Major holiday
      holidays.push({
        title: event.render('he'),
        date: event.getDate().greg(),
        category: 'holiday'
      });
    } else if (categories.includes('parashat')) {
      // Torah portion
      holidays.push({
        title: cleanParashaName(event.render('he')),
        date: event.getDate().greg(),
        category: 'parasha'
      });
    } else if (categories.includes('candles')) {
      // Candle lighting
      holidays.push({
        title: event.render('he').split(':')[0],
        date: event.getDate().greg(),
        category: 'candles',
        time: extractTime(event.eventTime)
      });
    }
    // ... more categories
  });
}
```

#### Step 4: Event Categorization (client)

```javascript
// In socketNotificationReceived()
self.sourceEvents["jewishHolidays"] = payload.map((ev) => {
  const isParasha = ev.category === 'parasha';
  const isHoliday = ev.category === 'holiday';
  const isCandleLighting = ev.category === 'candles';
  const isHavdalah = ev.category === 'havdalah';
  
  return {
    title: ev.title,
    startDate: new Date(ev.date),
    endDate: new Date(ev.date),
    fullDayEvent: !(isCandleLighting || isHavdalah),
    type: isParasha ? "parasha" : isCandleLighting ? "candles" : 
          isHavdalah ? "havdalah" : "holiday",
    calendarName: isParasha ? "Torah Portions" : 
                  isCandleLighting ? "Candle Lighting" : 
                  isHavdalah ? "Havdalah" : "Jewish Holidays",
    isHoliday, isParasha, isCandleLighting, isHavdalah,
    time: ev.time || null
  };
});
```

#### Step 5: DOM Rendering

```javascript
// In addCalendarEvents()
for (const event of this.events) {
  const div = el("div", { className: "event" });
  
  // Apply holiday-specific CSS
  if (event.isHoliday) {
    const cssClass = this.getHolidayCssClass(event.title);
    div.classList.add(cssClass);  // e.g., event-holiday-major
  } else if (event.isParasha) {
    div.classList.add("event-parasha");
  } else if (event.isCandleLighting) {
    div.classList.add("event-candles");
  } else if (event.isHavdalah) {
    div.classList.add("event-havdalah");
  }
  
  // Add content
  if (event.time) {
    this.addEventLineWithTime(div, event);
  } else {
    div.innerHTML = event.title;
  }
  
  // Append to correct date cell
  dateCells[dayDiff].appendChild(div);
}
```

### IP Address Flow

Parallel to the holiday flow, IP address detection runs:

```
┌─────────────────────────────────────────────────────┐
│ 1. start() - if showBottomText enabled              │
│    ipUtils.fetchUserIpAddress()                     │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Try WebRTC method (client-side)                  │
│    - Create RTCPeerConnection                       │
│    - Extract local IP from ICE candidates           │
│    - Timeout after 3 seconds                        │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Fallback to node_helper                          │
│    sendSocketNotification('GET_INTERNAL_IP_ADDRESS')│
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. node_helper fetches via os.networkInterfaces()   │
│    - Find first non-loopback IPv4                   │
│    - Verify it's a private IP range                 │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Return to client                                 │
│    sendSocketNotification(                          │
│      'INTERNAL_IP_ADDRESS_RESULT',                  │
│      internalIp                                     │
│    )                                                │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Display in DOM                                   │
│    "IP: 192.168.1.100"                              │
└─────────────────────────────────────────────────────┘
```

---

## Event Categories and Styling

The module implements a sophisticated event classification system with distinct CSS styling for each category.

### Event Categories

#### 1. Major Holidays

**Examples:** Rosh Hashanah, Yom Kippur, Passover (Pesach)

**CSS Class:** `event-holiday-major`

**Styling:**
```css
.event-holiday-major {
  background-color: rgba(138, 43, 226, 0.8); /* Purple */
  color: #fff;
  font-weight: bold;
}
```

**Classification logic:**
```javascript
const majorHolidays = [
  'ראש השנה', 'rosh hashanah', 'rosh hashana',
  'יום כפור', 'יום כיפור', 'yom kippur',
  'פסח', 'passover', 'pesach'
];

for (const holiday of majorHolidays) {
  if (titleLower.includes(holiday)) {
    return 'event-holiday-major';
  }
}
```

#### 2. Festivals

**Examples:** Sukkot, Chanukah, Shavuot, Shmini Atzeret, Simchat Torah

**CSS Class:** `event-holiday-festival`

**Styling:**
```css
.event-holiday-festival {
  background-color: rgba(30, 144, 255, 0.8); /* Blue */
  color: #fff;
}
```

**Classification logic:**
```javascript
const festivals = [
  'שבועות', 'shavuot', 'shavot',
  'סוכות', 'sukkot', 'succot',
  'חנוכה', 'hanukkah', 'chanukah', 'hanukah',
  'שמיני עצרת', 'shmini atzeret',
  'שמחת תורה', 'simchat torah'
];
```

#### 3. Minor Holidays

**Examples:** Tu BiShvat, Lag BaOmer

**CSS Class:** `event-holiday-minor`

**Styling:**
```css
.event-holiday-minor {
  background-color: rgba(100, 195, 249, 0.8); /* Light blue */
  color: #fff;
}
```

**Classification logic:**
```javascript
const minorHolidays = [
  'ט"ו בשבט', 'tu bishvat', 'tu bshvat',
  'ל"ג בעומר', 'lag baomer', 'lag b\'omer'
];
```

#### 4. Fast Days

**Examples:** Tisha B'Av, 17th of Tammuz, Fast of Gedaliah

**CSS Class:** `event-holiday-fast`

**Styling:**
```css
.event-holiday-fast {
  background-color: rgba(105, 105, 105, 0.8); /* Gray */
  color: #fff;
}
```

**Classification logic:**
```javascript
const fastDays = [
  'צום', 'fast',
  'תענית', 'taanit',
  'י"ז בתמוז', '17 tammuz',
  'ט"ב באב', 'tisha bav', '9 av'
];
```

#### 5. Modern Israeli Holidays

**Examples:** Yom HaAtzmaut, Yom Yerushalayim, Yom HaZikaron, Yom HaShoah

**CSS Class:** `event-holiday-modern`

**Styling:**
```css
.event-holiday-modern {
  background-color: rgba(255, 69, 0, 0.8); /* Orange-red */
  color: #fff;
}
```

**Classification logic:**
```javascript
const modernHolidays = [
  'יום העצמאות', 'yom haatzmaut', 'independence day',
  'יום ירושלים', 'yom yerushalayim', 'jerusalem day',
  'יום הזיכרון', 'yom hazikaron', 'memorial day',
  'יום השואה', 'yom hashoah', 'holocaust remembrance'
];
```

#### 6. Rosh Chodesh (New Month)

**Example:** ר"ח ניסן (Rosh Chodesh Nisan)

**CSS Class:** `event-holiday-rosh-chodesh`

**Styling:**
```css
.event-holiday-rosh-chodesh {
  background-color: rgba(218, 32, 212, 0.8); /* Magenta */
  color: #333;
}
```

**Classification logic:**
```javascript
// Checked first before other categories
if (titleLower.includes('ר"ח') || titleLower.includes('rosh chodesh')) {
  return 'event-holiday-rosh-chodesh';
}
```

#### 7. Torah Portions (Parasha)

**Examples:** פרשת בראשית (Parashat Bereishit), פרשת נח (Parashat Noach)

**CSS Class:** `event-parasha`

**Styling:**
```css
.event-parasha {
  background-color: rgb(255, 244, 190); /* Light yellow */
  color: #333;
  font-style: italic;
}
```

**Symbol:** 📜 (Torah scroll)

**Always displayed:** Yes (even if `displaySymbol: false`)

#### 8. Candle Lighting

**Example:** הדלקת נרות (Hadlakat Nerot) at 18:15

**CSS Class:** `event-candles`

**Styling:**
```css
.event-candles {
  background-color: transparent;
  color: #333;
  font-style: italic;
}
```

**Symbol:** 🕯️ (Candle)

**Time display:** Always shows time (e.g., "18:15 הדלקת נרות")

#### 9. Havdalah

**Example:** הבדלה (Havdalah) at 20:34

**CSS Class:** `event-havdalah`

**Styling:**
```css
.event-havdalah {
  background-color: transparent;
  color: #333;
  font-style: italic;
}
```

**Symbol:** ✨ (Sparkles)

**Time display:** Always shows time (e.g., "20:34 הבדלה")

#### 10. Custom User Events

**Birthday:**
- CSS: `event-birthday`
- Color: Orange (`rgba(247, 119, 64, 0.7)`)
- Symbol: 🎂

**Anniversary:**
- CSS: `event-anniversary`
- Color: Pink (`rgb(251, 125, 184)`)
- Symbol: 💍

**Memorial:**
- CSS: `event-memorial`
- Color: Dark gray (`rgba(80, 80, 80, 0.7)`)
- Symbol: 🕯️
- Text color: White

**Other:**
- CSS: `event-other`
- Color: Cyan (`rgba(0, 247, 255, 0.7)`)
- Symbol: ⭐

### Cell Styling

Special styling for calendar cells:

**Today:**
```css
.today {
  box-shadow: 0px 0px 13px goldenrod;
}
```

**Shabbat (Saturday):**
```css
.shabbat {
  box-shadow: 3px 3px rgb(202, 189, 165);
  background-color: rgba(251, 215, 192, 0.818);
}
```

**Past dates:**
```css
.past-date {
  filter: brightness(97%);
}
```

**Other month:**
```css
.other-month {
  filter: brightness(45%);
}
```

### Holiday Classification Algorithm

```javascript
getHolidayCssClass: function(title) {
  const titleLower = title.toLowerCase();
  
  // Priority order:
  // 1. Rosh Chodesh (checked first)
  if (titleLower.includes('ר"ח') || titleLower.includes('rosh chodesh')) {
    return 'event-holiday-rosh-chodesh';
  }
  
  // 2. Major holidays
  if (matchesAny(titleLower, majorHolidays)) {
    return 'event-holiday-major';
  }
  
  // 3. Festivals
  if (matchesAny(titleLower, festivals)) {
    return 'event-holiday-festival';
  }
  
  // 4. Minor holidays
  if (matchesAny(titleLower, minorHolidays)) {
    return 'event-holiday-minor';
  }
  
  // 5. Fast days
  if (matchesAny(titleLower, fastDays)) {
    return 'event-holiday-fast';
  }
  
  // 6. Modern holidays
  if (matchesAny(titleLower, modernHolidays)) {
    return 'event-holiday-modern';
  }
  
  // 7. Default
  return 'event-holiday-minor';
}
```

---

## Advanced Customization Examples

### Example 1: Multiple Locations

Set up for a family with members in different cities:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "top_left",
  config: {
    location: {
      latitude: 31.7683,
      longitude: 35.2137,
      name: "Jerusalem",
      countryCode: "IL",
      timezone: "Asia/Jerusalem",
      israelObservance: true
    },
    hebrewEvents: [
      { name: "Sarah (Jerusalem)", hebrewMonth: "ניסן", hebrewDay: 5, type: "birthday" }
    ]
  }
},
{
  module: "MMM-HebrewCalendar",
  position: "top_right",
  config: {
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      name: "New York",
      countryCode: "US",
      timezone: "America/New_York",
      israelObservance: false
    },
    hebrewEvents: [
      { name: "David (NY)", hebrewMonth: "תשרי", hebrewDay: 12, type: "birthday" }
    ]
  }
}
```

### Example 2: Custom Holiday Colors

Create a custom CSS file to override colors:

```css
/* custom.css */

/* Make Rosh Hashanah extra prominent */
.MMM-HebrewCalendar .event-holiday-major {
  background-color: rgba(255, 215, 0, 0.9) !important; /* Gold */
  color: #000 !important;
  font-weight: bold;
  font-size: 1.1em;
}

/* Make Chanukah festive */
.MMM-HebrewCalendar .event-holiday-festival {
  background: linear-gradient(135deg, 
    rgba(30, 144, 255, 0.8) 0%, 
    rgba(255, 255, 255, 0.8) 100%) !important;
  color: #000 !important;
}

/* Memorial days more somber */
.MMM-HebrewCalendar .event-memorial {
  background-color: rgba(0, 0, 0, 0.8) !important;
  border: 1px solid #fff;
}
```

Then add to config.js:
```javascript
/* In config.js */
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    // ... your config
  },
  cssFile: "custom.css"
}
```

### Example 3: Extensive Family Calendar

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    mode: "fourWeeks",
    displaySymbol: true,
    wrapTitles: true,
    location: {
      latitude: 32.0853,
      longitude: 34.7818,
      name: "Tel Aviv",
      countryCode: "IL",
      timezone: "Asia/Jerusalem",
      israelObservance: true
    },
    hebrewEvents: [
      // Birthdays
      { name: "Sarah", hebrewMonth: "ניסן", hebrewDay: 5, type: "birthday" },
      { name: "David", hebrewMonth: "תשרי", hebrewDay: 12, type: "birthday" },
      { name: "Rachel", hebrewMonth: "אלול", hebrewDay: 28, type: "birthday" },
      { name: "Yosef", hebrewMonth: "כסלו", hebrewDay: 15, type: "birthday" },
      
      // Anniversaries
      { name: "Sarah & Eli", hebrewMonth: "אייר", hebrewDay: 7, type: "anniversary" },
      { name: "Parents", hebrewMonth: "תמוז", hebrewDay: 22, type: "anniversary" },
      
      // Memorial days (Yahrzeits)
      { name: "Grandma Rivka ז״ל", hebrewMonth: "אדר", hebrewDay: 18, type: "memorial" },
      { name: "Grandpa Moshe ז״ל", hebrewMonth: "חשוון", hebrewDay: 3, type: "memorial" },
      { name: "Uncle Chaim ז״ל", hebrewMonth: "שבט", hebrewDay: 11, type: "memorial" },
      
      // Other special days
      { name: "Bar Mitzvah Anniversary", hebrewMonth: "סיוון", hebrewDay: 6, type: "other" },
      { name: "Moved to Israel", hebrewMonth: "טבת", hebrewDay: 10, type: "other" }
    ]
  }
}
```

### Example 4: Week View Only (Minimal Calendar)

For a compact display showing only current week:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "top_bar",
  config: {
    mode: "currentWeek",
    firstDayOfWeek: "sunday",
    displaySymbol: false,  // No emojis for cleaner look
    wrapTitles: false,     // Truncate long titles
    showBottomText: false, // No location/IP display
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

Custom CSS for compact view:
```css
/* Make cells smaller */
.MMM-HebrewCalendar .cell {
  height: 70px;
  font-size: 0.8em;
}

/* Smaller events */
.MMM-HebrewCalendar .event {
  padding: 1px 2px;
  font-size: 0.75em;
}
```

### Example 5: Diaspora with Multiple Fast Levels

For communities that observe additional fasts:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      name: "London",
      countryCode: "GB",
      timezone: "Europe/London",
      israelObservance: false
    },
    hebrewEvents: [
      // Monday and Thursday fasts (Behab - optional fasts)
      // Note: These would need to be manually added each year
      // as they follow a specific pattern after holidays
      
      // Taanit Esther (Fast of Esther) - day before Purim
      { name: "תענית אסתר", hebrewMonth: "אדר", hebrewDay: 13, type: "other" }
    ]
  }
}
```

### Example 6: School Calendar Integration

Combine with regular MagicMirror calendar for school events:

```javascript
modules: [
  {
    module: "calendar",
    position: "top_left",
    config: {
      calendars: [
        {
          url: "https://school.edu/calendar.ics",
          name: "School Events",
          color: "#0000ff"
        }
      ],
      broadcastPastEvents: true,  // Important for MMM-HebrewCalendar
      maximumEntries: 100
    }
  },
  {
    module: "MMM-HebrewCalendar",
    position: "bottom_bar",
    config: {
      mode: "fourWeeks",
      hideCalendars: ["US Holidays"],  // Hide non-Jewish calendars
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        name: "New York",
        countryCode: "US",
        timezone: "America/New_York",
        israelObservance: false
      },
      hebrewEvents: [
        // School closes for holidays
        { name: "Last day of school", hebrewMonth: "סיוון", hebrewDay: 5, type: "other" }
      ]
    }
  }
]
```

### Example 7: Filtering Modern Holidays

For users who prefer traditional holidays only (no modern Israeli observances):

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "bottom_bar",
  config: {
    mode: "fourWeeks",
    noModern: true,        // Hide Ben Gurion Day, Sigd, Yom HaAtzmaut, etc.
    noMinorFast: false,    // Keep minor fasts
    noRoshChodesh: false,  // Keep Rosh Chodesh
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

**What gets hidden:**
- יום בן גוריון (Ben Gurion Day)
- סיגד (Sigd)
- חג הבנות (Family Day)
- יום העצמאות (Yom HaAtzmaut)
- יום הזיכרון (Yom HaZikaron)
- יום ירושלים (Yom Yerushalayim)
- יום השואה (Yom HaShoah)

**What remains visible:**
- All traditional holidays (Rosh Hashanah, Yom Kippur, Sukkot, Pesach, etc.)
- Torah portions (Parasha)
- Candle lighting and Havdalah times
- Rosh Chodesh
- Minor and major fast days

### Example 8: Ultra-Minimal Calendar

For an extremely clean calendar showing only major holidays:

```javascript
{
  module: "MMM-HebrewCalendar",
  position: "top_bar",
  config: {
    mode: "currentWeek",
    displaySymbol: false,
    wrapTitles: false,
    showBottomText: false,
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

**What remains visible:**
- Major holidays only (Rosh Hashanah, Yom Kippur, Sukkot, Pesach, Shavuot, Chanukah)
- Major fasts (Yom Kippur, Tisha B'Av)
- Torah portions (Parasha)
- Candle lighting and Havdalah times

---

## Hebrew Calendar Utilities

The `calendar-utils.js` file provides essential functions for Hebrew calendar operations.

### Hebrew Date Conversion

The module uses JavaScript's `Intl.DateTimeFormat` API with the Hebrew calendar:

```javascript
function getHebrewDatePart(date, part, locale = "he") {
  return new Intl.DateTimeFormat(
    `${locale}-u-ca-hebrew`, 
    { [part]: part === "month" ? "long" : "numeric" }
  ).format(date);
}
```

**How it works:**
- `he-u-ca-hebrew`: Hebrew locale with Hebrew calendar
- `ca-hebrew`: Calendar extension for Hebrew calendar
- `part`: "year", "month", or "day"
- Returns Hebrew-formatted date part

**Examples:**
```javascript
const date = new Date(2025, 10, 25); // Nov 25, 2025

getHebrewDatePart(date, "day", "he");   // "ד׳" (4th)
getHebrewDatePart(date, "month", "he"); // "כסלו" (Kislev)
getHebrewDatePart(date, "year", "he");  // "תשפ״ו" (5786)

getHebrewDatePart(date, "day", "en");   // "4"
getHebrewDatePart(date, "month", "en"); // "3" (month number)
```

### Utility Functions

#### `getHebMonth(date)`

Gets the Hebrew month name for a Gregorian date.

```javascript
function getHebMonth(date) {
  return getHebrewDatePart(date, "month");
}

// Example
getHebMonth(new Date(2025, 10, 25)); // "כסלו"
```

#### `getHebDayNumber(date)`

Gets the Hebrew day number.

```javascript
function getHebDayNumber(date) {
  if (date && typeof date === 'object' && !(date instanceof Date)) {
    // Handle config object format
    const dayValue = date.dd || date.hebrewDay;
    if (dayValue) {
      return parseInt(dayValue);
    }
  }
  // Handle Date object
  const dayStr = getHebrewDatePart(date, "day", "en");
  return parseInt(dayStr);
}

// Examples
getHebDayNumber(new Date(2025, 10, 25));           // 4
getHebDayNumber({ hebrewDay: 15 });                // 15
getHebDayNumber({ dd: 22 });                       // 22 (legacy format)
```

#### `getHebMonthNumber(date)`

Gets the Hebrew month as a number (1-13, with 13 for Adar II in leap years).

```javascript
function getHebMonthNumber(date) {
  if (date && typeof date === 'object' && !(date instanceof Date)) {
    const monthValue = date.mm || date.hebrewMonth;
    if (monthValue) {
      const monthNames = {
        'Tishrei': 1, 'Cheshvan': 2, 'Kislev': 3, 'Tevet': 4,
        'Shevat': 5, 'Adar': 6, 'Nisan': 7, 'Iyyar': 8,
        'Sivan': 9, 'Tammuz': 10, 'Av': 11, 'Elul': 12,
        'תשרי': 1, 'חשוון': 2, 'כסלו': 3, 'טבת': 4,
        'שבט': 5, 'אדר': 6, 'ניסן': 7, 'אייר': 8,
        'סיוון': 9, 'תמוז': 10, 'אב': 11, 'אלול': 12
      };
      
      if (typeof monthValue === 'number') {
        return monthValue;
      }
      return monthNames[monthValue] || 0;
    }
  }
  return Number(getHebrewDatePart(date, "month", "en"));
}

// Examples
getHebMonthNumber(new Date(2025, 10, 25));      // 3 (Kislev)
getHebMonthNumber({ hebrewMonth: "ניסן" });     // 7
getHebMonthNumber({ hebrewMonth: "Nisan" });    // 7
getHebMonthNumber({ mm: 5 });                   // 5 (legacy format)
```

#### `getHebDayArray()`

Returns array of Hebrew numerals for days 1-30.

```javascript
function getHebDayArray() {
  return [
    "", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳",
    'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט',
    "כ׳", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל׳"
  ];
}

// Usage
const hebDays = getHebDayArray();
hebDays[1];  // "א׳" (1st)
hebDays[15]; // 'ט"ו' (15th - special notation to avoid spelling God's name)
hebDays[16]; // 'ט"ז' (16th - same reason)
hebDays[30]; // "ל׳" (30th)
```

**Note:** Days 15 and 16 use special notation (ט"ו and ט"ז instead of י"ה and י"ו) to avoid accidentally writing one of the names of God.

#### `getDaysOfWeek()`

Returns English day names.

```javascript
function getDaysOfWeek() {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"];
}
```

#### `calculateMonthDays(now, cellIndex, config)`

Calculates how many days to display based on mode.

```javascript
function calculateMonthDays(now, cellIndex, config) {
  const mode = config.mode.toLowerCase();
  const weeksToMonthDays = {
    currentweek: 0,
    twoweeks: 7,
    threeweeks: 14,
    fourweeks: 21
  };
  
  if (mode in weeksToMonthDays) {
    // Week-based mode
    while (cellIndex > now.getDate()) {
      cellIndex -= 7;
    }
    return cellIndex + weeksToMonthDays[mode];
  } else {
    // Month-based mode
    const localNow = new Date(now);
    if (mode === "lastmonth") {
      localNow.setMonth(localNow.getMonth() - 1);
    } else if (mode === "nextmonth") {
      localNow.setMonth(localNow.getMonth() + 1);
    }
    // Calculate days in month
    return 32 - new Date(localNow.getFullYear(), localNow.getMonth(), 32).getDate();
  }
}
```

#### `addOneDay(date)`

Adds one day to a date (for event iteration).

```javascript
function addOneDay(d) {
  const newDate = new Date(d);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
}
```

#### `diffDays(a, b)`

Calculates difference in days between two dates.

```javascript
function diffDays(a, b) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  
  dateA.setHours(0, 0, 0, 0);
  dateB.setHours(0, 0, 0, 0);
  
  return Math.round((dateA - dateB) / (24 * 60 * 60 * 1000)) + 1;
}

// Example
const start = new Date(2025, 0, 1);
const end = new Date(2025, 0, 10);
diffDays(end, start); // 10
```

### Hebrew Calendar Peculiarities

#### Leap Years

The Hebrew calendar is lunisolar - it follows lunar months but adds an extra month to align with solar years. Leap years have 13 months instead of 12.

**Leap year pattern:** 7 leap years in every 19-year cycle (years 3, 6, 8, 11, 14, 17, 19)

**Extra month:** Adar II (אדר ב׳) is added after Adar (which becomes Adar I)

**How the module handles it:**
```javascript
// The Intl.DateTimeFormat API handles leap years automatically
getHebMonth(new Date(2025, 2, 15)); // "אדר" (regular year)
getHebMonth(new Date(2024, 2, 15)); // "אדר א׳" (leap year, Adar I)
getHebMonth(new Date(2024, 3, 15)); // "אדר ב׳" (leap year, Adar II)
```

**For events:**
- Events on Adar dates occur on Adar II in leap years (the "real" Adar)
- This is handled automatically by the date matching logic

#### Variable Month Lengths

Hebrew months have variable lengths:
- **Cheshvan:** 29 or 30 days (varies by year)
- **Kislev:** 29 or 30 days (varies by year)
- All other months: fixed length

**How the module handles it:**
- Uses `Intl.DateTimeFormat` which knows the Hebrew calendar rules
- Automatically adjusts for variable month lengths

#### Days 15 and 16 Special Notation

Hebrew numerals typically combine letters representing 10 and 5 for 15, and 10 and 6 for 16. However, this would spell variations of God's name (יה), so different combinations are used:

- **15:** ט"ו (9+6) instead of י"ה (10+5)
- **16:** ט"ז (9+7) instead of י"ו (10+6)

This is reflected in `getHebDayArray()`.

---

## Technical Insights

### Key Architecture Decisions

#### 1. Client-Server Split

**Why:** Hebrew calendar calculations require the hebcal library, which runs on Node.js. The browser cannot run Node.js modules directly.

**Solution:** 
- Client (`MMM-HebrewCalendar.js`): UI and DOM manipulation
- Server (`node_helper.js`): Hebcal library calls
- Communication: Socket.io notifications

**Benefits:**
- Leverages full hebcal library features
- Keeps client code lightweight
- Enables server-side caching (future enhancement)

#### 2. Dual Hebcal Library Support

**Why:** `@hebcal/core` is the modern library but may not be available in all installations.

**Solution:** Try `@hebcal/core` first, fall back to old `hebcal` library.

**Implementation:**
```javascript
try {
  HebcalCore = require('@hebcal/core');
  console.log('✓ @hebcal/core library loaded successfully');
} catch (err) {
  console.error('Failed to load @hebcal/core, trying old hebcal');
  try {
    Hebcal = require('hebcal');
    console.log('Using old hebcal library as fallback');
  } catch (fallbackErr) {
    console.error('Failed to load any hebcal library');
  }
}
```

#### 3. Two-Month Holiday Fetch

**Why:** Calendar may display dates from next month (especially in 4-week view).

**Solution:** Fetch holidays for current and next month.

**Implementation:**
```javascript
for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
  let targetMonth = month + monthOffset;
  // Handle year rollover
  if (targetMonth > 12) {
    targetMonth = 1;
    targetYear++;
  }
  // Fetch holidays for this month
}
```

**Benefits:**
- No missing holidays at month boundaries
- Smooth user experience
- Minimal extra API calls

#### 4. Intl.DateTimeFormat for Hebrew Dates

**Why:** Native browser API, no external dependencies for date conversion.

**Solution:** Use `Intl.DateTimeFormat` with Hebrew calendar extension.

**Implementation:**
```javascript
new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric' })
```

**Benefits:**
- No client-side hebcal dependency
- Automatically handles leap years
- Supports multiple locales (Hebrew, English)
- Browser-native (fast, reliable)

#### 5. CSS-Based Event Styling

**Why:** Flexible customization without code changes.

**Solution:** Apply CSS classes based on event categories.

**Implementation:**
```javascript
const cssClass = this.getHolidayCssClass(event.title);
div.classList.add(cssClass);
```

**Benefits:**
- Users can customize colors via CSS
- No need to modify JavaScript
- Consistent styling across events
- Easy to add new categories

#### 6. WebRTC for IP Detection

**Why:** Local IP address useful for network identification on MagicMirror.

**Solution:** Try WebRTC client-side, fall back to node_helper.

**Implementation:**
```javascript
const rtc = new RTCPeerConnection({iceServers: []});
rtc.createDataChannel('');
rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
rtc.onicecandidate = (event) => {
  // Extract IP from ICE candidate
};
```

**Benefits:**
- Fast client-side detection
- No external API calls
- Fallback ensures reliability
- Displays internal network IP

### Performance Considerations

#### Event Processing Throttling

The module uses a timer to batch event updates:

```javascript
self.updateTimer = setTimeout(() => {
  // Process all events
  self.updateDom();
}, 100);
```

**Purpose:** Avoid multiple DOM updates when receiving rapid events.

#### Hebrew Date Caching

Hebrew dates are calculated once per cell during rendering:

```javascript
const hebDay = getHebDayNumber(cellDate);
const hebMonthNumeric = getHebMonthNumber(cellDate);
// Reuse these values throughout cell rendering
```

**Purpose:** Avoid redundant Hebrew calendar calculations.

#### CSS for Visual Effects

Hardware-accelerated CSS properties used for smooth rendering:

```css
.cell {
  border-radius: 15px;      /* GPU-accelerated */
  box-shadow: 1px 1px ...;  /* GPU-accelerated */
  filter: brightness(97%);  /* GPU-accelerated */
}
```

### Error Handling

#### Graceful Degradation

If hebcal fails to load, the module continues working with Gregorian calendar only:

```javascript
if (!HebcalCore && !Hebcal) {
  console.error('Cannot fetch holidays: no hebcal library available');
  return; // Continue without Jewish holidays
}
```

#### Invalid Event Data

The module filters out corrupt events:

```javascript
if (!ev || typeof ev !== 'object' || !ev.title || !ev.date) {
  console.warn("Skipping corrupt event data:", ev);
  return null;
}
```

#### Missing Configuration

Default values ensure the module works without configuration:

```javascript
defaults: {
  mode: "FourWeeks",
  location: {
    latitude: 32.0853,
    longitude: 34.7818,
    name: "Tel Aviv",
    // ... full default location
  }
}
```

### Future Enhancement Possibilities

Based on the architecture, here are potential enhancements:

1. **Multi-year event caching** in node_helper
2. **Zmanim (prayer times)** using hebcal's zmanim API
3. **Daf Yomi (daily Talmud page)** from hebcal
4. **Omer counting** during Passover-Shavuot period
5. **Hebrew date display toggle** (show/hide Hebrew dates)
6. **Custom candle lighting offset** (e.g., 40 minutes in Jerusalem)
7. **Multiple location support** in single instance
8. **Holiday descriptions** on hover/click
9. **Export calendar** to iCal format
10. **Voice announcements** for upcoming events

---

## Troubleshooting Guide

### Common Issues

#### Issue: No Jewish Holidays Appearing

**Symptoms:** Calendar displays but no Jewish holidays show up.

**Causes and solutions:**

1. **Hebcal not installed:**
   ```bash
   cd ~/MagicMirror/modules/MMM-HebrewCalendar
   npm install
   ```

2. **Node helper not loading:**
   - Check terminal output (not browser console)
   - Look for: `"MMM-HebrewCalendar node_helper started"`
   - If missing, check file name is exactly `node_helper.js`

3. **Socket communication failed:**
   - Check for: `"MMM-HebrewCalendar node_helper received: GET_JEWISH_HOLIDAYS"`
   - If missing, restart MagicMirror

#### Issue: Wrong Holiday Times

**Symptoms:** Candle lighting or havdalah times incorrect.

**Solutions:**

1. **Check location coordinates:**
   - Verify latitude/longitude are correct
   - Use [latlong.net](https://www.latlong.net/) to verify

2. **Check timezone:**
   - Ensure timezone matches location
   - List: [IANA timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

3. **Check israelObservance:**
   - Set `true` for Israel, `false` for Diaspora
   - Affects candle lighting offset (18 vs varies)

#### Issue: Custom Events Not Appearing

**Symptoms:** Hebrew events from config don't show.

**Solutions:**

1. **Check month name spelling:**
   ```javascript
   // Correct
   hebrewMonth: "ניסן"  // Hebrew
   hebrewMonth: "Nisan" // English
   
   // Wrong
   hebrewMonth: "Nissan" // Misspelled
   ```

2. **Check month/day format:**
   ```javascript
   // Correct
   { name: "Birthday", hebrewMonth: "ניסן", hebrewDay: 5, type: "birthday" }
   
   // Wrong
   { name: "Birthday", month: "ניסן", day: 5, type: "birthday" } // Wrong keys
   ```

3. **Check event is within display range:**
   - Events only show if date falls within calendar view
   - Try `mode: "currentMonth"` to see full month

#### Issue: IP Address Shows "Fetching..." Forever

**Symptoms:** Bottom text shows "IP: Fetching..." permanently.

**Solutions:**

1. **WebRTC blocked:**
   - Some browsers block WebRTC
   - Should fall back to node_helper automatically after 3 seconds

2. **Network interfaces issue:**
   - Check node_helper logs for errors
   - May need to configure network adapter

3. **Disable if not needed:**
   ```javascript
   showBottomText: false
   ```

### Debugging Tips

#### Enable Debug Logging

Start MagicMirror with debug flag:
```bash
cd ~/MagicMirror
npm start -- --debug
```

#### Check Node Helper Logs

Node helper logs appear in **terminal**, not browser console:
```
Loading MMM-HebrewCalendar node_helper.js - global scope
✓ @hebcal/core library loaded successfully
✓ Default Tel Aviv location configured
MMM-HebrewCalendar node_helper started.
MMM-HebrewCalendar node_helper received: GET_JEWISH_HOLIDAYS
Fetching Jewish holidays for 2025/11 and next month
Using new @hebcal/core API for Israel-specific holidays and PARASHA
Processing 47 events for 2025/11
Found major holiday: Tue Nov 25 2025: חנוכה
```

#### Check Browser Console

Client-side logs appear in browser console (F12):
```
Loading MMM-HebrewCalendar.js
MMM-HebrewCalendar start() called.
Requesting Jewish holidays for 2025/11 and next month
MMM-HebrewCalendar client got socket: JEWISH_HOLIDAYS_RESULT
Adding Jewish holiday event: { title: "חנוכה", date: ... }
```

#### Verify Configuration

Log your config in start():
```javascript
start: function() {
  console.log("MMM-HebrewCalendar config:", JSON.stringify(this.config, null, 2));
  // ... rest of start()
}
```

---

## Conclusion

The MMM-HebrewCalendar module is a sophisticated integration of Hebrew calendar functionality into MagicMirror. Its architecture leverages the powerful hebcal library ecosystem while maintaining flexibility through extensive configuration options.

**Key takeaways:**

1. **Dual-library approach** ensures compatibility and robustness
2. **Location-based configuration** enables accurate Jewish times worldwide
3. **Client-server architecture** provides clean separation of concerns
4. **Extensive event categorization** allows detailed visual customization
5. **Native browser APIs** (Intl.DateTimeFormat) minimize dependencies
6. **Flexible styling system** enables user customization without code changes

Whether you're in Israel, the Diaspora, or anywhere in the world, the module can be configured to accurately display Jewish holidays, Torah portions, candle lighting times, and personal Hebrew date events.

For support, issues, or feature requests, visit the [GitHub repository](https://github.com/neshkoli/MMM-HebrewCalendar).

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Module Version:** 1.0.0  
**Hebcal Version:** @hebcal/core v5.9.8

