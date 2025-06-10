// calendar-utils.js
// Utility functions for Hebrew calendar calculations and date manipulation

/**
 * Adds one day to the given date
 * @param {Date} d - Date to increment
 * @returns {Date} New date object representing the next day
 */
function addOneDay(d) {
	const newDate = new Date(d);
	newDate.setDate(newDate.getDate() + 1);
	return newDate;
}

/**
 * Calculates the difference in days between two dates
 * @param {Date} a - First date
 * @param {Date} b - Second date
 * @returns {number} Number of days between dates
 */
function diffDays(a, b) {
	const dateA = new Date(a);
	const dateB = new Date(b);

	dateA.setHours(0, 0, 0, 0);
	dateB.setHours(0, 0, 0, 0);

	return Math.round((dateA - dateB) / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Helper function for Hebrew calendar formatting
 * @param {Date} date - Date to format
 * @param {string} part - Part of date to return ("year", "month", or "day")
 * @param {string} locale - Locale to use (default: "he")
 * @returns {string} Formatted Hebrew date part
 */
function getHebrewDatePart(date, part, locale = "he") {
	return new Intl.DateTimeFormat(`${locale}-u-ca-hebrew`, { [part]: part === "month" ? "long" : "numeric" }).format(date);
}

/**
 * Gets the Hebrew month for a given date
 * @param {Date} date - Date to get Hebrew month for
 * @returns {string} Hebrew month
 */
function getHebMonth(date) {
	return getHebrewDatePart(date, "month");
}

/**
 * Gets the Hebrew day number for a given date
 * @param {Date} date - Date to get Hebrew day for
 * @returns {number} Hebrew day as number
 */
function getHebDayNumber(date) {
	const dayStr = getHebrewDatePart(date, "day", "en");
	return parseInt(dayStr);
}

/**
 * Gets the Hebrew month number for a given date
 * @param {Date} date - Date to get Hebrew month number for
 * @returns {number} Hebrew month as number
 */
function getHebMonthNumber(date) {
	return Number(getHebrewDatePart(date, "month", "en"));
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	// Node.js environment
	module.exports = {
		addOneDay,
		diffDays,
		getHebrewDatePart,
		getHebMonth,
		getHebDayNumber,
		getHebMonthNumber
	};
}