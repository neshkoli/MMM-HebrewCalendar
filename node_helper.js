const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start: function () {
    this.hebrewEvents = {};
    Log.info(this.name + " helper started...");
    console.log("Hebrew events initialized.");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "ADD_HEBREW_EVENT") {
      Log.info("Received ADD_HEBREW_EVENT notification.");
      this.addHebrewEvent(payload.month, payload.day, payload.text, payload.type);
    }
  },

  addHebrewEvent: function (month, day, text, type) {
    if (!this.hebrewEvents[month]) {
      this.hebrewEvents[month] = {};
    }
    if (!this.hebrewEvents[month][day]) {
      this.hebrewEvents[month][day] = [];
    }
    this.hebrewEvents[month][day].push({ text, type });
    Log.info(`Added Hebrew event: ${text} on ${month}/${day}.`);
  },

  stop: function () {
    Log.info(this.name + " helper stopped...");
  }
});