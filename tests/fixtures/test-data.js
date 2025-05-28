// Test fixtures for MMM-HebrewCalendar
module.exports = {
  // Sample Hebrew calendar events
  hebrewEvents: {
    1: { // Tishrei
      1: [{ text: 'Rosh Hashanah', type: 'holiday' }],
      10: [{ text: 'Yom Kippur', type: 'holiday' }],
      15: [{ text: 'Sukkot begins', type: 'holiday' }]
    },
    7: { // Nisan
      15: [{ text: 'Passover begins', type: 'holiday' }],
      27: [{ text: 'Yom HaShoah', type: 'memorial' }]
    },
    12: { // Adar
      14: [{ text: 'Purim', type: 'holiday' }]
    }
  },

  // Sample holiday data from hebcal (matching node_helper output format)
  holidayData: [
    {
      date: new Date('2024-03-24'),
      title: 'Purim',
      category: 'holiday'
    },
    {
      date: new Date('2024-04-23'),
      title: 'Passover I',
      category: 'holiday'
    },
    {
      date: new Date('2024-05-14'),
      title: 'Erev Shavuot',
      category: 'holiday'
    }
  ],

  // Sample module config
  defaultConfig: {
    mode: "FourWeeks",
    firstDayOfWeek: "sunday",
    displaySymbol: true,
    wrapTitles: true,
    hideCalendars: [],
    hebrewEvents: [],
    // Location configuration (defaults to Tel Aviv, Israel)
    location: {
      latitude: 32.0853,
      longitude: 34.7818,
      name: "Tel Aviv",
      countryCode: "IL",
      timezone: "Asia/Jerusalem",
      israelObservance: true
    }
  },

  // Sample DOM structure
  expectedDomStructure: {
    className: 'mmm-hebrew-calendar',
    children: [
      { tag: 'div', className: 'calendar-header' },
      { tag: 'div', className: 'calendar-body' },
      { tag: 'div', className: 'hebrew-events' }
    ]
  }
};
