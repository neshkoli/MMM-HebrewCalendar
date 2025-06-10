// ip-utils.js
// Utility functions for IP address fetching and display

/**
 * IP utility class for handling IP address fetching and display
 */
class IpUtils {
	constructor(moduleInstance) {
		this.module = moduleInstance;
		// No longer needed for internal IP fetching
		this.ipServices = [];
	}

	/**
	 * Fetches the user's internal IP address 
	 * @param {Function} onSuccess - Callback function when IP is successfully fetched
	 * @param {Function} onError - Callback function when IP fetching fails
	 */
	fetchUserIpAddress(onSuccess, onError) {
		console.log('DEBUG: fetchUserIpAddress called - fetching internal IP');
		console.log('DEBUG: Starting to fetch internal IP address...');
		
		// Send debug message to node_helper
		this.module.sendSocketNotification('DEBUG_MESSAGE', 'fetchUserIpAddress function called for internal IP');
		
		// Try WebRTC method first (works in modern browsers)
		this.getInternalIpViaWebRTC(onSuccess, onError);
	}

	/**
	 * Gets internal IP address using WebRTC
	 * @param {Function} onSuccess - Callback function when IP is successfully fetched
	 * @param {Function} onError - Callback function when IP fetching fails
	 */
	getInternalIpViaWebRTC(onSuccess, onError) {
		try {
			// Create a dummy peer connection
			const rtc = new RTCPeerConnection({iceServers: []});
			
			// Create a data channel
			rtc.createDataChannel('');
			
			// Create offer and set local description
			rtc.createOffer().then(offer => {
				rtc.setLocalDescription(offer);
			});
			
			// Listen for ICE candidates
			rtc.onicecandidate = (event) => {
				if (event.candidate) {
					const candidate = event.candidate.candidate;
					
					// Extract IP from candidate string
					const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
					if (ipMatch) {
						const ip = ipMatch[1];
						
						// Filter out non-private IPs (we want local network IPs)
						if (this.isPrivateIP(ip)) {
							console.log('Successfully retrieved internal IP address via WebRTC:', ip);
							rtc.close();
							if (onSuccess) onSuccess(ip);
							return;
						}
					}
				}
			};
			
			// Fallback to node_helper if WebRTC fails
			setTimeout(() => {
				rtc.close();
				console.log('WebRTC method failed or timed out, trying node_helper fallback...');
				this.module.sendSocketNotification('GET_INTERNAL_IP_ADDRESS');
			}, 3000);
			
		} catch (error) {
			console.error('WebRTC method failed:', error);
			// Fallback to node_helper
			this.module.sendSocketNotification('GET_INTERNAL_IP_ADDRESS');
		}
	}

	/**
	 * Checks if an IP address is a private/internal IP
	 * @param {string} ip - The IP address to check
	 * @returns {boolean} True if IP is private, false otherwise
	 */
	isPrivateIP(ip) {
		const parts = ip.split('.').map(Number);
		
		// Check for private IP ranges:
		// 10.0.0.0 - 10.255.255.255
		if (parts[0] === 10) return true;
		
		// 172.16.0.0 - 172.31.255.255
		if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
		
		// 192.168.0.0 - 192.168.255.255
		if (parts[0] === 192 && parts[1] === 168) return true;
		
		// 169.254.0.0 - 169.254.255.255 (link-local)
		if (parts[0] === 169 && parts[1] === 254) return true;
		
		return false;
	}

	/**
	 * Creates the IP display element for the DOM
	 * @param {string} ipAddress - The IP address to display
	 * @returns {HTMLElement} The IP display element
	 */
	createIpDisplayElement(ipAddress) {
		// Create IP display div using the global el function
		let ipText = "";
		if (ipAddress) {
			ipText = "IP: " + ipAddress;
		} else {
			ipText = "IP: " + (ipAddress === null ? "Not fetched" : "Loading...");
		}
		
		return el("div", { 
			className: "ip-display",
			innerHTML: ipText
		});
	}

	/**
	 * Creates the location and IP container element
	 * @param {string} locationName - The location name to display
	 * @param {string} ipAddress - The IP address to display
	 * @returns {HTMLElement} The location container element
	 */
	createLocationContainer(locationName, ipAddress) {
		// Create flex container for left-aligned location and right-aligned IP
		const container = el("div", { className: "location-display-container" });
		
		// Left side - location text
		const locationText = el("div", { 
			className: "location-text",
			innerHTML: "Zmanim for " + locationName
		});
		container.appendChild(locationText);
		
		// Right side - IP address (only if available)
		if (ipAddress) {
			const ipDisplay = el("div", { 
				className: "ip-display",
				innerHTML: "IP: " + ipAddress
			});
			container.appendChild(ipDisplay);
		}
		
		return container;
	}

	/**
	 * Handles IP address socket notifications
	 * @param {string} notification - The notification type
	 * @param {*} payload - The notification payload
	 * @param {Function} onIpReceived - Callback when IP is received
	 * @param {Function} onIpError - Callback when IP error occurs
	 * @returns {boolean} True if notification was handled, false otherwise
	 */
	handleSocketNotification(notification, payload, onIpReceived, onIpError) {
		if (notification === "INTERNAL_IP_ADDRESS_RESULT") {
			console.log("Internal IP address received from node_helper:", payload);
			if (onIpReceived) onIpReceived(payload);
			return true;
		} else if (notification === "INTERNAL_IP_ADDRESS_ERROR") {
			console.error("Error fetching internal IP address from node_helper:", payload);
			if (onIpError) onIpError('Unknown');
			return true;
		}
		return false;
	}
}

// Helper function to create DOM elements (for standalone use)
function createElement(tag, options) {
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	// Node.js environment
	module.exports = {
		IpUtils,
		createElement
	};
} else if (typeof window !== 'undefined') {
	// Browser environment - make available globally
	window.IpUtils = IpUtils;
	window.ipUtilsCreateElement = createElement;
}
