// MMM-HebrewCalendar.js

console.log('Loading MMM-HebrewCalendar.js');

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



function equals(a, b) {
	function equalsInternal(a, b, visited = new Set()) {
		if (a === b) {
			return true;
		}
		
		if (typeof a !== typeof b) {
			return false;
		}
		
		if (a === null || b === null || a === undefined || b === undefined) {
			return a === b;
		}

		// Handle circular references
		if (typeof a === 'object' && typeof b === 'object') {
			if (visited.has(a) || visited.has(b)) {
				return true; // Assume equal for circular references
			}
			visited.add(a);
			visited.add(b);
		}

		if (Object.prototype.toString.call(a) === '[object Date]' && Object.prototype.toString.call(b) === '[object Date]') {
			return a.valueOf() === b.valueOf();
		}

		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) {
				return false;
			}
			for (let i = 0; i < a.length; i++) {
				if (!equalsInternal(a[i], b[i], visited)) {
					return false;
				}
			}
			return true;
		}

		if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null && !Array.isArray(a) && !Array.isArray(b)) {
			const keysA = Object.keys(a);
			const keysB = Object.keys(b);
			
			if (keysA.length !== keysB.length) {
				return false;
			}
			
			for (const key of keysA) {
				if (!keysB.includes(key) || !equalsInternal(a[key], b[key], visited)) {
					return false;
				}
			}
			return true;
		}

		return false;
	}
	
	return equalsInternal(a, b);
}

Module.register("MMM-HebrewCalendar", {
	// Default module config
	defaults: {
		mode: "FourWeeks",
		firstDayOfWeek: "sunday",
		displaySymbol: true,
		wrapTitles: true,
		hideCalendars: [],
		hebrewEvents: [],
		showBottomText: true, // Show location and IP information at the bottom
		// Location configuration (defaults to Tel Aviv, Israel)
		location: {
			latitude: 32.0853,
			longitude: 34.7818,
			name: "Tel Aviv",
			countryCode: "IL",
			timezone: "Asia/Jerusalem",
			israelObservance: true
		}
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

	/**
	 * Classifies a holiday title and returns the appropriate CSS class
	 * @param {string} title - Holiday title in Hebrew or English
	 * @returns {string} CSS class for the holiday type
	 */
	getHolidayCssClass: function(title) {
		// Convert to lowercase for easier matching
		const titleLower = title.toLowerCase();
		
		// Check for Rosh Chodesh first (before minor holidays)
		if (titleLower.includes('ר"ח') || titleLower.includes('rosh chodesh')) {
			return 'event-holiday-rosh-chodesh';
		}
		
		// Major holidays (purple)
		const majorHolidays = [
			'ראש השנה', 'rosh hashanah', 'rosh hashana',
			'יום כפור', 'יום כיפור', 'yom kippur',
			'פסח', 'passover', 'pesach'
		];
		
		// Festivals (blue)
		const festivals = [
			'שבועות', 'shavuot', 'shavot',
			'סוכות', 'sukkot', 'succot',
			'חנוכה', 'hanukkah', 'chanukah', 'hanukah',
			'שמיני עצרת', 'shmini atzeret',
			'שמחת תורה', 'simchat torah'
		];
		
		// Minor holidays (green)
		const minorHolidays = [
			'ט"ו בשבט', 'tu bishvat', 'tu bshvat',
			'ל"ג בעומר', 'lag baomer', 'lag b\'omer'
		];
		
		// Fast days (gray)
		const fastDays = [
			'צום', 'fast',
			'תענית', 'taanit',
			'י"ז בתמוז', '17 tammuz',
			'ט"ב באב', 'tisha bav', '9 av'
		];
		
		// Modern holidays (orange)
		const modernHolidays = [
			'יום העצמאות', 'yom haatzmaut', 'independence day',
			'יום ירושלים', 'yom yerushalayim', 'jerusalem day',
			'יום הזיכרון', 'yom hazikaron', 'memorial day',
			'יום השואה', 'yom hashoah', 'holocaust remembrance'
		];
		
		// Check for major holidays
		for (const holiday of majorHolidays) {
			if (titleLower.includes(holiday)) {
				return 'event-holiday-major';
			}
		}
		
		// Check for festivals
		for (const festival of festivals) {
			if (titleLower.includes(festival)) {
				return 'event-holiday-festival';
			}
		}
		
		// Check for minor holidays
		for (const minor of minorHolidays) {
			if (titleLower.includes(minor)) {
				return 'event-holiday-minor';
			}
		}
		
		// Check for fast days
		for (const fast of fastDays) {
			if (titleLower.includes(fast)) {
				return 'event-holiday-fast';
			}
		}
		
		// Check for modern holidays
		for (const modern of modernHolidays) {
			if (titleLower.includes(modern)) {
				return 'event-holiday-modern';
			}
		}
		
		// Default to minor holiday if not classified
		return 'event-holiday-minor';
	},

	/**
	 * Gets events for a specific Hebrew date
	 * @param {number} month - Hebrew month (1-13)
	 * @param {number} day - Hebrew day (1-30)
	 * @returns {Array} Array of events for that date
	 */
	getEventsForDate: function (month, day) {
		if (this.hebrewEvents[month] && this.hebrewEvents[month][day]) {
			return this.hebrewEvents[month][day];
		}
		return [];
	},

	start: function () {
		const self = this;

		console.log("MMM-HebrewCalendar start() called.");

		self.sourceEvents = {};
		self.events = [];
		self.displayedDay = null;
		self.displayedEvents = [];
		self.updateTimer = null;
		self.skippedUpdateCount = 0;
		self.userIpAddress = null;

		// Initialize IP utilities
		self.ipUtils = new IpUtils(self);

		// Initialize hebrewEvents from config
		self.hebrewEvents = {};
		if (self.config.hebrewEvents && Array.isArray(self.config.hebrewEvents)) {
			self.config.hebrewEvents.forEach(event => {
				// Support both old format {mm, dd, text} and new format {hebrewMonth, hebrewDay, name}
				const hasOldFormat = event.mm && event.dd && event.text;
				const hasNewFormat = event.hebrewMonth && event.hebrewDay && event.name;
				
				if (hasOldFormat || hasNewFormat) {
					const month = getHebMonthNumber(event); // Changed from self.getHebMonthNumber
					const day = getHebDayNumber(event); // Changed from self.getHebDayNumber
					const text = event.text || event.name;
					self.addHebrewEvent(month, day, text, event.type || 'custom');
				}
			});
		}

		// 2. Add Jewish holidays for the current month using hebcal
		self.addJewishHolidays();

		// 3. Fetch user's IP address if showBottomText is enabled
		if (self.config.showBottomText) {
			console.log("DEBUG: showBottomText is enabled, calling fetchUserIpAddress...");
			self.userIpAddress = 'Fetching...'; // Set initial state
			// Send debug message to node_helper
			self.sendSocketNotification('DEBUG_MESSAGE', 'Starting IP fetch from client');
			self.ipUtils.fetchUserIpAddress(
				(ip) => {
					self.userIpAddress = ip;
					self.updateDom();
				},
				(error) => {
					self.userIpAddress = 'Unknown';
					self.updateDom();
				}
			);
		} else {
			console.log("DEBUG: showBottomText is disabled");
		}

		console.log("MMM-HebrewCalendar module started.");

	},

	getScripts: function () {
		// Load calendar utility functions and IP utilities
		return ["calendar-utils.js", "ip-utils.js"];
	},

	// 3. Add a new method to fetch and add Jewish holidays to events
	addJewishHolidays: function () {
		const self = this;
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		// Request holidays from node_helper for current and next month
		console.log(`Requesting Jewish holidays for ${year}/${month} and next month`);
		self.sendSocketNotification('GET_JEWISH_HOLIDAYS', { 
			year, 
			month, 
			location: self.config.location 
		});
	},

	notificationReceived: function (notification, payload, sender) {
		const self = this;

		if (notification === "CALENDAR_EVENTS") {
			// Ensure sourceEvents is initialized
			if (!self.sourceEvents) {
				self.sourceEvents = {};
			}
			
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

	// handle replies from node_helper.js
	socketNotificationReceived: function (notification, payload) {
		console.log("MMM-HebrewCalendar client got socket:", notification, payload);
		const self = this;
		
		// Check if IP utilities can handle this notification
		if (self.ipUtils && self.ipUtils.handleSocketNotification(
			notification, 
			payload,
			(ip) => {
				self.userIpAddress = ip;
				self.updateDom();
			},
			(error) => {
				self.userIpAddress = 'Unknown';
				self.updateDom();
			}
		)) {
			// IP utilities handled the notification
			return;
		}
		
		// Fallback handling for IP notifications if ipUtils not available
		if (notification === "IP_ADDRESS_RESULT" || notification === "INTERNAL_IP_ADDRESS_RESULT") {
			console.log("IP address received from node_helper:", payload);
			self.userIpAddress = payload;
			self.updateDom();
			return;
		} else if (notification === "IP_ADDRESS_ERROR" || notification === "INTERNAL_IP_ADDRESS_ERROR") {
			console.error("Error fetching IP address from node_helper:", payload);
			self.userIpAddress = 'Unknown';
			self.updateDom();
			return;
		}
		
		if (notification === "JEWISH_HOLIDAYS_RESULT") {
			// Ensure sourceEvents is initialized
			if (!self.sourceEvents) {
				self.sourceEvents = {};
			}
			
			// Handle null or invalid payload
			if (!payload || !Array.isArray(payload)) {
				console.warn("Invalid holiday data received:", payload);
				self.sourceEvents["jewishHolidays"] = [];
				self.processEvents();
				return;
			}
			
			// Store the holiday and PARASHA events
			self.sourceEvents["jewishHolidays"] = payload.map((ev) => {
				// Handle corrupt event data
				if (!ev || typeof ev !== 'object' || !ev.title || !ev.date) {
					console.warn("Skipping corrupt event data:", ev);
					return null;
				}
				console.log("Adding Jewish holiday/parasha event:", ev);
				
				// Determine event type based on category from node_helper
				const isParasha = ev.category === 'parasha';
				const isHoliday = ev.category === 'holiday' || ev.category === 'other'; // Treat 'other' category as holiday too
				const isCandleLighting = ev.category === 'candles';
				const isHavdalah = ev.category === 'havdalah';
				
				// Create event object
				const event = {
					title: ev.title,
					hebrewTitle: ev.title,
					startDate: new Date(ev.date),
					endDate: new Date(ev.date),
					fullDayEvent: isCandleLighting || isHavdalah ? false : true, // Candle lighting and havdalah are timed events
					type: isParasha ? "parasha" : isCandleLighting ? "candles" : isHavdalah ? "havdalah" : "holiday",
					category: ev.category, // Store the original category
					calendarName: isParasha ? "Torah Portions" : isCandleLighting ? "Candle Lighting" : isHavdalah ? "Havdalah" : "Jewish Holidays",
					symbol: [],
					isHoliday: isHoliday,
					isParasha: isParasha,
					isCandleLighting: isCandleLighting,
					isHavdalah: isHavdalah,
					time: ev.time || null // Store the time if available
				};

				// Add display symbol if configured, or always for special events
				if (self.config.displaySymbol || isParasha || isCandleLighting || isHavdalah) {
					if (isParasha) {
						event.title = `📜 ${event.title}`; // Torah scroll for PARASHA - always show
					} else if (isCandleLighting) {
						event.title = `${event.title}`; // candle lighting (הדלקת נרות) - always show
					} else if (isHavdalah) {
						event.title = `✨ ${event.title}`; // Candle for havdalah (הבדלה) - always show
					} else if (self.config.displaySymbol) {
						event.title = `🕎 ${event.title}`; // Menorah for holidays
					}
				}

				return event;
			}).filter(event => event !== null); // Remove any null entries from corrupt data

			// Process events and update DOM
			self.processEvents();
		} else if (notification === "JEWISH_HOLIDAYS_ERROR") {
			console.error("Error fetching Jewish holidays:", payload);
			// Continue with empty holiday data
			if (!self.sourceEvents) {
				self.sourceEvents = {};
			}
			self.sourceEvents["jewishHolidays"] = [];
			self.processEvents();
		}
	},

	/**
	 * Process all events and update the display
	 */
	processEvents: function() {
		const self = this;
		
		// Ensure sourceEvents is initialized
		if (!self.sourceEvents) {
			self.sourceEvents = {};
		}
		
		if (self.updateTimer !== null) {
			clearTimeout(self.updateTimer);
			++self.skippedUpdateCount;
		}
		
		self.updateTimer = setTimeout(() => {
			const today = new Date().setHours(12, 0, 0, 0).valueOf();
			self.events = Object.values(self.sourceEvents)
				.reduce((acc, cur) => acc.concat(cur), [])
				.sort((a, b) => a.startDate - b.startDate);
			
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
		}, 100); // Reduced timeout for better responsiveness
	},

	getStyles: function () {
		return ["MMM-HebrewCalendar.css"];
	},

	getDom: function () {
		const self = this;
		const now = new Date();
		
		// Create main wrapper container
		const wrapper = el("div", { className: "mmm-hebrew-calendar-wrapper" });
		
		// Create calendar table
		const table = el("table", { className: "small wrapper" });

		const days = getDaysOfWeek(); // Changed from this.getDaysOfWeek()
		const hebDayArray = getHebDayArray(); // Changed from this.getHebDayArray()
		const dateCells = [];
		let cellIndex = this.calculateStartCellIndex(now, days); // Stays as this.calculateStartCellIndex
		const monthDays = calculateMonthDays(now, cellIndex, this.config); // Changed from this.calculateMonthDays and added this.config

		this.addTableHeaders(table, days, cellIndex, now);
		this.addTableRows(table, dateCells, cellIndex, monthDays, now, hebDayArray);

		this.addCalendarEvents(dateCells, now);
		
		// Add calendar table to wrapper
		wrapper.appendChild(table);
		
		// Add location and IP display below the calendar (if enabled)
		if (this.config.showBottomText && this.config.location && this.config.location.name) {
			// Use IP utilities to create location container (if available)
			if (this.ipUtils) {
				const locationContainer = this.ipUtils.createLocationContainer(
					this.config.location.name,
					this.userIpAddress
				);
				wrapper.appendChild(locationContainer);
			} else {
				// Fallback if IP utilities not initialized yet - use same flex structure
				const container = el("div", { className: "location-display-container" });
				
				// Left side - location text
				const locationText = el("div", { 
					className: "location-text",
					innerHTML: "Zmanim for " + this.config.location.name
				});
				container.appendChild(locationText);
				
				// Right side - IP address (only if available)
				if (this.userIpAddress) {
					const ipDisplay = el("div", { 
						className: "ip-display",
						innerHTML: "IP: " + this.userIpAddress
					});
					container.appendChild(ipDisplay);
				}
				
				wrapper.appendChild(container);
			}
		}
		
		return wrapper;
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

	addTableHeaders: function (table, days, cellIndex, now) {
		const row = el("tr");
		for (let day = 0; day < 7; ++day) {
			const headerDate = new Date(now.getFullYear(), now.getMonth(), cellIndex + day);
			row.appendChild(el("th", { className: "header", innerHTML: headerDate.toLocaleString(this.config.language || "en", { weekday: "long" }) }));
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
				// For each event, find all matching days in the current calendar view
				// Use the same cellIndex approach as the main rendering loop
				let tempCellIndex = cellIndex;
				for (let week = 0; week < 6 && tempCellIndex <= monthDays; ++week) {
					for (let day = 0; day < 7; ++day, ++tempCellIndex) {
						const cellDate = new Date(now.getFullYear(), now.getMonth(), tempCellIndex);
						const hebDay = getHebDayNumber(cellDate);
						const hebMonthName = getHebMonth(cellDate);
						const hebMonthNumeric = getHebMonthNumber(cellDate);
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
				}
			});
		}

		for (let week = 0; week < 6 && cellIndex <= monthDays; ++week) {
			const row = el("tr", { className: "small" });

			for (let day = 0; day < 7; ++day, ++cellIndex) {
				const cellDate = new Date(now.getFullYear(), now.getMonth(), cellIndex);
				const hebDay = getHebDayNumber(cellDate);
				const hebMonthName = getHebMonth(cellDate);
				const hebMonthNumeric = getHebMonthNumber(cellDate);
				let cellDay = cellDate.getDate();

				const cell = el("td", { className: "cell" });
				self.styleCell(cell, cellIndex, cellDay, day, now);

				if ((week === 0 && day === 0) || cellDay === 1) {
					cellDay = cellDate.toLocaleString(this.config.language || "en", { month: "short", day: "numeric" });
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
					
					// Apply holiday-specific CSS class if it's a holiday
					if (e.isHoliday || e.type === "holiday") {
						const holidayCssClass = this.getHolidayCssClass(e.title);
						div.classList.add(holidayCssClass);
					}
					// Apply PARASHA-specific CSS class if it's a Torah portion
					else if (e.isParasha || e.type === "parasha") {
						div.classList.add("event-parasha");
					}
					// Apply candle lighting CSS class
					else if (e.isCandleLighting || e.type === "candles") {
						div.classList.add("event-candles");
					}
					// Apply havdalah CSS class
					else if (e.isHavdalah || e.type === "havdalah") {
						div.classList.add("event-havdalah");
					}
					
					if (!this.config.wrapTitles) {
						div.classList.add("event-nowrap");
					}
					if (!e.fullDayEvent) {
						// For timed events like candle lighting and havdalah, use special time display
						if ((e.isCandleLighting || e.isHavdalah || e.type === "candles" || e.type === "havdalah") && e.time) {
							this.addEventLineWithTime(div, e);
						} else {
							this.addEventLine(div, e);
						}
					} else {
						// For full-day events, check if it's a holiday or parasha
						if (e.isHoliday || e.type === "holiday" || e.isParasha || e.type === "parasha") {
							// For holidays and parasha, don't use event-full-day class (to avoid gold background)
							const eventContent = el("div", { innerHTML: e.title });
							div.appendChild(eventContent);
						} else {
							// For other full-day events, use the original event-full-day styling
							const eventContent = el("div", { className: "event-full-day", innerHTML: e.title });
							div.appendChild(eventContent);
						}
					}

					if (this.config.displaySymbol && e.symbol && Array.isArray(e.symbol)) {
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

	addEventLineWithTime: function (div, event) {
		const eventLine = el("div", { className: "event-line" });
		// For candle lighting and havdalah, use the time from the event if available
		const timeString = event.time ? this.formatTimeString(event.time) : this.formatTime(event.startDate);
		eventLine.appendChild(el("div", { className: "event-label", innerHTML: timeString }));
		eventLine.appendChild(el("div", { className: "event-text", innerHTML: event.title }));
		div.appendChild(eventLine);
	},

	formatTimeString: function (timeString) {
		// Handle time strings from hebcal (e.g., "18:15")
		if (typeof timeString === 'string') {
			// If it's already a formatted time string, return as is
			if (timeString.match(/^\d{1,2}:\d{2}$/)) {
				return timeString;
			}
			// Handle ISO date strings by extracting time
			if (timeString.includes('T') && timeString.includes('Z')) {
				const date = new Date(timeString);
				return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
			}
		}
		// If it's a Date object
		if (timeString instanceof Date) {
			return `${timeString.getHours()}:${timeString.getMinutes().toString().padStart(2, '0')}`;
		}
		// Fallback
		return timeString ? timeString.toString() : '';
	},

	formatTime: function (date) {
		const h = date.getHours();
		const m = date.getMinutes().toString().padStart(2, "0");
		if (this.config.timeFormat === 12) {
			return ((h % 12 || 12) + (m > 0 ? `:${m}` : "") + (h < 12 ? "am" : "pm"));
		} else {
			return `${h}:${m}`;
		}
	}
});
