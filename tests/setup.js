// Global test setup for MMM-HebrewCalendar tests
const { TextEncoder, TextDecoder } = require('util');

// Polyfill TextEncoder and TextDecoder for JSDOM compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:8080',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

// Mock console methods for consistent test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Module registry for MagicMirror
global.Module = {
  register: jest.fn((name, moduleDefinition) => {
    global.Module._testModule = {
      name,
      ...moduleDefinition
    };
    return moduleDefinition;
  }),
  definitions: {},
  _testModule: null
};

// Mock Log utility for MagicMirror
global.Log = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock moment for consistent date testing
global.moment = require('moment-timezone');

// Helper to reset all mocks
global.resetAllMocks = () => {
  jest.clearAllMocks();
  global.Module._testModule = null;
};

// Helper to create DOM element (matching module's el function)
global.createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  for (const key in options) {
    if (key === 'className' || key === 'innerHTML' || key === 'id') {
      element[key] = options[key];
    } else {
      element.setAttribute(key, options[key]);
    }
  }
  return element;
};
