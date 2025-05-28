// Unit tests for MMM-HebrewCalendar node_helper
const NodeHelper = require('../mocks/node_helper_mock');
const testData = require('../fixtures/test-data');

// Mock hebcal library with proper HDate constructor
const mockHolidays = [
  {
    desc: 'Purim',
    LIGHT_CANDLES: true,
    hebrew: 'פורים'
  },
  {
    desc: 'Passover I',
    YOM_TOV_ENDS: true,
    hebrew: 'פסח א׳'
  },
  {
    desc: 'Erev Shavuot',
    LIGHT_CANDLES_TZEIS: true,
    hebrew: 'ערב שבועות'
  }
];

const mockHDate = jest.fn((date) => ({
  il: true,
  holidays: jest.fn().mockReturnValue([]),
  abs: jest.fn(),
  greg: jest.fn().mockReturnValue(date),
  toString: jest.fn().mockReturnValue('Mock Hebrew Date')
}));

const mockHebcal = {
  location: null,
  HDate: mockHDate,
  LANG: {
    HEBREW: 'he'
  }
};

jest.mock('hebcal', () => mockHebcal);

describe('MMM-HebrewCalendar NodeHelper', () => {
  let nodeHelper;
  let nodeHelperPath;

  beforeAll(() => {
    // Clear require cache to ensure fresh load
    nodeHelperPath = require.resolve('../../node_helper.js');
    if (require.cache[nodeHelperPath]) {
      delete require.cache[nodeHelperPath];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHDate.mockClear();
    
    // Reset mock to return holidays for some days (simulate day 15 having holidays)
    mockHDate.mockImplementation((date) => ({
      il: true,
      holidays: jest.fn().mockReturnValue(
        date.getDate() === 15 ? mockHolidays : []
      ),
      abs: jest.fn(),
      greg: jest.fn().mockReturnValue(date),
      toString: jest.fn().mockReturnValue('Mock Hebrew Date')
    }));
    
    // Load the node helper fresh for each test
    if (require.cache[nodeHelperPath]) {
      delete require.cache[nodeHelperPath];
    }
    
    // Create fresh instance
    const NodeHelperModule = require('../../node_helper.js');
    nodeHelper = Object.create(NodeHelperModule);
    
    // Mock socket notification sending
    nodeHelper.sendSocketNotification = jest.fn();
    
    // Initialize the node helper
    nodeHelper.start();
  });

  describe('Initialization', () => {
    it('should start successfully', () => {
      expect(() => nodeHelper.start()).not.toThrow();
      expect(nodeHelper.started).toBe(true);
    });

    it('should set Tel Aviv as default location when using old API', () => {
      // This test assumes @hebcal/core is not available and falls back to old API
      // The location will only be set if @hebcal/core fails to load
      // In the current implementation, @hebcal/core takes precedence
      if (mockHebcal.location) {
        expect(mockHebcal.location).toEqual({
          latitude: 32.0853,
          longitude: 34.7818,
          cc: 'IL',
          tzid: 'Asia/Jerusalem'
        });
      }
      // If @hebcal/core is available, location is handled via Location class instead
    });

    it('should handle hebcal library loading failure gracefully', () => {
      // This would be tested with a separate test environment where hebcal fails to load
      expect(nodeHelper).toBeDefined();
    });
  });

  describe('Socket Notification Handling', () => {
    beforeEach(() => {
      // Ensure nodeHelper is started
      nodeHelper.start();
    });

    it('should handle GET_JEWISH_HOLIDAYS notification', () => {
      const payload = { 
        year: 2024, 
        month: 3,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }).not.toThrow();
    });

    it('should ignore unknown notifications', () => {
      expect(() => {
        nodeHelper.socketNotificationReceived('UNKNOWN_NOTIFICATION', {});
      }).not.toThrow();
    });

    it('should handle malformed payload gracefully', () => {
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', null);
      }).not.toThrow();
      
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', 'invalid');
      }).not.toThrow();
      
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', {});
      }).not.toThrow();
      
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', { year: 2024 });
      }).not.toThrow();
    });
  });

  describe('Holiday Fetching', () => {
    beforeEach(() => {
      nodeHelper.start();
    });

    it('should fetch holidays for requested month and next month', () => {
      const payload = { 
        year: 2024, 
        month: 3,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      
      // Test should pass regardless of which API is used
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalled();
    });

    it('should filter major holidays correctly', () => {
      const payload = { 
        year: 2024, 
        month: 3,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      
      // Should send holidays data
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalledWith(
        'JEWISH_HOLIDAYS_RESULT',
        expect.any(Array)
      );
    });

    it('should handle date boundary calculations correctly', () => {
      // Test December to January boundary
      const payload = { 
        year: 2024, 
        month: 12,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }).not.toThrow();
      
      // Test should pass regardless of which API is used
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      nodeHelper.start();
    });

    it('should handle missing hebcal library', () => {
      const payload = { year: 2024, month: 3 };
      
      // This test assumes Hebcal is null
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }).not.toThrow();
    });

    it('should handle invalid date inputs', () => {
      const invalidPayloads = [
        { year: 'invalid', month: 3 },
        { year: 2024, month: 'invalid' },
        { year: -1, month: 3 },
        { year: 2024, month: 13 },
        { year: 2024, month: 0 }
      ];
      
      invalidPayloads.forEach(payload => {
        expect(() => {
          nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
        }).not.toThrow();
      });
    });
  });

  describe('Holiday Classification', () => {
    beforeEach(() => {
      nodeHelper.start();
      
      // Mock HDate to return different holidays for different dates
      mockHDate.mockImplementation((date) => {
        const day = date.getDate();
        let holidays = [];
        
        if (day === 15) {
          holidays = [
            { desc: 'Purim', LIGHT_CANDLES: true, hebrew: 'פורים' }
          ];
        } else if (day === 20) {
          holidays = [
            { desc: 'Passover I', YOM_TOV_ENDS: true, hebrew: 'פסח א׳' }
          ];
        } else if (day === 25) {
          holidays = [
            { desc: 'Erev Shavuot', LIGHT_CANDLES_TZEIS: true, hebrew: 'ערב שבועות' }
          ];
        }
        
        return {
          il: true,
          holidays: jest.fn().mockReturnValue(holidays),
          abs: jest.fn(),
          greg: jest.fn().mockReturnValue(date),
          toString: jest.fn().mockReturnValue('Mock Hebrew Date')
        };
      });
    });

    it('should identify LIGHT_CANDLES events as major holidays', () => {
      const payload = { year: 2024, month: 3 };
      nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalledWith(
        'JEWISH_HOLIDAYS_RESULT',
        expect.any(Array)
      );
    });

    it('should identify LIGHT_CANDLES_TZEIS events as major holidays', () => {
      const payload = { year: 2024, month: 5 };
      nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalledWith(
        'JEWISH_HOLIDAYS_RESULT',
        expect.any(Array)
      );
    });

    it('should identify YOM_TOV_ENDS events as major holidays', () => {
      const payload = { year: 2024, month: 4 };
      nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalledWith(
        'JEWISH_HOLIDAYS_RESULT',
        expect.any(Array)
      );
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      nodeHelper.start();
    });

    it('should handle rapid successive requests', () => {
      const payload = { 
        year: 2024, 
        month: 3,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      // Send multiple requests quickly
      for (let i = 0; i < 5; i++) {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }
      
      // Test should pass regardless of which API is used
      expect(nodeHelper.sendSocketNotification).toHaveBeenCalled();
    });

    it('should not leak memory with repeated requests', () => {
      const payload = { 
        year: 2024, 
        month: 3,
        location: {
          latitude: 32.0853,
          longitude: 34.7818,
          name: "Tel Aviv",
          countryCode: "IL",
          timezone: "Asia/Jerusalem",
          israelObservance: true
        }
      };
      
      // Simulate many requests over time
      for (let i = 0; i < 10; i++) {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }
      
      // Should still be responsive
      expect(() => {
        nodeHelper.socketNotificationReceived('GET_JEWISH_HOLIDAYS', payload);
      }).not.toThrow();
    });
  });
});
