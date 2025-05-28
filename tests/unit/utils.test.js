// Unit tests for MMM-HebrewCalendar utility functions
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');

describe('MMM-HebrewCalendar Utility Functions', () => {
  let utilityFunctions;  beforeAll(async () => {
    // Load the module file to access utility functions
    const modulePath = path.join(__dirname, '../../MMM-HebrewCalendar.js');
    const moduleContent = fs.readFileSync(modulePath, 'utf8');
    
    // Set up a proper JSDOM environment
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: "dangerously",
      resources: "usable"
    });
    
    // Set up required globals in the window context
    dom.window.Module = {
      register: function(name, definition) {
        this._registeredModule = { name, ...definition };
        return definition;
      }
    };
    
    dom.window.Log = {
      log: function() {},
      info: function() {},
      warn: function() {},
      error: function() {}
    };
    
    // Execute the module content in the window context
    const script = dom.window.document.createElement('script');
    script.text = moduleContent;
    dom.window.document.head.appendChild(script);
    
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Wait for script execution and extract utility functions
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Extract utility functions from the window context
    utilityFunctions = {
      el: dom.window.el,
      addOneDay: dom.window.addOneDay,
      diffDays: dom.window.diffDays,
      equals: dom.window.equals
    };
    
    // Verify functions were extracted
    if (!utilityFunctions.equals) {
      throw new Error('Failed to extract equals function from module');
    }
    
    // Debug: Check what we got
    console.log('Extracted utility functions:', Object.keys(utilityFunctions));
    console.log('equals function type:', typeof utilityFunctions.equals);
    console.log('Window keys:', Object.keys(dom.window).filter(k => k.includes('el') || k.includes('equals') || k.includes('diff') || k.includes('add')));
    
    // Test the equals function directly
    if (utilityFunctions.equals) {
      console.log('Direct test of equals([1,2,3], [1,2,3]):', utilityFunctions.equals([1,2,3], [1,2,3]));
    }
  });

  describe('el() function', () => {
    it('should create basic HTML elements', () => {
      const div = utilityFunctions.el('div');
      expect(div.tagName).toBe('DIV');
    });

    it('should set className property', () => {
      const div = utilityFunctions.el('div', { className: 'test-class' });
      expect(div.className).toBe('test-class');
    });

    it('should set innerHTML property', () => {
      const div = utilityFunctions.el('div', { innerHTML: 'Test Content' });
      expect(div.innerHTML).toBe('Test Content');
    });

    it('should set id property', () => {
      const div = utilityFunctions.el('div', { id: 'test-id' });
      expect(div.id).toBe('test-id');
    });

    it('should set custom attributes', () => {
      const div = utilityFunctions.el('div', { 'data-test': 'value' });
      expect(div.getAttribute('data-test')).toBe('value');
    });

    it('should handle multiple properties', () => {
      const div = utilityFunctions.el('div', {
        className: 'test-class',
        id: 'test-id',
        innerHTML: 'Test Content',
        'data-custom': 'custom-value'
      });
      
      expect(div.className).toBe('test-class');
      expect(div.id).toBe('test-id');
      expect(div.innerHTML).toBe('Test Content');
      expect(div.getAttribute('data-custom')).toBe('custom-value');
    });

    it('should handle empty options', () => {
      const div = utilityFunctions.el('div', {});
      expect(div.tagName).toBe('DIV');
    });

    it('should handle null options', () => {
      const div = utilityFunctions.el('div', null);
      expect(div.tagName).toBe('DIV');
    });

    it('should create different HTML elements', () => {
      const span = utilityFunctions.el('span');
      const p = utilityFunctions.el('p');
      const h1 = utilityFunctions.el('h1');
      
      expect(span.tagName).toBe('SPAN');
      expect(p.tagName).toBe('P');
      expect(h1.tagName).toBe('H1');
    });
  });

  describe('addOneDay() function', () => {
    it('should add one day to a date', () => {
      const date = new Date('2024-03-24');
      const nextDay = utilityFunctions.addOneDay(date);
      
      expect(nextDay.getDate()).toBe(25);
      expect(nextDay.getMonth()).toBe(2); // March (0-indexed)
      expect(nextDay.getFullYear()).toBe(2024);
    });

    it('should handle month boundary', () => {
      const date = new Date('2024-03-31');
      const nextDay = utilityFunctions.addOneDay(date);
      
      expect(nextDay.getDate()).toBe(1);
      expect(nextDay.getMonth()).toBe(3); // April (0-indexed)
      expect(nextDay.getFullYear()).toBe(2024);
    });

    it('should handle year boundary', () => {
      const date = new Date('2024-12-31');
      const nextDay = utilityFunctions.addOneDay(date);
      
      expect(nextDay.getDate()).toBe(1);
      expect(nextDay.getMonth()).toBe(0); // January (0-indexed)
      expect(nextDay.getFullYear()).toBe(2025);
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-28'); // 2024 is a leap year
      const nextDay = utilityFunctions.addOneDay(date);
      
      expect(nextDay.getDate()).toBe(29);
      expect(nextDay.getMonth()).toBe(1); // February (0-indexed)
      expect(nextDay.getFullYear()).toBe(2024);
    });

    it('should not modify the original date', () => {
      const originalDate = new Date('2024-03-24');
      const originalTime = originalDate.getTime();
      
      utilityFunctions.addOneDay(originalDate);
      
      expect(originalDate.getTime()).toBe(originalTime);
    });

    it('should preserve time components', () => {
      const date = new Date('2024-03-24T15:30:45.123Z');
      const nextDay = utilityFunctions.addOneDay(date);
      
      expect(nextDay.getHours()).toBe(date.getHours());
      expect(nextDay.getMinutes()).toBe(date.getMinutes());
      expect(nextDay.getSeconds()).toBe(date.getSeconds());
      expect(nextDay.getMilliseconds()).toBe(date.getMilliseconds());
    });
  });

  describe('diffDays() function', () => {
    it('should calculate difference between consecutive days', () => {
      const date1 = new Date('2024-03-24');
      const date2 = new Date('2024-03-25');
      
      expect(utilityFunctions.diffDays(date2, date1)).toBe(2);
      expect(utilityFunctions.diffDays(date1, date2)).toBe(0);
    });

    it('should calculate difference across month boundary', () => {
      const date1 = new Date('2024-03-31');
      const date2 = new Date('2024-04-01');
      
      expect(utilityFunctions.diffDays(date2, date1)).toBe(2);
    });

    it('should calculate difference across year boundary', () => {
      const date1 = new Date('2023-12-31');
      const date2 = new Date('2024-01-01');
      
      expect(utilityFunctions.diffDays(date2, date1)).toBe(2);
    });

    it('should handle same date', () => {
      const date = new Date('2024-03-24');
      
      expect(utilityFunctions.diffDays(date, date)).toBe(1);
    });

    it('should ignore time components', () => {
      const date1 = new Date('2024-03-24T23:59:59');
      const date2 = new Date('2024-03-25T00:00:01');
      
      expect(utilityFunctions.diffDays(date2, date1)).toBe(2);
    });

    it('should handle large date differences', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-12-31');
      
      const diff = utilityFunctions.diffDays(date2, date1);
      expect(diff).toBe(366); // 2024 is a leap year, so 366 days
    });

    it('should handle dates with different timezones consistently', () => {
      const date1 = new Date('2024-03-24T12:00:00Z');
      const date2 = new Date('2024-03-25T12:00:00Z');
      
      expect(utilityFunctions.diffDays(date2, date1)).toBe(2);
    });
  });

  describe('equals() function', () => {
    it('should compare primitive values correctly', () => {
      expect(utilityFunctions.equals(1, 1)).toBe(true);
      expect(utilityFunctions.equals('test', 'test')).toBe(true);
      expect(utilityFunctions.equals(true, true)).toBe(true);
      expect(utilityFunctions.equals(null, null)).toBe(true);
      expect(utilityFunctions.equals(undefined, undefined)).toBe(true);
    });

    it('should identify different primitive values', () => {
      expect(utilityFunctions.equals(1, 2)).toBe(false);
      expect(utilityFunctions.equals('test', 'other')).toBe(false);
      expect(utilityFunctions.equals(true, false)).toBe(false);
      expect(utilityFunctions.equals(null, undefined)).toBe(false);
    });

    it('should compare arrays correctly', () => {
      expect(utilityFunctions.equals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(utilityFunctions.equals([], [])).toBe(true);
      expect(utilityFunctions.equals([1, 2], [1, 2, 3])).toBe(false);
      expect(utilityFunctions.equals([1, 2, 3], [3, 2, 1])).toBe(false);
    });

    it('should compare nested arrays correctly', () => {
      expect(utilityFunctions.equals([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
      expect(utilityFunctions.equals([[1, 2], [3, 4]], [[1, 2], [4, 3]])).toBe(false);
    });

    it('should compare objects correctly', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      const obj3 = { a: 1, b: 3 };
      
      expect(utilityFunctions.equals(obj1, obj2)).toBe(true);
      expect(utilityFunctions.equals(obj1, obj3)).toBe(false);
    });

    it('should compare nested objects correctly', () => {
      const obj1 = { a: { x: 1, y: 2 }, b: 3 };
      const obj2 = { a: { x: 1, y: 2 }, b: 3 };
      const obj3 = { a: { x: 1, y: 3 }, b: 3 };
      
      expect(utilityFunctions.equals(obj1, obj2)).toBe(true);
      expect(utilityFunctions.equals(obj1, obj3)).toBe(false);
    });

    it('should compare Date objects correctly', () => {
      const date1 = new Date('2024-03-24');
      const date2 = new Date('2024-03-24');
      const date3 = new Date('2024-03-25');
      
      expect(utilityFunctions.equals(date1, date2)).toBe(true);
      expect(utilityFunctions.equals(date1, date3)).toBe(false);
    });

    it('should handle mixed types correctly', () => {
      expect(utilityFunctions.equals(1, '1')).toBe(false);
      expect(utilityFunctions.equals([], {})).toBe(false);
      expect(utilityFunctions.equals(null, 0)).toBe(false);
      expect(utilityFunctions.equals(undefined, null)).toBe(false);
    });

    it('should handle complex nested structures', () => {
      const complex1 = {
        arr: [1, 2, { nested: 'value' }],
        obj: { a: 1, b: [3, 4] },
        date: new Date('2024-03-24')
      };
      
      const complex2 = {
        arr: [1, 2, { nested: 'value' }],
        obj: { a: 1, b: [3, 4] },
        date: new Date('2024-03-24')
      };
      
      const complex3 = {
        arr: [1, 2, { nested: 'different' }],
        obj: { a: 1, b: [3, 4] },
        date: new Date('2024-03-24')
      };
      
      expect(utilityFunctions.equals(complex1, complex2)).toBe(true);
      expect(utilityFunctions.equals(complex1, complex3)).toBe(false);
    });

    it('should handle circular references gracefully', () => {
      const obj1 = { a: 1 };
      obj1.self = obj1;
      
      const obj2 = { a: 1 };
      obj2.self = obj2;
      
      // Should not cause infinite recursion
      expect(() => {
        utilityFunctions.equals(obj1, obj2);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid inputs gracefully', () => {
      expect(() => utilityFunctions.el(null)).not.toThrow();
      expect(() => utilityFunctions.addOneDay(null)).not.toThrow();
      expect(() => utilityFunctions.diffDays(null, null)).not.toThrow();
      expect(() => utilityFunctions.equals(null, undefined)).not.toThrow();
    });

    it('should handle extreme date values', () => {
      const veryOldDate = new Date('0001-01-01');
      const veryNewDate = new Date('9999-12-31');
      
      expect(() => {
        utilityFunctions.addOneDay(veryOldDate);
        utilityFunctions.addOneDay(veryNewDate);
        utilityFunctions.diffDays(veryNewDate, veryOldDate);
      }).not.toThrow();
    });

    it('should handle very large objects for comparison', () => {
      const largeObj1 = {};
      const largeObj2 = {};
      
      for (let i = 0; i < 1000; i++) {
        largeObj1[`key${i}`] = `value${i}`;
        largeObj2[`key${i}`] = `value${i}`;
      }
      
      expect(() => {
        utilityFunctions.equals(largeObj1, largeObj2);
      }).not.toThrow();
    });
  });
});
