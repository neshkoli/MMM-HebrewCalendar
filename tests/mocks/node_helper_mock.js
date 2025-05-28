// Mock NodeHelper for testing
const EventEmitter = require('events');

class MockNodeHelper extends EventEmitter {
  constructor() {
    super();
    this.started = false;
  }

  start() {
    this.started = true;
  }

  sendSocketNotification(notification, payload) {
    this.emit('socketNotification', notification, payload);
  }

  socketNotificationReceived(notification, payload) {
    // Override in tests
  }
}

MockNodeHelper.create = (moduleDefinition) => {
  const instance = new MockNodeHelper();
  Object.assign(instance, moduleDefinition);
  return instance;
};

module.exports = MockNodeHelper;
