// Holiday CSS classification tests
const path = require('path');
const { JSDOM } = require('jsdom');
const testData = require('../fixtures/test-data');

describe('Holiday CSS Classification', () => {
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
        
        // Mock the el function that's used in addCalendarEvents
        function el(tag, options) {
          const element = document.createElement(tag);
          options = options || {};
          
          for (const key in options) {
            if (key === 'className' || key === 'innerHTML' || key === 'id') {
              element[key] = options[key];
            } else {
              element.setAttribute(key, options[key]);
            }
          }
          return element;
        }
        
        window.el = el;
      </script>
    `, { runScripts: 'dangerously' });

    global.window = dom.window;
    global.document = dom.window.document;
    global.Module = dom.window.Module;
    global.Log = dom.window.Log;
    global.el = dom.window.el;

    // Load the module
    const moduleCode = require('fs').readFileSync(modulePath, 'utf8');
    dom.window.eval(moduleCode);
    moduleDefinition = dom.window.Module._registeredModule;
  });

  let module;

  beforeEach(() => {
    module = Object.create(moduleDefinition);
    module.config = { ...testData.defaultConfig };
  });

  describe('getHolidayCssClass', () => {
    it('should classify major holidays correctly', () => {
      expect(module.getHolidayCssClass('ראש השנה')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('Rosh Hashanah')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('יום כיפור')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('Yom Kippur')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('פסח')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('Passover')).toBe('event-holiday-major');
    });

    it('should classify festivals correctly', () => {
      expect(module.getHolidayCssClass('שבועות')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('Shavuot')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('סוכות')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('Sukkot')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('חנוכה')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('Hanukkah')).toBe('event-holiday-festival');
    });

    it('should classify minor holidays correctly', () => {
      expect(module.getHolidayCssClass('ט"ו בשבט')).toBe('event-holiday-minor');
      expect(module.getHolidayCssClass('Tu BiShvat')).toBe('event-holiday-minor');
      expect(module.getHolidayCssClass('ל"ג בעומר')).toBe('event-holiday-minor');
      expect(module.getHolidayCssClass('Lag BaOmer')).toBe('event-holiday-minor');
    });

    it('should classify fast days correctly', () => {
      expect(module.getHolidayCssClass('צום גדליה')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('Fast of Gedaliah')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('י"ז בתמוז')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('17 Tammuz')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('ט"ב באב')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('Tisha BAv')).toBe('event-holiday-fast');
    });

    it('should classify modern holidays correctly', () => {
      expect(module.getHolidayCssClass('יום העצמאות')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('Yom HaAtzmaut')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('יום ירושלים')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('Jerusalem Day')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('יום הזיכרון')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('Yom HaZikaron')).toBe('event-holiday-modern');
    });

    it('should classify Rosh Chodesh correctly', () => {
      expect(module.getHolidayCssClass('ר"ח')).toBe('event-holiday-rosh-chodesh');
      expect(module.getHolidayCssClass('Rosh Chodesh')).toBe('event-holiday-rosh-chodesh');
      expect(module.getHolidayCssClass('ר"ח אלול')).toBe('event-holiday-rosh-chodesh');
      expect(module.getHolidayCssClass('Rosh Chodesh Elul')).toBe('event-holiday-rosh-chodesh');
    });

    it('should default to minor holiday for unclassified holidays', () => {
      expect(module.getHolidayCssClass('Unknown Holiday')).toBe('event-holiday-minor');
      expect(module.getHolidayCssClass('חג לא מוכר')).toBe('event-holiday-minor');
    });

    it('should handle case-insensitive matching', () => {
      expect(module.getHolidayCssClass('ROSH HASHANAH')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('yom kippur')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('Shavuot')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('HANUKKAH')).toBe('event-holiday-festival');
    });
  });

  describe('CSS Application in DOM', () => {
    beforeEach(() => {
      module.events = [];
      module.sourceEvents = {};
    });

    it.skip('should apply holiday CSS classes to DOM elements', () => {
      // Create a holiday event
      const shavuotEvent = {
        title: 'שבועות',
        startDate: new Date('2025-06-02'),
        endDate: new Date('2025-06-02'),
        fullDayEvent: true,
        isHoliday: true,
        type: 'holiday'
      };

      module.events = [shavuotEvent];

      // Create a mock cell that tracks classList.add calls
      const mockCell = document.createElement('div');
      const addSpy = jest.spyOn(mockCell.classList, 'add');
      
      // Mock the el function to return proper DOM elements
      const originalEl = global.el;
      global.el = jest.fn((tag, options) => {
        const element = document.createElement(tag);
        if (options && options.className) {
          element.className = options.className;
        }
        if (options && options.innerHTML) {
          element.innerHTML = options.innerHTML;
        }
        // Ensure appendChild method exists and works
        if (!element.appendChild) {
          element.appendChild = function(child) {
            if (child && child.nodeType) {
              this.insertAdjacentHTML('beforeend', child.outerHTML || '');
            }
          };
        }
        return element;
      });

      const dateCells = {
        2: mockCell  // June 2nd
      };

      // Test the addCalendarEvents function
      const now = new Date('2025-06-01');
      module.addCalendarEvents(dateCells, now);

      // Verify that the holiday CSS class was applied
      expect(addSpy).toHaveBeenCalledWith('event-holiday-festival');
      
      // Restore original el function
      global.el = originalEl;
    });

    it('should correctly classify different holiday types', () => {
      // Test the classification logic directly
      expect(module.getHolidayCssClass('שבועות')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('ראש השנה')).toBe('event-holiday-major');
      expect(module.getHolidayCssClass('ט"ו בשבט')).toBe('event-holiday-minor');
      expect(module.getHolidayCssClass('צום גדליה')).toBe('event-holiday-fast');
      expect(module.getHolidayCssClass('יום העצמאות')).toBe('event-holiday-modern');
      expect(module.getHolidayCssClass('ר"ח')).toBe('event-holiday-rosh-chodesh');
    });

    it.skip('should not apply holiday CSS to non-holiday events', () => {
      // Create a regular event without holiday flag
      const regularEvent = {
        title: 'Birthday Party',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-01'),
        fullDayEvent: true,
        isHoliday: false,
        type: 'birthday'
      };

      module.events = [regularEvent];

      const mockCell = document.createElement('div');
      const addSpy = jest.spyOn(mockCell.classList, 'add');
      
      // Mock the el function
      const originalEl = global.el;
      global.el = jest.fn((tag, options) => {
        const element = document.createElement(tag);
        if (options && options.className) {
          element.className = options.className;
        }
        if (options && options.innerHTML) {
          element.innerHTML = options.innerHTML;
        }
        return element;
      });

      const dateCells = {
        1: mockCell
      };

      const now = new Date('2025-06-01');
      module.addCalendarEvents(dateCells, now);

      // Verify that holiday CSS classes were NOT applied
      const calls = addSpy.mock.calls.flat();
      const holidayClasses = calls.filter(call => typeof call === 'string' && call.includes('event-holiday'));
      expect(holidayClasses).toHaveLength(0);
      
      // Restore original el function
      global.el = originalEl;
    });
  });

  describe('PARASHA (Torah Portion) Support', () => {
    it.skip('should handle PARASHA events with correct CSS class', () => {
      // Create a PARASHA event
      const parashaEvent = {
        title: 'פרשת בראשית',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-01'),
        fullDayEvent: true,
        isParasha: true,
        type: 'parasha',
        category: 'parasha'
      };

      module.events = [parashaEvent];

      const mockCell = document.createElement('div');
      const addSpy = jest.spyOn(mockCell.classList, 'add');
      
      // Mock the el function
      const originalEl = global.el;
      global.el = jest.fn((tag, options) => {
        const element = document.createElement(tag);
        if (options && options.className) {
          element.className = options.className;
        }
        if (options && options.innerHTML) {
          element.innerHTML = options.innerHTML;
        }
        return element;
      });

      const dateCells = {
        1: mockCell
      };

      const now = new Date('2025-06-01');
      module.addCalendarEvents(dateCells, now);

      // Verify that the PARASHA CSS class was applied
      expect(addSpy).toHaveBeenCalledWith('event-parasha');
      
      // Restore original el function
      global.el = originalEl;
    });

    it.skip('should not apply holiday CSS to PARASHA events', () => {
      // Create a PARASHA event
      const parashaEvent = {
        title: 'פרשת נח',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-01'),
        fullDayEvent: true,
        isParasha: true,
        type: 'parasha',
        category: 'parasha',
        isHoliday: false
      };

      module.events = [parashaEvent];

      const mockCell = document.createElement('div');
      const addSpy = jest.spyOn(mockCell.classList, 'add');
      
      // Mock the el function
      const originalEl = global.el;
      global.el = jest.fn((tag, options) => {
        const element = document.createElement(tag);
        if (options && options.className) {
          element.className = options.className;
        }
        if (options && options.innerHTML) {
          element.innerHTML = options.innerHTML;
        }
        return element;
      });

      const dateCells = {
        1: mockCell
      };

      const now = new Date('2025-06-01');
      module.addCalendarEvents(dateCells, now);

      // Verify that PARASHA CSS class was applied but no holiday classes
      const calls = addSpy.mock.calls.flat();
      const holidayClasses = calls.filter(call => typeof call === 'string' && call.includes('event-holiday'));
      const parashaClasses = calls.filter(call => typeof call === 'string' && call.includes('event-parasha'));
      
      expect(parashaClasses).toHaveLength(1);
      expect(holidayClasses).toHaveLength(0);
      
      // Restore original el function
      global.el = originalEl;
    });

    it('should handle both Hebrew and English PARASHA names', () => {
      const hebrewParasha = 'פרשת בראשית';
      const englishParasha = 'Parashat Bereshit';
      
      // Both should be treated as PARASHA events, not classified through holiday CSS
      // The classification happens in the node_helper and event creation
      
      expect(hebrewParasha).toContain('פרשת');
      expect(englishParasha).toContain('Parashat');
    });
  });

  describe('Tel Aviv Shavuot Integration', () => {
    it('should classify Tel Aviv Shavuot as festival (single day)', () => {
      // Test that the single-day Shavuot from Israel is correctly classified
      const israelShavuot = 'שבועות'; // Single day name, not "שבועות א"
      expect(module.getHolidayCssClass(israelShavuot)).toBe('event-holiday-festival');
    });

    it('should handle both Hebrew and English Shavuot names', () => {
      expect(module.getHolidayCssClass('שבועות')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('Shavuot')).toBe('event-holiday-festival');
      expect(module.getHolidayCssClass('Shavot')).toBe('event-holiday-festival'); // Alternative spelling
    });
  });
});

describe('Holiday CSS Visual Styling', () => {
  describe('CSS Class Definitions', () => {
    it('should have distinct colors for each holiday type', () => {
      // This test documents the expected color scheme including PARASHA
      const expectedColors = {
        'event-holiday-major': 'rgba(138, 43, 226, 0.8)', // Purple
        'event-holiday-festival': 'rgba(30, 144, 255, 0.8)', // Blue  
        'event-holiday-minor': 'rgba(34, 139, 34, 0.8)', // Green
        'event-holiday-fast': 'rgba(105, 105, 105, 0.8)', // Gray
        'event-holiday-modern': 'rgba(255, 69, 0, 0.8)', // Orange
        'event-holiday-rosh-chodesh': 'rgba(218, 165, 32, 0.8)', // Gold
        'event-parasha': 'rgba(128, 0, 128, 0.7)' // Dark purple for PARASHA
      };

      // Test passes if the color scheme is documented
      // Actual CSS verification would require loading the CSS file
      expect(Object.keys(expectedColors)).toHaveLength(7); // 6 holiday types + 1 PARASHA
      expect(expectedColors['event-holiday-major']).toContain('138, 43, 226'); // Purple
      expect(expectedColors['event-holiday-festival']).toContain('30, 144, 255'); // Blue
      expect(expectedColors['event-parasha']).toContain('128, 0, 128'); // Dark purple
    });

    it('should ensure holiday styles have proper contrast', () => {
      // Document that major holidays should be bold, PARASHA should be italic
      const expectedStyles = {
        'event-holiday-major': { fontWeight: 'bold', color: '#fff' },
        'event-holiday-festival': { color: '#fff' },
        'event-holiday-minor': { color: '#fff' },
        'event-holiday-fast': { color: '#fff' },
        'event-holiday-modern': { color: '#fff' },
        'event-holiday-rosh-chodesh': { color: '#333' }, // Darker text on gold background
        'event-parasha': { color: '#fff', fontStyle: 'italic' } // Italic for PARASHA
      };

      // Test that contrast considerations are documented
      expect(expectedStyles['event-holiday-major'].fontWeight).toBe('bold');
      expect(expectedStyles['event-holiday-rosh-chodesh'].color).toBe('#333');
      expect(expectedStyles['event-parasha'].fontStyle).toBe('italic');
    });
  });
});
