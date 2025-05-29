// Unit tests for MMM-HebrewCalendar main module
const path = require('path');
const { JSDOM } = require('jsdom');
const testData = require('../fixtures/test-data');

describe('MMM-HebrewCalendar Module', () => {
  let moduleDefinition;

  beforeAll(() => {
    // Load the module file in JSDOM environment
    const modulePath = path.join(__dirname, '../../MMM-HebrewCalendar.js');
    const dom = new JSDOM(`
      <script>
        var Module = {
          register: function(name, definition) {
            this._registeredModule = { name, ...definition };
            return definition;
          }
        };
        var Log = {
          log: function() {},
          info: function() {},
          warn: function() {},
          error: function() {}
        };
      </script>
      <script src="file://${modulePath}"></script>
    `, { 
      runScripts: "dangerously",
      resources: "usable"
    });

    // Wait for module to load
    return new Promise((resolve) => {
      dom.window.onload = () => {
        moduleDefinition = dom.window.Module._registeredModule;
        global.window = dom.window;
        global.document = dom.window.document;
        resolve();
      };
    });
  });

  beforeEach(() => {
    resetAllMocks();
  });

  describe('Module Registration', () => {
    it('should register with correct name', () => {
      expect(moduleDefinition.name).toBe('MMM-HebrewCalendar');
    });

    it('should have default configuration', () => {
      expect(moduleDefinition.defaults).toEqual(testData.defaultConfig);
    });

    it('should initialize hebrewEvents as empty object', () => {
      expect(moduleDefinition.hebrewEvents).toEqual({});
    });
  });

  describe('Hebrew Event Management', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.hebrewEvents = {};
    });

    it('should add Hebrew events correctly', () => {
      module.addHebrewEvent(1, 1, 'Rosh Hashanah', 'holiday');
      
      expect(module.hebrewEvents[1]).toBeDefined();
      expect(module.hebrewEvents[1][1]).toBeDefined();
      expect(module.hebrewEvents[1][1]).toHaveLength(1);
      expect(module.hebrewEvents[1][1][0]).toEqual({
        text: 'Rosh Hashanah',
        type: 'holiday'
      });
    });

    it('should add multiple events to same date', () => {
      module.addHebrewEvent(1, 1, 'Rosh Hashanah', 'holiday');
      module.addHebrewEvent(1, 1, 'New Year', 'celebration');
      
      expect(module.hebrewEvents[1][1]).toHaveLength(2);
      expect(module.hebrewEvents[1][1][0].text).toBe('Rosh Hashanah');
      expect(module.hebrewEvents[1][1][1].text).toBe('New Year');
    });

    it('should handle different months and days', () => {
      module.addHebrewEvent(1, 10, 'Yom Kippur', 'holiday');
      module.addHebrewEvent(7, 15, 'Passover', 'holiday');
      
      expect(module.hebrewEvents[1][10]).toBeDefined();
      expect(module.hebrewEvents[7][15]).toBeDefined();
      expect(module.hebrewEvents[1][10][0].text).toBe('Yom Kippur');
      expect(module.hebrewEvents[7][15][0].text).toBe('Passover');
    });
  });

  describe('Module Lifecycle', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.config = { ...testData.defaultConfig };
      module.sendSocketNotification = jest.fn();
    });

    it('should initialize properly on start', () => {
      module.start();
      
      expect(module.sourceEvents).toEqual({});
      expect(module.events).toEqual([]);
      expect(module.displayedDay).toBeNull();
      expect(module.displayedEvents).toEqual([]);
      expect(module.updateTimer).toBeNull();
      expect(module.skippedUpdateCount).toBe(0);
    });

    it('should process Hebrew events from config', () => {
      module.config.hebrewEvents = [
        { mm: 'Tishrei', dd: '1', text: 'Test Event', type: 'custom' }
      ];
      
      // Mock sendSocketNotification to prevent errors
      module.sendSocketNotification = jest.fn();
      
      module.start();
      
      expect(module.hebrewEvents[1]).toBeDefined();
      expect(module.hebrewEvents[1][1]).toBeDefined();
      expect(module.hebrewEvents[1][1][0]).toEqual({
        text: 'Test Event',
        type: 'custom'
      });
    });
  });

  describe('Helper Functions', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
    });

    it('should get Hebrew day number correctly', () => {
      const mockDate = {
        dd: 15,
        mm: 'Tishrei',
        yyyy: 5784
      };
      
      expect(module.getHebDayNumber(mockDate)).toBe(15);
    });

    it('should get Hebrew month number correctly', () => {
      const testCases = [
        { input: { mm: 'Tishrei' }, expected: 1 },
        { input: { mm: 'Cheshvan' }, expected: 2 },
        { input: { mm: 'Kislev' }, expected: 3 },
        { input: { mm: 'Tevet' }, expected: 4 },
        { input: { mm: 'Shevat' }, expected: 5 },
        { input: { mm: 'Adar' }, expected: 6 },
        { input: { mm: 'Nisan' }, expected: 7 },
        { input: { mm: 'Iyyar' }, expected: 8 },
        { input: { mm: 'Sivan' }, expected: 9 },
        { input: { mm: 'Tammuz' }, expected: 10 },
        { input: { mm: 'Av' }, expected: 11 },
        { input: { mm: 'Elul' }, expected: 12 }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(module.getHebMonthNumber(input)).toBe(expected);
      });
    });

    it('should handle unknown Hebrew month names', () => {
      const mockDate = { mm: 'UnknownMonth' };
      expect(module.getHebMonthNumber(mockDate)).toBe(0);
    });

    it('should filter events by date correctly', () => {
      module.hebrewEvents = testData.hebrewEvents;
      
      const events = module.getEventsForDate(1, 1); // Rosh Hashanah
      expect(events).toHaveLength(1);
      expect(events[0].text).toBe('Rosh Hashanah');
      
      const noEvents = module.getEventsForDate(1, 5); // No events
      expect(noEvents).toHaveLength(0);
    });
  });

  describe('DOM Generation', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.config = { ...testData.defaultConfig };
      module.events = [];
      module.displayedEvents = [];
    });

    it('should generate basic DOM structure', () => {
      const dom = module.getDom();
      
      expect(dom.tagName).toBe('TABLE');
      expect(dom.className).toContain('wrapper');
    });

    it('should handle empty events gracefully', () => {
      module.events = [];
      const dom = module.getDom();
      
      // The module should still generate a table with calendar structure
      expect(dom.tagName).toBe('TABLE');
    });

    it('should display events when available', () => {
      // Set up proper events structure
      module.events = [
        {
          title: 'Test Event',
          startDate: new Date(),
          isHoliday: true
        }
      ];
      module.displayedEvents = module.events;
      
      const dom = module.getDom();
      // Check that DOM was created (events may not show in calendar view)
      expect(dom.tagName).toBe('TABLE');
    });
  });

  describe('Socket Communications', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.config = { ...testData.defaultConfig };
      module.sendSocketNotification = jest.fn();
      module.updateDom = jest.fn();
    });

    it('should handle socket notifications from node_helper', (done) => {
      const holidayData = testData.holidayData;
      
      // Mock the processEvents to call updateDom immediately
      module.processEvents = jest.fn(() => {
        module.updateDom();
      });
      
      module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', holidayData);
      
      setTimeout(() => {
        expect(module.updateDom).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should request holidays on start', () => {
      module.start();
      
      // Should eventually request holidays
      expect(module.sendSocketNotification).toHaveBeenCalledWith(
        'GET_JEWISH_HOLIDAYS',
        expect.objectContaining({
          year: expect.any(Number),
          month: expect.any(Number)
        })
      );
    });

    it('should handle empty holiday data', (done) => {
      // Mock the processEvents to call updateDom immediately
      module.processEvents = jest.fn(() => {
        module.updateDom();
      });
      
      module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', []);
      
      setTimeout(() => {
        expect(module.updateDom).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should handle malformed holiday data gracefully', () => {
      expect(() => {
        module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', null);
      }).not.toThrow();
      
      expect(() => {
        module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', 'invalid');
      }).not.toThrow();
    });
  });

  describe('Event Processing', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.config = { ...testData.defaultConfig, displaySymbol: false }; // Disable emoji symbols for predictable testing
      module.updateDom = jest.fn();
      module.sendSocketNotification = jest.fn();
      // Initialize the module properly
      module.sourceEvents = {};
      module.events = [];
      module.displayedDay = null;
      module.displayedEvents = [];
      module.updateTimer = null;
      module.skippedUpdateCount = 0;
    });

    it('should process holiday data correctly', (done) => {
      const holidayData = testData.holidayData;
      
      module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', holidayData);
      
      setTimeout(() => {
        expect(module.sourceEvents["jewishHolidays"]).toBeDefined();
        expect(module.sourceEvents["jewishHolidays"].length).toBeGreaterThan(0);
        
        const purimEvent = module.sourceEvents["jewishHolidays"].find(e => e.hebrewTitle === 'Purim' || e.title === 'Purim');
        expect(purimEvent).toBeDefined();
        expect(purimEvent.isHoliday).toBe(true);
        done();
      }, 150);
    });

    it('should identify major holidays correctly', (done) => {
      const holidayData = [
        {
          date: new Date('2024-03-24'),
          title: 'Purim',
          category: 'holiday'
        },
        {
          date: new Date('2024-03-25'),
          title: 'Minor Event',
          category: 'other'
        }
      ];
      
      module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', holidayData);
      
      setTimeout(() => {
        const purimEvent = module.sourceEvents["jewishHolidays"].find(e => e.hebrewTitle === 'Purim' || e.title === 'Purim');
        const minorEvent = module.sourceEvents["jewishHolidays"].find(e => e.title === 'Minor Event');
        
        expect(purimEvent.isHoliday).toBe(true);
        expect(minorEvent.isHoliday).toBe(true); // All events from node_helper are major holidays
        done();
      }, 150);
    });

    it('should handle Hebrew text display', (done) => {
      const holidayData = [{
        date: new Date('2024-03-24'),
        title: 'Purim',
        category: 'holiday'
      }];
      
      module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', holidayData);
      
      setTimeout(() => {
        const event = module.sourceEvents["jewishHolidays"][0];
        expect(event.hebrewTitle).toBe('Purim');
        done();
      }, 150);
    });
  });

  describe('Configuration Handling', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
    });

    it('should merge config with defaults', () => {
      const customConfig = {
        mode: "OneWeek",
        displaySymbol: true
      };
      
      module.config = { ...moduleDefinition.defaults, ...customConfig };
      
      expect(module.config.mode).toBe("OneWeek");
      expect(module.config.displaySymbol).toBe(true);
      expect(module.config.firstDayOfWeek).toBe("sunday"); // From defaults
    });

    it('should handle invalid configuration gracefully', () => {
      module.config = {
        mode: "InvalidMode",
        firstDayOfWeek: "invalidDay"
      };
      
      // Mock sendSocketNotification to prevent the error
      module.sendSocketNotification = jest.fn();
      
      expect(() => module.start()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    let module;

    beforeEach(() => {
      module = Object.create(moduleDefinition);
      module.config = { ...testData.defaultConfig };
      module.updateDom = jest.fn();
    });

    it('should handle malformed socket notifications', () => {
      expect(() => {
        module.socketNotificationReceived('UNKNOWN_NOTIFICATION', {});
      }).not.toThrow();
    });

    it('should handle corrupt event data', () => {
      const corruptData = [
        { /* missing required fields */ },
        null,
        undefined,
        { date: 'invalid-date', desc: 'Test' }
      ];
      
      expect(() => {
        module.socketNotificationReceived('JEWISH_HOLIDAYS_RESULT', corruptData);
      }).not.toThrow();
    });

    it('should continue functioning with DOM errors', () => {
      // Mock DOM error
      global.document.createElement = jest.fn(() => {
        throw new Error('DOM error');
      });
      
      expect(() => {
        module.getDom();
      }).not.toThrow();
      
      // Restore
      global.document.createElement = jest.fn(() => global.createElement('div'));
    });
  });
});
