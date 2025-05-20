// MMM-HebrewCalendar.js

/**
 * Creates a DOM element with the given tag and options
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element properties and attributes
 * @returns {HTMLElement} The created element
 */
function el(tag, options) {
	const result = document.createElement(tag);
	options = options || {};
	
	for (const key in options) {
		if (key === 'className' || key === 'innerHTML' || key === 'id') {
			result[key] = options[key];
		} else {
			result.setAttribute(key, options[key]);
		}
	}
	return result;
}

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
 * Gets the Hebrew year for a given date
 * @param {Date} date - Date to get Hebrew year for
 * @returns {string} Hebrew year
 */
function getHebYear(date) {
	return getHebrewDatePart(date, "year", "en");
}

/**
 * Gets the Hebrew month for a given date
 * @param {Date} date - Date to get Hebrew month for
 * @returns {string} Hebrew month
 */
function getHebMonth(date) {
	const month = getHebrewDatePart(date, "month", "he");
	return month;
}

/**
 * Gets the Hebrew day for a given date
 * @param {Date} date - Date to get Hebrew day for
 * @returns {string} Hebrew day
 */
function getHebDay(date) {
	return getHebrewDatePart(date, "day", "he");
}

function equals(a, b) {
	if (typeof a !== typeof b) {
		return false;
	}

	if (!!a && (a.constructor === Array || a.constructor === Object)) {
		for (const key in a) {
			if (!b.hasOwnProperty(key) || !equals(a[key], b[key])) {
				return false;
			}
		}
		return true;
	} else if (!!a && a.constructor == Date) {
		return a.valueOf() === b.valueOf();
	}
	return a === b;
}

function getLuminance(color) {
	try {
		const [r, g, b, a, s, d] = color.match(/([0-9.]+)/g);
		return 0.299 * +r + 0.587 * +g + 0.114 * +b;
	} catch {
		return 0;
	}
}

Module.register("MMM-HebrewCalendar", {
	// Default module config
	defaults: {
		mode: "FourWeeks",
		firstDayOfWeek: "sunday",
		displaySymbol: false,
		wrapTitles: true,
		hideCalendars: [],
		hebrewEvents: [], // <-- changed from hebrewBirthdays
	},

	// Hebrew date events data structure
	hebrewEvents: {},

	/**
	 * Adds an event to the Hebrew calendar
	 * @param {number} month - Hebrew month (1-13)
	 * @param {number} day - Hebrew day (1-30)
	 * @param {string} text - Event description
	 * @param {string} type - Event type (e.g., "birthday")
	 */
	addHebrewEvent: function (month, day, text, type) {
		if (!this.hebrewEvents[month]) {
			this.hebrewEvents[month] = {};
		}
		if (!this.hebrewEvents[month][day]) {
			this.hebrewEvents[month][day] = [];
		}
		this.hebrewEvents[month][day].push({ text, type });
	},

	start: function () {
		const self = this;

		self.sourceEvents = {};
		self.events = [];
		self.displayedDay = null;
		self.displayedEvents = [];
		self.updateTimer = null;
		self.skippedUpdateCount = 0;

		console.log("MMM-HebrewCalendar module started.");

	},

	notificationReceived: function (notification, payload, sender) {
		const self = this;

		if (notification === "CALENDAR_EVENTS") {
			self.sourceEvents[sender.identifier] = payload
				.map((e) => {
					e.startDate = new Date(+e.startDate);
					e.endDate = new Date(+e.endDate);

					if (e.fullDayEvent) {
						e.endDate = new Date(e.endDate.getTime() - 1000);
						if (e.startDate > e.endDate) {
							e.startDate = new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate(), 1);
						} else {
							e.startDate = new Date(e.startDate.getTime() + 60 * 60 * 1000);
						}
					}
					return e;
				})
				.filter((e) => {
					return !self.config.hideCalendars.includes(e.calendarName);
				});

			if (self.updateTimer !== null) {
				clearTimeout(self.updateTimer);
				++self.skippedUpdateCount;
			}

			self.updateTimer = setTimeout(() => {
				const today = new Date().setHours(12, 0, 0, 0).valueOf();

				self.events = Object.values(self.sourceEvents)
					.reduce((acc, cur) => acc.concat(cur), [])
					.sort((a, b) => { return a.startDate - b.startDate; });
				if (
					today !== self.displayedDay ||
					!equals(self.events, self.displayedEvents)
				) {
					self.displayedDay = today;
					self.displayedEvents = self.events;
					self.updateTimer = null;
					self.skippedUpdateCount = 0;
					self.updateDom();
				}
			}, 5000);
		}
	},

	getStyles: function () {
		return ["MMM-HebrewCalendar.css"];
	},

	getDom: function () {
		const self = this;
		const now = new Date();
		const table = el("table", { className: "small wrapper" });

		const days = this.getDaysOfWeek();
		const hebDayArray = this.getHebDayArray();
		const dateCells = [];
		let cellIndex = this.calculateStartCellIndex(now, days);
		const monthDays = this.calculateMonthDays(now, cellIndex);

		this.addTableHeaders(table, days, cellIndex, now);
		this.addTableRows(table, dateCells, cellIndex, monthDays, now, hebDayArray);

		this.addCalendarEvents(dateCells, now);
		return table;
	},

	getDaysOfWeek: function () {
		return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	},

	getHebDayArray: function () {
		return [
			"", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ֿז׳", "ח׳", "ט׳", "י׳", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז',
			'י"ז', 'י"ח', 'י"ט', "כ׳", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל׳"
		];
	},

	calculateStartCellIndex: function (now, days) {
		let firstDayOfWeek = this.config.firstDayOfWeek.toLowerCase();
		let startDayOffset = 0;

		if (firstDayOfWeek === "today") {
			firstDayOfWeek = days[now.getDay()].toLowerCase();
		}

		while (firstDayOfWeek !== days[0].toLowerCase() && startDayOffset < days.length) {
			days.push(days.shift());
			++startDayOffset;
		}

		startDayOffset = startDayOffset % 7;
		return now.getDate() - now.getDay() + startDayOffset;
	},

	calculateMonthDays: function (now, cellIndex) {
		const mode = this.config.mode.toLowerCase();
		const weeksToMonthDays = { nextoneweek: 0, currentweek: 0, oneweek: 0, twoweeks: 7, threeweeks: 14, fourweeks: 21, nextfourweeks: 21 };

		if (mode in weeksToMonthDays) {
			while (cellIndex > now.getDate()) {
				cellIndex -= 7;
			}
			return cellIndex + weeksToMonthDays[mode];
		} else {
			if (mode === "lastmonth") {
				now.setMonth(now.getMonth() - 1);
			} else if (mode === "nextmonth") {
				now.setMonth(now.getMonth() + 1);
			}
			cellIndex = 1 - new Date(now.getFullYear(), now.getMonth(), 1).getDay();
			return 32 - new Date(now.getFullYear(), now.getMonth(), 32).getDate();
		}
	},

	addTableHeaders: function (table, days, cellIndex, now) {
		const row = el("tr");
		for (let day = 0; day < 7; ++day) {
			const headerDate = new Date(now.getFullYear(), now.getMonth(), cellIndex + day);
			row.appendChild(el("th", { className: "header", innerHTML: headerDate.toLocaleString(config.language, { weekday: "long" }) }));
		}
		table.appendChild(row);
	},

	addTableRows: function (table, dateCells, cellIndex, monthDays, now, hebDayArray) {
		const self = this;

		// Reset hebrewEvents at the start of rendering to avoid stale/duplicate data
		self.hebrewEvents = {};

		// Only add hebrewEvents if present in config
		if (self.config.hebrewEvents && self.config.hebrewEvents.length > 0) {
			self.config.hebrewEvents.forEach(function(event) {
				// For each event, find all matching days in the current month view
				for (let d = 1; d <= monthDays; ++d) {
					const cellDate = new Date(now.getFullYear(), now.getMonth(), d);
					const hebDayStr = getHebrewDatePart(cellDate, "day", "en"); // Use "en" for parseInt
					const hebDay = parseInt(hebDayStr);
					const hebMonthName = getHebMonth(cellDate);
					const hebMonthNumeric = Number(new Intl.DateTimeFormat("en-u-ca-hebrew", { month: "numeric" }).format(cellDate));
					// Fix: skip invalid hebDay (NaN) and skip days outside valid range
					if (
						!isNaN(hebDay) &&
						hebDay > 0 &&
						String(event.hebrewMonth).trim() === String(hebMonthName).trim() &&
						Number(event.hebrewDay) === Number(hebDay)
					) {
						const type = event.type || "other";
						const emojiMap = {
							birthday: "🎂",
							anniversary: "💍",
							memorial: "🕯️",
							other: "⭐"
						};
						const emoji = emojiMap[type] || "⭐";
						const eventText = `${emoji} ${event.name}`;
						self.addHebrewEvent(hebMonthNumeric, hebDay, eventText, type);
					}
				}
			});
		}

		for (let week = 0; week < 6 && cellIndex <= monthDays; ++week) {
			const row = el("tr", { className: "small" });

			for (let day = 0; day < 7; ++day, ++cellIndex) {
				const cellDate = new Date(now.getFullYear(), now.getMonth(), cellIndex);
				const hebDayStr = getHebrewDatePart(cellDate, "day", "en"); // Use "en" for parseInt
				const hebDay = parseInt(hebDayStr);
				const hebMonthName = getHebMonth(cellDate);
				const hebMonthNumeric = Number(new Intl.DateTimeFormat("en-u-ca-hebrew", { month: "numeric" }).format(cellDate));
				let cellDay = cellDate.getDate();

				const cell = el("td", { className: "cell" });
				self.styleCell(cell, cellIndex, cellDay, day, now);

				if ((week === 0 && day === 0) || cellDay === 1) {
					cellDay = cellDate.toLocaleString(config.language, { month: "short", day: "numeric" });
				}
				self.addCellHeader(cell, hebDay, hebMonthName, cellDay, hebDayArray);

				const eventsContainer = el("div", { className: "events-container" });
				cell.appendChild(eventsContainer);

				if (self.hebrewEvents[hebMonthNumeric] && self.hebrewEvents[hebMonthNumeric][hebDay]) {
					self.hebrewEvents[hebMonthNumeric][hebDay].forEach(function(event) {
						const eventDiv = el("div", { className: `event event-${event.type}`, innerHTML: event.text });
						eventsContainer.appendChild(eventDiv);
					});
				}

				row.appendChild(cell);
				dateCells[cellIndex] = cell;
			}
			table.appendChild(row);
		}
	},

	styleCell: function (cell, cellIndex, cellDay, day, now) {
		const mode = this.config.mode.toLowerCase();
		const today = now.getDate();

		if (["lastmonth", "nextmonth"].includes(mode)) {
			// Do nothing
		} else if (day === 6) {
			cell.classList.add("shabbat");
		} else if (cellIndex === today) {
			cell.classList.add("today");
		} else if (cellIndex !== cellDay && mode === "currentmonth") {
			cell.classList.add("other-month");
		} else if (cellIndex < today) {
			cell.classList.add("past-date");
		}
	},

	addCellHeader: function (cell, hebDay, hebMonth, cellDay, hebDayArray) {
		const cellHeader = el("div", { className: "cell-header" });
		const hebHeader = parseInt(hebDay) === 1
			? el("div", { className: "heb-header", innerHTML: hebDayArray[hebDay] + " " + hebMonth })
			: el("div", { className: "heb-header", innerHTML: hebDayArray[hebDay] });
		const dateHeader = el("div", { className: "date-header", innerHTML: cellDay });
		cellHeader.appendChild(hebHeader);
		cellHeader.appendChild(dateHeader);
		cell.appendChild(cellHeader);
	},

	addCalendarEvents: function (dateCells, now) {
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		for (const i in this.events) {
			const e = this.events[i];
			for (
				let eventDate = e.startDate;
				eventDate <= e.endDate;
				eventDate = addOneDay(eventDate)
			) {
				const dayDiff = diffDays(eventDate, monthStart);
				if (dayDiff in dateCells) {
					// console.log("Adding calendar event to cell:", dayDiff, e);
					const div = el("div", { className: "event" });
					if (!this.config.wrapTitles) {
						div.classList.add("event-nowrap");
					}
					if (!e.fullDayEvent) {
						this.addEventLine(div, e);
					} else {
						div.appendChild(el("div", { className: "event-full-day", innerHTML: e.title }));
					}

					if (this.config.displaySymbol) {
						for (const symbol of e.symbol) {
							div.appendChild(el("div", { className: `fa fa-${symbol}` }));
						}
					}
					dateCells[dayDiff].appendChild(div);
				}
			}
		}
	},

	addEventLine: function (div, event) {
		const eventLine = el("div", { className: "event-line" });
		eventLine.appendChild(el("div", { className: "event-label", innerHTML: this.formatTime(event.startDate) }));
		eventLine.appendChild(el("div", { className: "event-text", innerHTML: event.title }));
		div.appendChild(eventLine);
	},

	formatTime: function (date) {
		const h = date.getHours();
		const m = date.getMinutes().toString().padStart(2, "0");
		if (config.timeFormat === 12) {
			return ((h % 12 || 12) + (m > 0 ? `:${m}` : "") + (h < 12 ? "am" : "pm"));
		} else {
			return `${h}:${m}`;
		}
	}
});
