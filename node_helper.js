console.log('Loading MMM-HebrewCalendar node_helper.js - global scope');

// catch any startup exceptions
process.on('uncaughtException', err => {
  console.error('MMM-HebrewCalendar node_helper uncaughtException:', err);
});

const NodeHelper = require('node_helper');
let Hebcal;
let HebcalCore;
let Location;
let defaultLocation;

try {
  // Load new @hebcal/core library
  HebcalCore = require('@hebcal/core');
  const { Location: LocationClass, getHolidaysOnDate, HebrewCalendar } = HebcalCore;
  Location = LocationClass;
  
  // Set up default Tel Aviv location for Israel-specific observance
  defaultLocation = new Location(32.0853, 34.7818, true, 'Asia/Jerusalem', 'Tel Aviv', 'IL');
  console.log('✓ @hebcal/core library loaded successfully');
  console.log('✓ Default Tel Aviv location configured for Israel observance');
  
  // Keep old hebcal as fallback
  try {
    Hebcal = require('hebcal');
    console.log('✓ Old hebcal library available as fallback');
  } catch (fallbackErr) {
    console.log('Old hebcal not available (this is fine)');
  }
  
} catch (err) {
  console.error('Failed to load @hebcal/core, trying old hebcal library:', err);
  try {
    Hebcal = require('hebcal');
    console.log('Using old hebcal library as fallback');
    
    // Set default location to Tel Aviv using explicit coordinates (old API)
    Hebcal.location = {
      latitude: 32.0853,
      longitude: 34.7818,
      cc: 'IL',
      tzid: 'Asia/Jerusalem'
    };
    console.log(`Hebcal location set to Tel Aviv (old API)`);
  } catch (fallbackErr) {
    console.error('Failed to load any hebcal library:', fallbackErr);
  }
}

module.exports = NodeHelper.create({
  start: function () {
    try {
      console.log('MMM-HebrewCalendar node_helper started.');
      this.started = true;
    } catch (err) {
      console.error('Error in node_helper start():', err);
      this.started = false;
    }
  },

  socketNotificationReceived: function (notification, payload) {
    console.log('MMM-HebrewCalendar node_helper received:', notification, payload);
    if (notification === 'GET_JEWISH_HOLIDAYS') {
      if (!HebcalCore && !Hebcal) {
        console.error('Cannot fetch holidays: no hebcal library available');
        return;
      }
      
      try {
        const { year, month, location: configLocation } = payload;
        console.log(`Fetching Jewish holidays (major holidays only, Hebrew) for ${year}/${month} and next month`);
        
        // Create location object from config or use default
        let currentLocation;
        if (HebcalCore && Location) {
          if (configLocation) {
            currentLocation = new Location(
              configLocation.latitude, 
              configLocation.longitude, 
              configLocation.israelObservance, 
              configLocation.timezone, 
              configLocation.name, 
              configLocation.countryCode
            );
            console.log(`Using configured location: ${configLocation.name} (${configLocation.latitude}, ${configLocation.longitude})`);
          } else {
            currentLocation = defaultLocation;
            console.log('Using default Tel Aviv location');
          }
        }
        
        let holidays = [];
        
        // Use new @hebcal/core if available
        if (HebcalCore && HebcalCore.getHolidaysOnDate) {
          console.log('Using new @hebcal/core API for Israel-specific holidays and PARASHA');
          
          // Process current month and next month
          for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
            let targetMonth = month + monthOffset;
            let targetYear = year;
            
            // Handle December to January transition
            if (targetMonth > 12) {
              targetMonth = 1;
              targetYear++;
            }

            // Get all events for the month including PARASHA and candle lighting times
            const monthlyOptions = {
              year: targetYear,
              month: targetMonth,
              location: currentLocation,
              isHebrewYear: false,
              candlelighting: true,    // Enable candle lighting times
              havdalah: true,          // Enable havdalah times
              sedrot: true,            // Enable PARASHA (Torah portions)
              omer: false,
              locale: 'he',            // Hebrew locale
              il: configLocation ? configLocation.israelObservance : true // Use config or default to Israel observance
            };

            const monthlyEvents = HebcalCore.HebrewCalendar.calendar(monthlyOptions);
            console.log(`Processing ${monthlyEvents.length} events for ${targetYear}/${targetMonth}`);

            monthlyEvents.forEach(event => {
              const date = event.getDate().greg();
              const categories = event.getCategories();
              const desc = event.getDesc();
              
              // Check if it's a major holiday
              const isMajorHoliday = categories.includes('major') || 
                                    categories.includes('yomtov') ||
                                    categories.includes('holiday');
              
              // Check if it's a PARASHA (Torah portion)
              const isParasha = categories.includes('parashat') || 
                              desc.includes('Parashat') ||
                              desc.includes('פרשת');
              
              // Check if it's candle lighting
              const isCandleLighting = categories.includes('candles') ||
                                     desc.includes('Candle lighting') ||
                                     desc.includes('הדלקת נרות');
              
              // Check if it's havdalah
              const isHavdalah = categories.includes('havdalah') ||
                               desc.includes('Havdalah') ||
                               desc.includes('הבדלה');
              
              if (isMajorHoliday) {
                // Use Hebrew rendering for Hebrew title
                const hebrewTitle = event.render('he');
                
                holidays.push({
                  title: hebrewTitle,
                  date: date,
                  category: 'holiday'
                });
                console.log(`Found major holiday (Israel observance, Hebrew): ${date.toDateString()}: ${hebrewTitle}`);
              } else if (isParasha) {
                // Use Hebrew rendering for PARASHA title
                const hebrewTitle = event.render('he');
                // Remove "פָּרָשַׁת" prefix (with vowel points) to keep only the Parasha name
                const cleanTitle = hebrewTitle.replace(/^פָּרָשַׁת\s+/, '').replace(/^פרשת\s+/, '').replace(/^Parashat\s+/, '');
                
                holidays.push({
                  title: cleanTitle,
                  date: date,
                  category: 'parasha'
                });
                console.log(`Found PARASHA (Torah portion): ${date.toDateString()}: ${cleanTitle}`);
              } else if (isCandleLighting) {
                // Handle candle lighting times
                const hebrewTitle = event.render('he');
                // Extract just the Hebrew text without time (e.g., "הדלקת נרות" from "הדלקת נרות: 18:15")
                const cleanTitle = hebrewTitle.split(':')[0].trim();
                // Extract time from eventTime Date object
                const timeString = event.eventTime ? 
                  `${event.eventTime.getHours()}:${event.eventTime.getMinutes().toString().padStart(2, '0')}` : null;
                
                holidays.push({
                  title: cleanTitle,
                  date: date,
                  category: 'candles',
                  time: timeString
                });
                console.log(`Found candle lighting: ${date.toDateString()}: ${cleanTitle} at ${timeString}`);
              } else if (isHavdalah) {
                // Handle havdalah times
                const hebrewTitle = event.render('he');
                // Extract just the Hebrew text without time (e.g., "הַבְדָּלָה" from "הַבְדָּלָה: 20:34")
                const cleanTitle = hebrewTitle.split(':')[0].trim();
                // Extract time from eventTime Date object
                const timeString = event.eventTime ? 
                  `${event.eventTime.getHours()}:${event.eventTime.getMinutes().toString().padStart(2, '0')}` : null;
                
                holidays.push({
                  title: cleanTitle,
                  date: date,
                  category: 'havdalah',
                  time: timeString
                });
                console.log(`Found havdalah: ${date.toDateString()}: ${cleanTitle} at ${timeString}`);
              }
            });
          }
        } else {
          // Fallback to old API
          console.log('Using old hebcal API (fallback)');
          
          // Update old API location if configured
          if (configLocation && Hebcal) {
            Hebcal.location = {
              latitude: configLocation.latitude,
              longitude: configLocation.longitude,
              cc: configLocation.countryCode,
              tzid: configLocation.timezone
            };
            console.log(`Updated Hebcal location to: ${configLocation.name} (${configLocation.latitude}, ${configLocation.longitude})`);
          } else if (Hebcal) {
            console.log('Using default Tel Aviv location (old API)');
          }
          
          // Process current month and next month
          for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
            // Calculate year and month with offset
            let targetMonth = month + monthOffset;
            let targetYear = year;
            
            // Handle December to January transition
            if (targetMonth > 12) {
              targetMonth = 1;
              targetYear++;
            }
            
            const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
            console.log(`Processing ${daysInMonth} days for ${targetYear}/${targetMonth}`);
            
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(targetYear, targetMonth-1, day);
              // Instantiate HDate with date only, then set .il property
              const hdate = new Hebcal.HDate(date); 
              hdate.il = configLocation ? configLocation.israelObservance : true; // Use config or default to Israel observance
              // holidays() method takes no arguments
              const dayHolidays = hdate.holidays(); 
              
              if (dayHolidays && dayHolidays.length > 0) {
                dayHolidays.forEach(holiday => {
                  // Check if it's a major holiday by looking for candle lighting or yom tov properties
                  const isMajorHoliday = holiday.LIGHT_CANDLES || holiday.LIGHT_CANDLES_TZEIS || holiday.YOM_TOV_ENDS;
                  
                  if (isMajorHoliday) {
                    // Use the 'hebrew' property for the Hebrew title
                    const hebrewTitle = holiday.hebrew || holiday.desc[2]; 
                    
                    holidays.push({
                      title: hebrewTitle,
                      date: date,
                      category: 'holiday'
                    });
                    console.log(`Found major holiday (Israel observance, Hebrew): ${date.toDateString()}: ${hebrewTitle}`);
                  }
                });
              }
            }
          }
        }
        
        console.log(`Sending ${holidays.length} Jewish major holidays for current and next month`);
        this.sendSocketNotification('JEWISH_HOLIDAYS_RESULT', holidays);
      } catch (err) {
        console.error('Error processing Jewish holidays:', err);
        this.sendSocketNotification('JEWISH_HOLIDAYS_ERROR', err.message);
      }
    }
  }
});
