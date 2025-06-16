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
 * Gets the Hebrew day number for a given date or object
 * @param {Date|Object} date - Date or object with dd/hebrewDay property
 * @returns {number} Hebrew day as number
 */
function getHebDayNumber(date) {
    if (date && typeof date === 'object' && !(date instanceof Date)) {
        const dayValue = date.dd || date.hebrewDay;
        if (dayValue) {
            return parseInt(dayValue);
        }
    }
    const dayStr = getHebrewDatePart(date, "day", "en");
    return parseInt(dayStr);
}

/**
 * Gets the Hebrew month number for a given date or object
 * @param {Date|Object} date - Date or object with mm/hebrewMonth property
 * @returns {number} Hebrew month as number
 */
function getHebMonthNumber(date) {
    if (date && typeof date === 'object' && !(date instanceof Date)) {
        const monthValue = date.mm || date.hebrewMonth;
        if (monthValue) {
            const monthNames = {
                'Tishrei': 1, 'Cheshvan': 2, 'Kislev': 3, 'Tevet': 4, 'Shevat': 5, 'Adar': 6,
                'Nisan': 7, 'Iyyar': 8, 'Sivan': 9, 'Tammuz': 10, 'Av': 11, 'Elul': 12,
                'תשרי': 1, 'חשוון': 2, 'כסלו': 3, 'טבת': 4, 'שבט': 5, 'אדר': 6,
                'ניסן': 7, 'אייר': 8, 'סיוון': 9, 'תמוז': 10, 'אב': 11, 'אלול': 12
            };
            if (typeof monthValue === 'number' && monthValue >= 1 && monthValue <= 13) {
                 return monthValue;
            }
            if (typeof monthValue === 'string') {
                return monthNames[monthValue] || 0;
            }
            return 0;
        }
    }
    return Number(getHebrewDatePart(date, "month", "en"));
}

function getDaysOfWeek() {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
}

function getHebDayArray() {
    return [
        "", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ֿז׳", "ח׳", "ט׳", "י׳", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז',
        'י"ז', 'י"ח', 'י"ט', "כ׳", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל׳"
    ];
}

function calculateMonthDays(now, cellIndex, config) {
    const mode = config.mode.toLowerCase();
    const weeksToMonthDays = { nextoneweek: 0, currentweek: 0, oneweek: 0, twoweeks: 7, threeweeks: 14, fourweeks: 21, nextfourweeks: 21 };

    if (mode in weeksToMonthDays) {
        while (cellIndex > now.getDate()) {
            cellIndex -= 7;
        }
        return cellIndex + weeksToMonthDays[mode];
    } else {
        const localNow = new Date(now);
        if (mode === "lastmonth") {
            localNow.setMonth(localNow.getMonth() - 1);
        } else if (mode === "nextmonth") {
            localNow.setMonth(localNow.getMonth() + 1);
        }
        return 32 - new Date(localNow.getFullYear(), localNow.getMonth(), 32).getDate();
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	// Node.js environment
	module.exports = {
		addOneDay,
		diffDays,
		getHebrewDatePart,
		getHebMonth,
		getHebDayNumber,     // Updated
		getHebMonthNumber,   // Updated
		getDaysOfWeek,       // New
		getHebDayArray,      // New
		calculateMonthDays   // New
	};
}