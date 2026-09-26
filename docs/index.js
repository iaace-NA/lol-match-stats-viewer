/**
 * League of Legends Match Statistics Viewer
 *
 * A browser-based application for visualizing League of Legends match statistics
 * from Riot Games API v4 and v5 match data. Provides interactive charts and
 * detailed statistics breakdowns.
 *
 * @author iaace LLC
 * @version 2.0.0
 * @license AGPL-3.0
 *
 * Loaded as an ES module (strict mode, runs after the document is parsed). The page is rendered
 * with lit-html templates; match.js, queue_groups.js and Plotly are classic scripts loaded
 * before this one, so their globals (Match, QUEUE_GROUPS, Plotly) are available here.
 */

import { html, render, nothing } from './lit-html-3.3.3/lit-html.js';
import { repeat } from './lit-html-3.3.3/directives/repeat.js';
import { live } from './lit-html-3.3.3/directives/live.js';

/**
 * Application configuration and constants
 */
const CONFIG = {
	// API endpoints and data sources
	DDRAGON_BASE_URL: 'https://ddragon.leagueoflegends.com/cdn',
	EXAMPLE_DATA_PATH: 'example-data',

	// Named example presets for ?example=<key>: [matchFile, timelineFile, label]
	// A null timelineFile means no timeline is loaded for that preset.
	EXAMPLE_PRESETS: {
		"5r": ["v5-rq.json",      "v5-rq.json",      "Summoner's Rift (match-v5)"],
		"5s": ["v5.json",         null,              "Summoner's Rift, no timeline (match-v5)"],
		"a":  ["arena.json",      "arena.json",      "Arena (match-v5)"],
		"a3": ["arena3.json",     "arena3.json",     "Arena, 3 augments (match-v5)"],
		"4":  ["2808045821.json", "2808045821.json", "Summoner's Rift (match-v4)"],
	},
	DEFAULT_EXAMPLE: ["v5.json", "v5.json"],

	// Chart configuration
	DEFAULT_CHART_HEIGHT: 600,
	MAX_SELECTOR_HEIGHT: 400,

	// Performance settings
	GRAPH_UPDATE_DELAY: 500,

	// UI text and labels
	APP_NAME: 'LoL Match Statistics Viewer',
	ERROR_MESSAGES: {
		NO_DATA: 'No match or timeline data provided, or the data could not be loaded. Please select an example or provide valid data sources in the URL.',
		INVALID_JSON: 'Invalid JSON data format.',
		NETWORK_ERROR: 'Failed to load data from the provided URL.',
		PROCESSING_ERROR: 'Error processing match data.'
	}
};

/**
 * Statistical data configuration and utilities
 */
const STAT_CONFIG = {
	// Stats to exclude from analysis
	EXCLUDED_STATS: [
		"playerScore0", "playerScore1", "playerScore2", "playerScore3", "playerScore4",
		"playerScore5", "playerScore6", "playerScore7", "playerScore8", "playerScore9",
		"item0", "item1", "item2", "item3", "item4", "item5", "item6", "roleBoundItem", "participantId",
		"teamId", "championId", "spell1Id", "spell2Id", "playerSubteamId", "subteamPlacement",
        "combatPlayerScore", "objectivePlayerScore", "totalPlayerScore", "totalScoreRank"
	],

	// Human-readable translations for stat names
	STAT_TRANSLATIONS: {
		"longestTimeSpentLiving": "Longest Duration Alive (seconds)",
		"spell1Casts": "Q Ability Casts",
		"spell2Casts": "W Ability Casts",
		"spell3Casts": "E Ability Casts",
		"spell4Casts": "R Ability Casts",
		"summoner1Casts": "D Summoner Casts",
		"summoner2Casts": "F Summoner Casts",
		"totalMinionsKilled": "Lane Minions Killed",
		"neutralMinionsKilled": "Neutral Units Killed",
		"timeCCingOthers": "Effective CC Duration (seconds)",
		"totalTimeCCDealt": "Total CC Duration (seconds)",
		"visionWardsBoughtInGame": "Control Wards Purchased",
		"sightWardsBoughtInGame": "Sight Wards Purchased",
		"totalUnitsHealed": "Unique Targets Healed"
	},

	// Stats that should be prioritized in dropdowns
	PRIORITIZED_STATS: [
		"kills", "deaths", "assists", "totalDamageDealtToChampions",
		"goldEarned", "visionScore", "totalMinionsKilled", "wardsPlaced",
		"turretKills", "totalHeal", "damageDealtToObjectives"
	],

	// Stats that work well in graph format
	GRAPHABLE_STATS: [
		"kills", "deaths", "assists", "totalDamageDealtToChampions",
		"goldEarned", "visionScore", "totalMinionsKilled", "wardsPlaced",
		"turretKills", "totalHeal", "damageDealtToObjectives",
		"magicDamageDealtToChampions", "physicalDamageDealtToChampions", "trueDamageDealtToChampions",
		"totalDamageTaken", "damageDealtToTurrets", "timeCCingOthers", "totalTimeCrowdControlDealt",
		"neutralMinionsKilled", "wardsKilled", "spell1Casts", "spell2Casts", "spell3Casts", "spell4Casts"
	],

	// Organized stat categories for UI grouping
	CATEGORIES: [
		{
			name: "Damage",
			stats: [
				"totalDamageDealtToChampions",
				"physicalDamageDealtToChampions", "magicDamageDealtToChampions", "trueDamageDealtToChampions",
				"totalDamageDealt", "physicalDamageDealt", "magicDamageDealt", "trueDamageDealt",
				"largestCriticalStrike", "damageDealtToObjectives", "damageDealtToTurrets"
			]
		},
		{
			name: "Combat Stats",
			stats: [
				"champLevel", "kills", "deaths", "assists",
				"doubleKills", "tripleKills", "quadraKills", "pentaKills", "unrealKills",
				"largestKillingSpree", "largestMultiKill", "killingSprees",
				"longestTimeSpentLiving", "firstBloodKill", "firstBloodAssist"
			]
		},
		{
			name: "Durability",
			stats: [
				"totalDamageTaken", "physicalDamageTaken", "magicalDamageTaken", "trueDamageTaken",
				"damageSelfMitigated", "totalHeal", "totalUnitsHealed",
				"totalDamageShieldedOnTeammates", "totalHealsOnTeammates"
			]
		},
		{
			name: "Economy",
			stats: [
				"goldEarned", "goldSpent", "totalMinionsKilled", "neutralMinionsKilled"
			]
		},
		{
			name: "Vision & Control",
			stats: [
				"visionScore", "wardsPlaced", "wardsKilled", "visionWardsBoughtInGame",
				"sightWardsBoughtInGame", "timeCCingOthers", "totalTimeCrowdControlDealt",
				"totalTimeCCDealt"
			]
		},
		{
			name: "Objectives",
			stats: [
				"turretKills", "inhibitorKills", "firstTowerKill", "firstTowerAssist",
				"firstInhibitorKill", "firstInhibitorAssist"
			]
		},
		{
			name: "Ability Usage",
			stats: [
				"spell1Casts", "spell2Casts", "spell3Casts", "spell4Casts",
				"summoner1Casts", "summoner2Casts"
			]
		},
		{
			name: "Other",
			stats: [] // Populated dynamically with uncategorized stats
		}
	]
};

/**
 * Region mapping for display purposes
 */
const REGIONS = {
	"BR1": "BR", "EUN1": "EUNE", "EUW1": "EUW", "JP1": "JP", "KR": "KR",
	"LA1": "LAN", "LA2": "LAS", "NA1": "NA", "OC1": "OCE", "TR1": "TR",
	"RU": "RU", "PBE1": "PBE", "PH2": "PH", "SG2": "SG", "TH2": "TH",
	"TW2": "TW", "VN2": "VN", "ME1": "ME"
};

/**
 * A problem with the page's query parameters. Carries a message for the page (title, text)
 * and a separate, more technical message for the developer console.
 */
class UrlParamError extends Error {
	constructor(title, userMessage, devMessage) {
		super(devMessage);
		this.name = 'UrlParamError';
		this.title = title;
		this.userMessage = userMessage;
		this.devMessage = devMessage;
	}
}

/**
 * Application state management
 */
class AppState {
	constructor() {
		this.matchUrl = null;
		this.timelineUrl = null;
		this.match = null;
		this.championData = null;
		this.spellData = null;
		this.runeData = null;
		this.activeDragonVersion = null;
		this.isInitialized = false;
	}

	/**
	 * Initialize application state from URL parameters.
	 * Sets this.paramError (a UrlParamError) when the match cannot be loaded from the given parameters.
	 */
	initialize() {
		const exampleParam = UrlUtils.getParameterByName("example");
		this.paramError = null;

		if (exampleParam !== null) {
			const preset = CONFIG.EXAMPLE_PRESETS[exampleParam];
			if (!preset) {
				// Documented behavior: any unrecognized value loads the default example
				console.warn(`[lol-match-stats-viewer] Unknown example preset "${exampleParam}"; loading the default example. ` +
					`Valid presets: ${Object.keys(CONFIG.EXAMPLE_PRESETS).join(", ")}.`);
			}
			const [matchFile, timelineFile] = preset || CONFIG.DEFAULT_EXAMPLE;
			this.matchUrl    = `${CONFIG.EXAMPLE_DATA_PATH}/match/${matchFile}`;
			this.timelineUrl = timelineFile ? `${CONFIG.EXAMPLE_DATA_PATH}/timeline/${timelineFile}` : null;
		} else {
			this.matchUrl    = UrlUtils.getParameterByName("match");
			this.timelineUrl = UrlUtils.getParameterByName("timeline");
			this.paramError  = this.validateParams();
		}

		this.isInitialized = true;
	}

	/**
	 * Check the match/timeline parameters. An unusable timeline is dropped with a warning,
	 * since the page still works without one; an unusable match is returned as an error.
	 * @returns {UrlParamError|null}
	 */
	validateParams() {
		const received = `Received: match=${JSON.stringify(this.matchUrl)}, timeline=${JSON.stringify(this.timelineUrl)}.`;

		if (this.timelineUrl !== null && (this.timelineUrl === "" || !SecurityUtils.isUrlSafe(this.timelineUrl))) {
			console.warn(`[lol-match-stats-viewer] Ignoring the "timeline" parameter: it must be a non-empty http(s) URL. ${received}`);
			this.timelineUrl = null;
		}

		if (this.matchUrl === null) {
			return new UrlParamError(
				"No match selected",
				this.timelineUrl
					? "A timeline was provided, but a timeline can only be shown together with its match."
					: "This viewer shows the details of one League of Legends match. Open it with a link to the match data, or try one of the examples below.",
				`Missing required "match" parameter. ${received}`
			);
		}
		if (this.matchUrl === "") {
			return new UrlParamError(
				"The match link is empty",
				"The link you opened has a match parameter but no address in it. It may have been cut off when it was copied.",
				`The "match" parameter is empty. ${received}`
			);
		}
		if (!SecurityUtils.isUrlSafe(this.matchUrl)) {
			return new UrlParamError(
				"The match link isn't valid",
				"The match data must come from a web address (http or https).",
				`The "match" parameter must be an http(s) URL (relative URLs are allowed). ${received}`
			);
		}
		return null;
	}
}

/**
 * URL and parameter utilities
 */
class UrlUtils {
	/**
	 * Get URL parameter by name
	 * @param {string} name - Parameter name
	 * @param {string} url - URL to search (defaults to current page)
	 * @returns {string|null} Parameter value or null if not found
	 */
	static getParameterByName(name, url = window.location.href) {
		const escapedName = name.replace(/[\[\]]/g, "\\$&");
		const regex = new RegExp("[?&]" + escapedName + "(=([^&#]*)|&|#|$)");
		const results = regex.exec(url);

		if (!results) return null;
		if (!results[2]) return '';

		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
}

/**
 * Data loading and API utilities
 */
class DataLoader {
	/**
	 * Load JSON data from URL
	 * @param {string} url - URL to load from
	 * @param {boolean} allowNull - Whether null/undefined URLs are allowed
	 * @returns {Promise<Object|null>} Parsed JSON data or null
	 */
	static async loadJSON(url, allowNull = false) {
		if ((url === undefined || url === null) && allowNull) {
			return null;
		}

		if (!url) {
			throw new Error('URL is required');
		}

		try {
			const response = await fetch(url, { method: "GET" });

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Failed to load JSON from:', url, error);
			throw new Error(`${CONFIG.ERROR_MESSAGES.NETWORK_ERROR}: ${error.message}`);
		}
	}

	/**
	 * Load multiple data sources in parallel
	 * @param {Array<string>} urls - Array of URLs to load
	 * @returns {Promise<Array>} Array of loaded data
	 */
	static async loadMultiple(urls) {
		const promises = urls.map(url => this.loadJSON(url, true));
		return Promise.all(promises);
	}
}

/**
 * Security and validation utilities
 */
class SecurityUtils {
	/**
	 * Escape HTML characters to prevent XSS. Lit templates escape on their own; this is for
	 * strings handed to Plotly, which renders hover text and labels as HTML.
	 * @param {*} unsafe - Value to escape
	 * @returns {string} HTML-escaped string
	 */
	static escapeHtml(unsafe) {
		const str = String(unsafe);
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	/**
	 * Validate URL for safety
	 * @param {string} url - URL to validate
	 * @returns {boolean} True if URL appears safe
	 */
	static isUrlSafe(url) {
		try {
			const parsed = new URL(url, window.location.origin);
			return ['http:', 'https:'].includes(parsed.protocol);
		} catch {
			return false;
		}
	}
}

/**
 * DOM manipulation utilities
 */
class DOMUtils {
	/**
	 * Get element by ID with error handling
	 * @param {string} id - Element ID
	 * @returns {HTMLElement|null} Element or null if not found
	 */
	static getElementById(id) {
		const element = document.getElementById(id);
		if (!element) {
			console.warn(`Element with ID '${id}' not found`);
		}
		return element;
	}

	/**
	 * Render a lit template into a container. The first render into a container clears its
	 * static placeholder content (e.g. the loading spinner), since lit only manages what it rendered.
	 * @param {HTMLElement|null} container - Target element
	 * @param {*} template - Anything lit can render (a template, text, `nothing`, ...)
	 */
	static renderInto(container, template) {
		if (!container) return;
		if (!litContainers.has(container)) {
			container.replaceChildren();
			litContainers.add(container);
		}
		render(template, container);
	}

	/**
	 * Show a message in place of a Plotly chart
	 * @param {HTMLElement|null} container - Chart container
	 * @param {string} message - Message text
	 * @param {string} marginTop - CSS top margin, to roughly center the message in the chart area
	 */
	static showChartMessage(container, message, marginTop) {
		if (!container) return;
		Plotly.purge(container);
		DOMUtils.renderInto(container, html`<div class="alert alert-info text-center" style="margin-top: ${marginTop};">${message}</div>`);
	}

	/**
	 * Remove a message shown by showChartMessage, before plotting into the container
	 * @param {HTMLElement|null} container - Chart container
	 */
	static clearChartMessage(container) {
		DOMUtils.renderInto(container, nothing);
	}
}

// Containers that DOMUtils.renderInto has rendered into
const litContainers = new WeakSet();

/**
 * Time formatting utilities
 */
class TimeUtils {
	/**
	 * Format seconds into human-readable duration
	 * @param {number} seconds - Duration in seconds
	 * @returns {string} Formatted duration string
	 */
	static formatDuration(seconds) {
		const totalSeconds = Math.floor(seconds);
		const minutes = Math.floor(totalSeconds / 60) % 60;
		const hours = Math.floor(totalSeconds / 3600) % 24;
		const days = Math.floor(totalSeconds / 86400);
		const secs = totalSeconds % 60;

		const paddedSecs = secs.toString().padStart(2, '0');
		const paddedMins = minutes.toString().padStart(2, '0');

		if (days > 0) {
			return `${days}d:${hours}h:${paddedMins}m:${paddedSecs}s`;
		} else if (hours > 0) {
			return `${hours}h:${paddedMins}m:${paddedSecs}s`;
		} else {
			return `${paddedMins}m:${paddedSecs}s`;
		}
	}
}

/**
 * Game data and asset management
 */
class GameDataManager {
	constructor(state) {
		this.state = state;
	}

	/**
	 * Get champion display name by ID
	 * @param {number} championId
	 * @returns {string|null}
	 */
	getChampionName(championId) {
		if (!this.state.championData) return null;
		for (const championKey in this.state.championData.data) {
			const champ = this.state.championData.data[championKey];
			if (champ.key == championId) {
				return champ.name;
			}
		}
		return null;
	}

	/**
	 * Get champion image template
	 * @param {number} championId - Champion ID
	 * @param {string} cssClass - CSS class for the image
	 * @param {string} [title] - Optional hover tooltip
	 * @returns {TemplateResult} img element or placeholder
	 */
	getChampionImage(championId, cssClass = "champion-img", title) {
		if (!this.state.championData) {
			return html`<div class=${cssClass}>&nbsp;</div>`;
		}

		for (const championKey in this.state.championData.data) {
			if (this.state.championData.data[championKey].key == championId) {
				const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
				const escapedKey = encodeURIComponent(championKey);
				return html`<img class=${cssClass} src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/champion/${escapedKey}.png" alt=${this.state.championData.data[championKey].name} title=${title ?? nothing}>`;
			}
		}

		return html`<div class=${cssClass}>&nbsp;</div>`;
	}

	/**
	 * Get item image template
	 * @param {number} itemId - Item ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {TemplateResult} img element or placeholder
	 */
	getItemImage(itemId, cssClass = "item-img") {
		// !itemId (not itemId === 0) so a missing slot renders the same
		// empty placeholder as an explicitly-empty one -- roleBoundItem (the
		// Patch 26.01+ Role Quest item) is undefined on every match played
		// before that patch, not 0, since the field didn't exist yet.
		if (!itemId) {
			return html`<div class=${cssClass}>&nbsp;</div>`;
		}

		const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
		const escapedId = encodeURIComponent(itemId);
		return html`<img class=${cssClass} src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/item/${escapedId}.png" alt="Item ${itemId}">`;
	}

	/**
	 * Get summoner spell image template
	 * @param {number} spellId - Summoner spell ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {TemplateResult|nothing} img element, or nothing when unknown
	 */
	getSummonerSpellImage(spellId, cssClass = "spell-img") {
		if (!this.state.spellData) {
			return nothing;
		}

		for (const spellKey in this.state.spellData.data) {
			if (this.state.spellData.data[spellKey].key == spellId) {
				const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
				const escapedId = encodeURIComponent(this.state.spellData.data[spellKey].id);
				return html`<img class=${cssClass} src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/spell/${escapedId}.png" alt=${this.state.spellData.data[spellKey].name}>`;
			}
		}

		return nothing;
	}

	/**
	 * Get rune image template
	 * @param {number} runeId - Rune ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {TemplateResult|nothing} img element, or nothing when unknown
	 */
	getRuneImage(runeId, cssClass = "rune-img") {
		if (!this.state.runeData) {
			return nothing;
		}

		const runeImage = (rune) => html`<img class=${cssClass} src="${CONFIG.DDRAGON_BASE_URL}/img/${encodeURIComponent(rune.icon)}" alt=${rune.name}>`;

		// Search through rune trees and their slots
		for (const runeTree of this.state.runeData) {
			// Check main rune tree
			if (runeTree.id === runeId) {
				return runeImage(runeTree);
			}

			// Check individual runes in slots
			for (const slot of runeTree.slots) {
				for (const rune of slot.runes) {
					if (rune.id === runeId) {
						return runeImage(rune);
					}
				}
			}
		}

		return nothing;
	}
}

/**
 * Convert camelCase to Title Case
 */
function camelToTitleCase(str) {
	return str
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, char => char.toUpperCase());
}

/**
 * Get participant stat value, handling both traditional matches (nested stats) and Arena matches (flat structure)
 * @param {Object} participant - The participant object
 * @param {string} statName - The stat property name to retrieve
 * @returns {*} The stat value or undefined if not found
 */
function getParticipantStat(participant, statName) {
	// For Arena matches, stats are directly on the participant object
	if (participant[statName] !== undefined) {
		return participant[statName];
	}

	// For traditional matches, stats are nested under the stats property
	if (participant.stats && participant.stats[statName] !== undefined) {
		return participant.stats[statName];
	}

	return undefined;
}

/**
 * Get participant display name, handling both traditional matches and Arena matches
 * @param {Object} match - The match object
 * @param {Object} participant - The participant object
 * @returns {string} The player's display name
 */
function getParticipantName(match, participant) {
	// For Arena matches, player names are directly on the participant
	if (participant.riotIdGameName) {
		return participant.riotIdTagline ?
			`${participant.riotIdGameName}#${participant.riotIdTagline}` :
			participant.riotIdGameName;
	}

	// For traditional matches, use participantIdentities
	if (match.participantIdentities) {
		const pI = match.participantIdentities.find(pI => pI.participantId === participant.participantId);
		if (pI && pI.player) {
			return pI.player.summonerName || `Player ${participant.participantId}`;
		}
	}

	return `Player ${participant.participantId}`;
}

/**
 * Get all available stat names from a participant, handling both match formats
 * @param {Object} participant - The participant object
 * @param {boolean} isArena - Whether this is an Arena match
 * @returns {string[]} Array of available stat names
 */
function getParticipantStatNames(participant, isArena = false) {
	const statNames = [];

	// Arena-specific stats that should be excluded for non-Arena matches
	const arenaOnlyStats = [
		'placement', 'playerAugment1', 'playerAugment2', 'playerAugment3', 
		'playerAugment4', 'playerAugment5', 'playerAugment6', 'subteamPlacement'
	];

	// For Arena matches, stats are directly on the participant object
	for (const prop in participant) {
		if (participant.hasOwnProperty(prop) &&
			!exclude_stat_name.includes(prop) &&
			prop !== 'stats' && // Exclude the nested stats object itself
			prop !== 'perks' && // Exclude complex objects
			prop !== 'challenges' && // Exclude complex objects
			prop !== 'missions' && // Exclude complex objects
			typeof participant[prop] === 'number') { // Only include numeric values for stats
			
			// Skip Arena-only stats for non-Arena matches
			if (!isArena && arenaOnlyStats.includes(prop)) {
				continue;
			}
			
			statNames.push(prop);
		}
	}

	// For traditional matches, also include nested stats
	if (participant.stats) {
		for (const prop in participant.stats) {
			if (participant.stats.hasOwnProperty(prop) &&
				!exclude_stat_name.includes(prop) &&
				!statNames.includes(prop)) { // Avoid duplicates
				
				// Skip Arena-only stats for non-Arena matches
				if (!isArena && arenaOnlyStats.includes(prop)) {
					continue;
				}
				
				statNames.push(prop);
			}
		}
	}

	return statNames;
}

/**
 * Determine whether a match is an Arena match.
 * Covers classic Arena (queue 1700) and Arena 3x6 (queue 1750),
 * plus any future Arena queues that expose subteam data.
 * @param {Object} match - The match object
 * @returns {boolean} True if the match should be rendered as Arena
 */
function isArenaMatch(match) {
	if (!match) return false;
	if (match.queueId === 1700 || match.queueId === 1750) {
		return true;
	}
	// Fallback: detect Arena by the presence of *meaningful* subteam data on
	// participants. Modern v5 payloads include playerSubteamId/subteamPlacement
	// defaulted to 0 for every queue, so a value of 0 must not count as Arena.
	if (Array.isArray(match.participants)) {
		return match.participants.some(p => {
			const subId = getParticipantStat(p, 'playerSubteamId');
			const subPlace = getParticipantStat(p, 'subteamPlacement');
			return (subId !== undefined && subId !== null && subId !== 0) ||
				(subPlace !== undefined && subPlace !== null && subPlace !== 0);
		});
	}
	return false;
}

/**
 * Group Arena participants into subteams (duos for 2x8, trios for 3x6).
 * Subteams are ordered by their placement (1st, 2nd, ...) and, within a
 * subteam, participants keep their original relative order.
 * @param {Object} match - The match object
 * @returns {Array<{subteamId: number, placement: number, win: boolean, participants: Object[]}>}
 */
function getArenaSubteams(match) {
	const groups = new Map();
	const order = [];

	(match.participants || []).forEach((p, index) => {
		// Group by subteam id, falling back to placement so that players are
		// still grouped sensibly even if subteam ids are missing.
		let key = getParticipantStat(p, 'playerSubteamId');
		if (key === undefined || key === null) {
			key = getParticipantStat(p, 'subteamPlacement');
		}
		if (key === undefined || key === null) {
			key = getParticipantStat(p, 'placement');
		}
		if (key === undefined || key === null) {
			key = `p${index}`;
		}

		if (!groups.has(key)) {
			const placement = getParticipantStat(p, 'subteamPlacement')
				|| getParticipantStat(p, 'placement')
				|| 99;
			groups.set(key, {
				subteamId: key,
				placement,
				win: !!getParticipantStat(p, 'win'),
				participants: []
			});
			order.push(key);
		}
		groups.get(key).participants.push(p);
	});

	const subteams = order.map(key => groups.get(key));
	subteams.sort((a, b) => a.placement - b.placement);
	return subteams;
}

/**
 * Flatten Arena subteams into a single participant list following the same
 * ordering used by the scoreboard (subteam placement, then in-subteam order).
 * @param {Object} match - The match object
 * @returns {Object[]} Ordered participant list
 */
function getArenaOrderedParticipants(match) {
	const ordered = [];
	for (const subteam of getArenaSubteams(match)) {
		for (const p of subteam.participants) {
			ordered.push(p);
		}
	}
	return ordered;
}

// Initialize application components
const appState = new AppState();
const gameDataManager = new GameDataManager(appState);

// Queue configuration
const QUEUE_MAP = {};
for (const queue of QUEUE_GROUPS) {
	QUEUE_MAP[queue.id] = queue.name;
}

// Legacy compatibility assignments
let match_url, match_timeline_url, addv, spell_data, champion_data, rune_data;
const queues = QUEUE_MAP;
const exclude_stat_name = STAT_CONFIG.EXCLUDED_STATS;
const stat_name_translation = STAT_CONFIG.STAT_TRANSLATIONS;
const prioritized_stats = STAT_CONFIG.PRIORITIZED_STATS;
const graphable_stats = STAT_CONFIG.GRAPHABLE_STATS;
const stat_categories = STAT_CONFIG.CATEGORIES;
const regions = REGIONS;

// Legacy functions for backward compatibility
function $(id) { return DOMUtils.getElementById(id); }
function escapeHtml(unsafe) { return SecurityUtils.escapeHtml(unsafe); }
function getParameterByName(name, url) { return UrlUtils.getParameterByName(name, url); }
function loadJSON(url, allowNull) { return DataLoader.loadJSON(url, allowNull); }
function standardTimestamp(seconds) { return TimeUtils.formatDuration(seconds); }
function renderInto(container, template) { DOMUtils.renderInto(container, template); }
function championIDtoImg(id, cssClass, title) { return gameDataManager.getChampionImage(id, cssClass, title); }
function itemIDtoImg(id, cssClass) { return gameDataManager.getItemImage(id, cssClass); }
function spellIDtoImg(id, cssClass) { return gameDataManager.getSummonerSpellImage(id, cssClass); }
function runeIDtoImg(id, cssClass) { return gameDataManager.getRuneImage(id, cssClass); }

// Human-readable stat name
function statDisplayName(statName) {
	return stat_name_translation[statName] || camelToTitleCase(statName);
}

// Initialize legacy variables
appState.initialize();
match_url = appState.matchUrl;
match_timeline_url = appState.timelineUrl;
let arenaAugmentMap = {};

// Stats table cells that show something other than the raw value
const stat_value_override = {
	"perk0": runeCellContent,
	"perk1": runeCellContent,
	"perk2": runeCellContent,
	"perk3": runeCellContent,
	"perk4": runeCellContent,
	"perk5": runeCellContent,
	"perkPrimaryStyle": runeCellContent,
	"perkSubStyle": runeCellContent,
	// Arena augment IDs → names (stats table only)
	"playerAugment1": augmentCellContent,
	"playerAugment2": augmentCellContent,
	"playerAugment3": augmentCellContent,
	"playerAugment4": augmentCellContent,
	"playerAugment5": augmentCellContent,
	"playerAugment6": augmentCellContent,
};

function runeCellContent(id) {
	return runeIDtoImg(id);
}

function augmentCellContent(id) {
	// Only display names in the stats table. 0/undefined means no augment selected.
	if (id === 0 || id === undefined || id === null) {
		return "";
	}
	const aug = arenaAugmentMap ? arenaAugmentMap[id] : undefined;
	return aug && aug.name ? aug.name : String(id);
}

// Main execution - maintaining original structure but using new utilities
(appState.paramError ? Promise.reject(appState.paramError) : loadJSON(match_url)).then(match_data => {
	let match = new Match(match_data, null, true, champion_data);
	const major_patch = match.gameVersion.substring(0, match.gameVersion.indexOf(".", match.gameVersion.indexOf(".") + 1));
	addv = major_patch + ".1";
	appState.activeDragonVersion = addv;

	renderInto($("metadata"), metadataTemplate(match, major_patch));

	Promise.all([
		loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/champion.json`),
		loadJSON(match_timeline_url, true),
		loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/summoner.json`),
		loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/runesReforged.json`),
		loadJSON("arena_augments.json")
	]).then(responses => {
		console.log(responses);
		champion_data = responses[0];
		const timeline_data = responses[1];
		spell_data = responses[2];
		rune_data = responses[3];
		const arena_augments = responses[4];

		// Build Arena Augment lookup map (ID -> metadata)
		arenaAugmentMap = {};
		if (Array.isArray(arena_augments)) {
			for (const aug of arena_augments) {
				if (aug && aug.id !== undefined && aug.id !== null) {
					arenaAugmentMap[aug.id] = {
						name: aug.nameTRA || String(aug.id),
						icon: aug.augmentSmallIconPath || null,
						rarity: aug.rarity || null,
					};
				}
			}
		}

		// Update app state
		appState.championData = champion_data;
		appState.spellData = spell_data;
		appState.runeData = rune_data;

		match = new Match(match_data, timeline_data, true, champion_data);
		console.log(match);

		// Check if this is an Arena match (queue 1700 = 2x8, queue 1750 = 3x6)
		const isArena = isArenaMatch(match);

		renderInto($("scoreboard"), scoreboardTemplate(match, isArena));
		renderInto($("player-stats"), playerStatsTemplate(match, isArena));

		// Initialize the stats graph controls
		populateStatSelector(match);
		$("chart-type-selector").addEventListener('change', updateStatsGraph);
		$("sum-selections-checkbox").addEventListener('change', updateStatsGraph);
		$("clear-all-stats").addEventListener('click', (e) => {
			e.preventDefault();
			statSelector.selected.clear();
			renderStatSelector();
			updateStatsGraph();
		});

		// Plot the default selected stats on page load
		// Render as soon as the DOM has painted and containers have dimensions
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				updateStatsGraph();

				// Render the timeline explorer and timeline graphs after initial graph setup
				renderTimelineExplorer(match);
				renderTimelineGraph(match);
			});
		});
	}).catch(handleError);
}).catch(handleError);

// Page heading: queue, date, and match details
function metadataTemplate(match, majorPatch) {
	const created = new Date(match.gameCreation);
	return html`<h1>${queues[match.queueId]}</h1>
		<p class="m-1">${created.toLocaleDateString()} ${created.toLocaleTimeString()}</p>
		<p class="m-1">Region: ${regions[match.platformId]}, Match ID: ${match.gameId}, Patch ${majorPatch}, Duration: ${standardTimestamp(match.gameDuration)}</p>`;
}

// English ordinal: 1st, 2nd, 3rd, 4th, ..., 11th, 12th, 13th, 21st, ...
function ordinal(n) {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// Scoreboard: one section per team (or, for Arena, per subteam ordered by placement)
function scoreboardTemplate(match, isArena) {
	let sections;
	if (isArena) {
		// Arena players are grouped into their subteams (duos for 2x8, trios for 3x6)
		sections = getArenaSubteams(match).map(subteam => {
			const placement = subteam.placement && subteam.placement !== 99 ? subteam.placement : null;
			return {
				championHeader: "Champion",
				nameHeader: placement ? `${ordinal(placement)} Place` : 'Placement ?',
				participants: subteam.participants
			};
		});
	} else {
		// Traditional team-based matches; the champion header also shows the team's bans
		sections = match.teams.map((team, team_index) => ({
			championHeader: html`Champion ${team.bans.map(ban => html`<div style="border: 2px solid red; display: inline-block;">${championIDtoImg(ban.championId, "champion-ban-img")}</div>`)}`,
			nameHeader: `Team ${team_index + 1} (${team.win})`,
			participants: match.participants.filter(p => p.teamId == team.teamId)
		}));
	}

	return html`<table class="table">${sections.map((section, index) => html`<thead class="sticky"><tr>
		<th>Rune</th>
		<th>Spells</th>
		<th>Level</th>
		<th>${section.championHeader}</th>
		<th>${section.nameHeader}</th>
		<th class="tal">Items</th>
		<th>K / D / A</th>
		<th>CS</th>
		<th>Gold</th>
		</tr></thead><tbody>${section.participants.map(p => scoreboardRowTemplate(match, p))}${index < sections.length - 1 ? html`<tr><td>&nbsp;</td></tr>` : nothing}</tbody>`)}</table>`;
}

function scoreboardRowTemplate(match, p) {
	return html`<tr class="match-${getParticipantStat(p, 'win') ? "victory" : "defeat"}">
		<td>${runeIDtoImg(getParticipantStat(p, 'perk0'))}</td>
		<td>${spellIDtoImg(p.spell1Id)}${spellIDtoImg(p.spell2Id)}</td>
		<td>${getParticipantStat(p, 'champLevel')}</td>
		<td><div class="champion-cell"><span class="champion-name">${gameDataManager.getChampionName(p.championId) || ''}</span>${championIDtoImg(p.championId)}</div></td>
		<td>${getParticipantName(match, p)}</td>
		<td class="tal">${itemIDtoImg(getParticipantStat(p, 'item0'))}
		${itemIDtoImg(getParticipantStat(p, 'item1'))}
		${itemIDtoImg(getParticipantStat(p, 'item2'))}
		${itemIDtoImg(getParticipantStat(p, 'item3'))}
		${itemIDtoImg(getParticipantStat(p, 'item4'))}
		${itemIDtoImg(getParticipantStat(p, 'item5'))}
		${itemIDtoImg(getParticipantStat(p, 'item6'), "item-img ms-5")}
		${itemIDtoImg(getParticipantStat(p, 'roleBoundItem'), "item-img ms-1")}</td>
		<td>${getParticipantStat(p, 'kills')} / ${getParticipantStat(p, 'deaths')} / ${getParticipantStat(p, 'assists')}</td>
		<td>${(getParticipantStat(p, 'neutralMinionsKilled') || 0) + (getParticipantStat(p, 'totalMinionsKilled') || 0)}</td>
		<td>${getParticipantStat(p, 'goldEarned')}</td></tr>`;
}

// Full stats table: one column per player, one row per stat
function playerStatsTemplate(match, isArena) {
	// Collect all available stats from all participants (use original order for comprehensive stat collection)
	const participant_stat_props = [];
	for (const participant of match.participants) {
		for (const prop_name of getParticipantStatNames(participant, isArena)) {
			if (!participant_stat_props.includes(prop_name)) {
				participant_stat_props.push(prop_name);
			}
		}
	}

	// Use same participant order as scoreboard - sorted by placement for Arena, original order for others
	const orderedParticipants = isArena ? getArenaOrderedParticipants(match) : match.participants;

	return html`<table class="table table-striped mt-5"><thead class="sticky">
		<tr><th>Summoner Name</th>${orderedParticipants.map(p => html`<th>${getParticipantName(match, p)}</th>`)}</tr>
		<tr><th>Champion</th>${orderedParticipants.map(p => html`<th><div class="champion-header">${championIDtoImg(p.championId)}<div class="champion-name">${gameDataManager.getChampionName(p.championId) || ''}</div></div></th>`)}</tr>
		</thead><tbody>${participant_stat_props.map(prop_name => html`<tr><td class="tal fw-bold">${statDisplayName(prop_name)}</td>${orderedParticipants.map(p => statCellTemplate(p, prop_name))}</tr>`)}</tbody></table>`;
}

function statCellTemplate(participant, statName) {
	const statValue = getParticipantStat(participant, statName);
	if (statValue === null || statValue === undefined) {
		return html`<td></td>`;
	}
	if (stat_value_override[statName]) {
		return html`<td>${stat_value_override[statName](statValue)}</td>`;
	}
	const classes = statValue === true ? "bool-true" : statValue === false ? "bool-false" : nothing;
	return html`<td class=${classes}>${String(statValue)}</td>`;
}

// Page usage shown with parameter errors: example links plus the expected URL format
function paramHelpTemplate() {
	return html`<p class="mb-1 fw-semibold">Examples</p>
		<ul class="mb-3">${Object.entries(CONFIG.EXAMPLE_PRESETS).map(([key, [, , label]]) => html`<li><a href="?example=${encodeURIComponent(key)}">${label}</a></li>`)}</ul>
		<p class="mb-1 fw-semibold">Link format</p>
		<code class="d-block text-break">?match=&lt;URL of match JSON&gt;&amp;timeline=&lt;URL of timeline JSON (optional)&gt;</code>
		<p class="small text-body-secondary mt-2 mb-0">Both URLs should be URL-encoded and point to Riot API match-v4 or match-v5 JSON.</p>`;
}

function showParamError(err) {
	console.warn(`[lol-match-stats-viewer] ${err.devMessage}\n` +
		`Expected: ?match=<url>[&timeline=<url>] or ?example=<${Object.keys(CONFIG.EXAMPLE_PRESETS).join("|")}>. ` +
		`URLs must be http(s) (relative allowed) and URL-encoded.`);
	renderInto($("scoreboard"), html`<div class="alert alert-warning mt-5 mx-auto" style="max-width: 640px;">
		<h4 class="alert-heading">${err.title}</h4>
		<p>${err.userMessage}</p>
		<hr>
		${paramHelpTemplate()}
	</div>`);
	// Nothing to chart without a match
	["stats-graph-container", "timeline-graph-container", "timeline-explorer"].forEach(id => {
		const el = $(id);
		if (el) el.classList.add("d-none");
	});
}

function handleError(err) {
	if (err instanceof UrlParamError) {
		showParamError(err);
		return;
	}
	console.error(err);
	const message = err instanceof SyntaxError && /JSON/.test(err.message)
		? CONFIG.ERROR_MESSAGES.NO_DATA
		: String(err.message || err);
	renderInto($("scoreboard"), html`<div class="alert alert-danger text-center mt-5">${message}</div>`);
	const statsGraph = $("stats-graph");
	if (statsGraph) {
		Plotly.purge(statsGraph);
		renderInto(statsGraph, nothing);
	}
	renderInto($("player-stats"), nothing);
}

// Function to get the category for a stat
function getStatCategory(statName) {
	for (const category of stat_categories) {
		if (category.stats.includes(statName)) {
			return category.name;
		}
	}
	return "Other";
}

// Function to sort stats by their categories and maintain original ordering within categories
function getSortedStats(availableStats) {
	const statsByCategory = {};

	// Initialize all categories
	for (const category of stat_categories) {
		statsByCategory[category.name] = [];
	}

	// Sort stats into categories
	for (const statName of availableStats) {
		const category = getStatCategory(statName);
		statsByCategory[category].push(statName);
	}

	// For each category, sort stats in the same order they appear in stat_categories
	for (const category of stat_categories) {
		if (statsByCategory[category.name].length > 0) {
			const statsInCategory = [...statsByCategory[category.name]];

			statsInCategory.sort((a, b) => {
				if (category.stats.includes(a) && category.stats.includes(b)) {
					return category.stats.indexOf(a) - category.stats.indexOf(b);
				}
				else if (category.stats.includes(a)) {
					return -1;
				}
				else if (category.stats.includes(b)) {
					return 1;
				}
				else {
					const nameA = stat_name_translation[a] || camelToTitleCase(a);
					const nameB = stat_name_translation[b] || camelToTitleCase(b);
					return nameA.localeCompare(nameB);
				}
			});

			statsByCategory[category.name] = statsInCategory;
		}
	}

	return statsByCategory;
}

// Continue with remaining functions...
// (The rest of the original functions with improved documentation and structure)

// ===== Timeline Explorer =====

// Helper: find participant by id
function getParticipantById(match, participantId) {
    if (!match || !match.participants) return null;
    for (const p of match.participants) {
        if (p.participantId === participantId) return p;
    }
    return null;
}

// Build a flat, chronological list of key timeline events (kills and objectives)
function buildTimelineEvents(match) {
    const events = [];
    if (!match || !match.frames || !Array.isArray(match.frames)) return events;

    const toSeconds = (ts) => Math.max(0, Math.floor((ts || 0) / 1000));
    const teamName = (teamId) => teamId === 100 ? 'Blue' : teamId === 200 ? 'Red' : 'Team';

    for (const frame of match.frames) {
        if (!frame || !Array.isArray(frame.events)) continue;
        for (const ev of frame.events) {
            if (!ev || !ev.type) continue;

            switch (ev.type) {
                case 'CHAMPION_KILL': {
                    const killer = getParticipantById(match, ev.killerId);
                    const victim = getParticipantById(match, ev.victimId);
                    const assists = Array.isArray(ev.assistingParticipantIds) ? ev.assistingParticipantIds : [];
                    events.push({
                        t: toSeconds(ev.timestamp),
                        sortKey: ev.timestamp || 0,
                        kind: 'kill',
                        groupType: 'kill',
                        killer,
                        victim,
                        assists,
                        killerTeamId: killer ? killer.teamId : undefined,
                        victimTeamId: victim ? victim.teamId : undefined
                    });
                    break;
                }
                case 'ITEM_PURCHASED':
                case 'ITEM_SOLD':
                case 'ITEM_DESTROYED':
                case 'ITEM_UNDO':
                case 'ITEM_TRANSFORMED': {
                    const participant = getParticipantById(match, ev.participantId);
                    // Map event type to human-friendly action
                    const actionMap = {
                        'ITEM_PURCHASED': 'purchased',
                        'ITEM_SOLD': 'sold',
                        'ITEM_DESTROYED': 'consumed',
                        'ITEM_UNDO': 'undid',
                        'ITEM_TRANSFORMED': 'transformed'
                    };
                    events.push({
                        t: toSeconds(ev.timestamp),
                        sortKey: ev.timestamp || 0,
                        kind: 'item',
                        groupType: 'item',
                        participant,
                        teamId: participant ? participant.teamId : undefined,
                        action: actionMap[ev.type] || ev.type.toLowerCase(),
                        itemId: ev.itemId,
                        beforeId: ev.beforeId,
                        afterId: ev.afterId
                    });
                    break;
                }
                case 'ELITE_MONSTER_KILL': {
                    const killer = getParticipantById(match, ev.killerId);
                    // Team attribution rules (prefer killerId when present):
                    // 1) If killerId resolves to a participant, use killer.teamId
                    // 2) Else, use killerTeamId when present
                    // 3) Else, fall back to teamId
                    const teamId = (killer && killer.teamId !== undefined)
                        ? killer.teamId
                        : (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                            ? ev.killerTeamId
                            : (ev.teamId !== undefined && ev.teamId !== null)
                                ? ev.teamId
                                : undefined;
                    events.push({
                        t: toSeconds(ev.timestamp),
                        sortKey: ev.timestamp || 0,
                        kind: 'objective',
                        groupType: 'objective',
                        subtype: 'ELITE_MONSTER_KILL',
                        teamId,
                        killer,
                        monsterType: ev.monsterType,
                        monsterSubType: ev.monsterSubType
                    });
                    break;
                }
                case 'BUILDING_KILL': {
                    const killer = getParticipantById(match, ev.killerId);
                    // Prefer killerId for attribution when present
                    const teamId = (killer && killer.teamId !== undefined)
                        ? killer.teamId
                        : (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                            ? ev.killerTeamId
                            : (ev.teamId !== undefined && ev.teamId !== null)
                                ? ev.teamId
                                : undefined;
                    events.push({
                        t: toSeconds(ev.timestamp),
                        sortKey: ev.timestamp || 0,
                        kind: 'objective',
                        groupType: 'building',
                        subtype: 'BUILDING_KILL',
                        teamId,
                        killer,
                        buildingType: ev.buildingType,
                        laneType: ev.laneType,
                        towerType: ev.towerType
                    });
                    break;
                }
                case 'INHIBITOR_KILL': {
                    const killer = getParticipantById(match, ev.killerId);
                    // Prefer killerId for attribution when present
                    const teamId = (killer && killer.teamId !== undefined)
                        ? killer.teamId
                        : (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                            ? ev.killerTeamId
                            : (ev.teamId !== undefined && ev.teamId !== null)
                                ? ev.teamId
                                : undefined;
                    events.push({
                        t: toSeconds(ev.timestamp),
                        sortKey: ev.timestamp || 0,
                        kind: 'objective',
                        groupType: 'building',
                        subtype: 'INHIBITOR_KILL',
                        teamId,
                        killer,
                        laneType: ev.laneType
                    });
                    break;
                }
                default:
                    // ignore other event types for concise explorer
                    break;
            }
        }
    }

    // Sort by timestamp, then number the events so list rows can be keyed by them
    events.sort((a, b) => a.sortKey - b.sortKey);
    events.forEach((e, i) => { e.id = i; });
    return events;
}

// ===== Timeline Explorer Filters =====

const TIMELINE_EVENT_TYPES = [
    { value: 'kill', label: 'Champion Kills' },
    { value: 'objective', label: 'Neutral Objectives' },
    { value: 'building', label: 'Buildings' },
    { value: 'item', label: 'Items (purchases, sells, consumes)' }
];

// Timeline Explorer state: the current match's events (built once) and the filter selections.
// An empty selection doesn't filter at all, so unchecking everything shows every event.
const timelineExplorer = {
    match: null,
    events: [],
    types: new Set(['kill', 'objective', 'building']),
    champions: new Set()
};

const teamBadgeClass = (teamId) => teamId === 100 ? 'bg-primary' : teamId === 200 ? 'bg-danger' : 'bg-secondary';
const teamLabel = (teamId) => teamId === 100 ? 'Blue' : teamId === 200 ? 'Red' : 'Team';
const teamImgClass = (teamId) => teamId === 100 ? 'team-blue' : teamId === 200 ? 'team-red' : 'team-other';

function toggleSetValue(set, value, present) {
    if (present) set.add(value);
    else set.delete(value);
}

function timelineFilterTemplate(match) {
    const byTeam = { 100: [], 200: [], other: [] };
    for (const p of match.participants || []) {
        if (p.teamId === 100) byTeam[100].push(p);
        else if (p.teamId === 200) byTeam[200].push(p);
        else byTeam.other.push(p);
    }

    const championCheckbox = (p) => {
        const id = `tl-champ-${p.participantId}`;
        return html`
            <div class="form-check">
                <input class="form-check-input timeline-champ" type="checkbox" id=${id} value=${p.participantId} data-team=${p.teamId}
                    .checked=${live(timelineExplorer.champions.has(p.participantId))}
                    @change=${(ev) => {
                        toggleSetValue(timelineExplorer.champions, p.participantId, ev.target.checked);
                        renderTimelineExplorer(match);
                    }}>
                <label class="form-check-label d-flex align-items-center" for=${id}>${championIDtoImg(p.championId, `champion-img me-1 ${teamImgClass(p.teamId)}`)}<span class="ms-1">${getParticipantName(match, p)}</span></label>
            </div>`;
    };

    // Blue/Red badges toggle the whole team: uncheck all if all are checked, otherwise check all
    const toggleTeam = (ev, teamId) => {
        ev.preventDefault();
        const ids = byTeam[teamId].map(p => p.participantId);
        const allChecked = ids.every(id => timelineExplorer.champions.has(id));
        ids.forEach(id => toggleSetValue(timelineExplorer.champions, id, !allChecked));
        renderTimelineExplorer(match);
    };

    return html`
        <div class="stat-category">
            <h5>Event Types</h5>
            ${TIMELINE_EVENT_TYPES.map(type => html`
                <div class="form-check">
                    <input class="form-check-input timeline-type" type="checkbox" id="tl-type-${type.value}" value=${type.value}
                        .checked=${live(timelineExplorer.types.has(type.value))}
                        @change=${(ev) => {
                            toggleSetValue(timelineExplorer.types, type.value, ev.target.checked);
                            renderTimelineExplorer(match);
                        }}>
                    <label class="form-check-label" for="tl-type-${type.value}">${type.label}</label>
                </div>`)}
        </div>
        <div class="stat-category mt-3">
            <h5>Champions</h5>
            ${byTeam[100].length ? html`
                <div class="mb-2"><a href="#" class="tl-team-toggle badge bg-primary text-decoration-none me-2" data-team="100" @click=${(ev) => toggleTeam(ev, 100)}>Blue</a></div>
                ${byTeam[100].map(championCheckbox)}` : nothing}
            ${byTeam[200].length ? html`
                <div class="mt-2 mb-2"><a href="#" class="tl-team-toggle badge bg-danger text-decoration-none me-2" data-team="200" @click=${(ev) => toggleTeam(ev, 200)}>Red</a></div>
                ${byTeam[200].map(championCheckbox)}` : nothing}
            ${byTeam.other.length ? html`
                <div class="mt-2 mb-2"><span class="badge bg-secondary me-2">Other</span></div>
                ${byTeam.other.map(championCheckbox)}` : nothing}
        </div>`;
}

function eventMatchesFilters(e) {
    // Type filter
    if (timelineExplorer.types.size) {
        const t = e.groupType || e.kind; // fallback
        if (!timelineExplorer.types.has(t)) return false;
    }

    // Champion filter
    if (timelineExplorer.champions.size) {
        let participants = [];
        if (e.kind === 'kill') {
            if (e.killer && e.killer.participantId) participants.push(e.killer.participantId);
            if (e.victim && e.victim.participantId) participants.push(e.victim.participantId);
            if (Array.isArray(e.assists)) participants.push(...e.assists);
        } else if (e.kind === 'item') {
            if (e.participant && e.participant.participantId) participants.push(e.participant.participantId);
        } else {
            if (e.killer && e.killer.participantId) participants.push(e.killer.participantId);
        }
        if (!participants.some(pid => timelineExplorer.champions.has(pid))) {
            return false;
        }
    }

    return true;
}

// Display name of a neutral objective, e.g. "infernal dragon", "baron nashor"
function monsterName(e) {
    const mType = ((e.monsterType || '') + '').toUpperCase();
    const mSub = ((e.monsterSubType || '') + '').toUpperCase();
    if (mType === 'DRAGON' && mSub) {
        return `${mSub.replace(/_/g, ' ').toLowerCase()} dragon`;
    } else if (mType === 'RIFTHERALD' || mType === 'RIFT_HERALD') {
        return 'rift herald';
    } else if (mType === 'BARON_NASHOR') {
        return 'baron nashor';
    } else if (mType === 'HORDE') {
        return 'grub';
    }
    return (e.monsterType || '').toString().replace(/_/g, ' ').toLowerCase();
}

// Display name of a destroyed structure, e.g. "mid lane outer turret", "top lane inhibitor"
function buildingName(e) {
    const lane = (e.laneType || '').toString().replace(/_/g, ' ').toLowerCase();
    if (e.subtype === 'INHIBITOR_KILL' || (e.buildingType || '') === 'INHIBITOR_BUILDING') {
        return `${lane ? lane + ' ' : ''}inhibitor`.trim();
    }
    if ((e.buildingType || '') === 'TOWER_BUILDING') {
        const tower = (e.towerType || '').toString().replace(/_/g, ' ').toLowerCase();
        return `${lane ? lane + ' ' : ''}${tower || 'tower'}`.trim();
    }
    return 'structure';
}

// One explorer row: cells for time | actor | action | target | extra (assists). The row is a subgrid
// of the list's shared columns, so every cell lines up with the same cell in the other rows.
function timelineRowTemplate(match, e) {
    const teamBadge = (teamId) => html`<span class="badge tl-team-badge ${teamBadgeClass(teamId)}">${teamLabel(teamId)}</span>`;
    // Champion icon + team badge + player name
    const actorTemplate = (participant, teamId) => html`${championIDtoImg(participant.championId, `champion-img ${teamImgClass(teamId)}`)}${teamBadge(teamId)}<span>${getParticipantName(match, participant)}</span>`;

    // Subtle background tint for the entire row based on the killer/purchaser team
    let rowTeamId;
    let actor = nothing, action = nothing, target = nothing, extra = nothing;
    let actionClass = '', extraClass = '';

    if (e.kind === 'kill') {
        rowTeamId = e.killerTeamId;
        actor = e.killer ? actorTemplate(e.killer, e.killerTeamId) : 'Someone';
        action = 'killed';
        target = e.victim
            ? html`${championIDtoImg(e.victim.championId, `champion-img ${teamImgClass(e.victimTeamId)}`)}<span>${getParticipantName(match, e.victim)}</span>`
            : 'a champion';
        if (e.assists && e.assists.length > 0) {
            extraClass = ' timeline-assists text-muted';
            extra = html`<span class="me-1">Assisted by:</span>${e.assists.map(aId => {
                const ap = getParticipantById(match, aId);
                // Hover tooltip: the assisting player's name
                return ap ? championIDtoImg(ap.championId, `champion-img assist-icon ${teamImgClass(ap.teamId)}`, getParticipantName(match, ap)) : nothing;
            })}`;
        }
    } else if (e.kind === 'objective') {
        // Prefer the event's team, else the killer's team if available
        const effTeamId = (e.teamId !== undefined && e.teamId !== null)
            ? e.teamId
            : (e.killer && e.killer.teamId !== undefined)
                ? e.killer.teamId
                : undefined;
        rowTeamId = effTeamId;

        // Show killer (participant) when available, otherwise show team badge
        if (e.killer) {
            actor = actorTemplate(e.killer, effTeamId);
        } else if (effTeamId) {
            actor = teamBadge(effTeamId);
        }

        if (e.subtype === 'ELITE_MONSTER_KILL') {
            action = 'secured';
            target = html`<span class="badge bg-success">${monsterName(e)}</span>`;
        } else if (e.subtype === 'BUILDING_KILL' || e.subtype === 'INHIBITOR_KILL') {
            action = 'destroyed';
            target = html`<span class="badge text-bg-warning">${buildingName(e)}</span>`;
        } else {
            action = 'captured an objective';
        }
    } else if (e.kind === 'item') {
        rowTeamId = e.teamId; // purchaser's team
        actor = e.participant ? actorTemplate(e.participant, e.teamId) : teamBadge(e.teamId);
        actionClass = ' text-muted';
        action = e.action || 'updated items';

        // Item icons
        const isConsumed = e.action === 'consumed';
        const isUndone = e.action === 'undid';
        if (e.beforeId && e.afterId) {
            // Show transform/undo as before -> after
            const cls = `item-img${isUndone ? ' grayscale' : ''}`;
            target = html`${itemIDtoImg(e.beforeId, cls)}<span>→</span>${itemIDtoImg(e.afterId, cls)}`;
        } else if (e.itemId) {
            target = itemIDtoImg(e.itemId, `item-img${(isConsumed || isUndone) ? ' grayscale' : ''}`);
        }
    }

    const rowClass = rowTeamId === 100 ? ' tl-row-blue' : rowTeamId === 200 ? ' tl-row-red' : '';
    return html`<li class="list-group-item tl-row${rowClass}">
        <div class="tl-cell"><span class="badge rounded-pill bg-secondary">${standardTimestamp(e.t)}</span></div>
        <div class="tl-cell">${actor}</div>
        <div class="tl-cell${actionClass}">${action}</div>
        <div class="tl-cell">${target}</div>
        <div class="tl-cell${extraClass}">${extra}</div>
    </li>`;
}

// Render the timeline explorer UI (filters and event list) from the current filter state
function renderTimelineExplorer(match) {
    const list = $('timeline-explorer-list');
    if (!list) return; // Section may not exist

    if (!match || !match.frames) {
        renderInto(list, html`<li class="list-group-item">No timeline data available for this match.</li>`);
        return;
    }

    // New match: build its events once and start with every champion selected
    if (timelineExplorer.match !== match) {
        timelineExplorer.match = match;
        timelineExplorer.events = buildTimelineEvents(match);
        timelineExplorer.champions = new Set((match.participants || []).map(p => p.participantId));
    }

    renderInto($('timeline-filter'), timelineFilterTemplate(match));

    const filtered = timelineExplorer.events.filter(eventMatchesFilters);
    renderInto(list, filtered.length === 0
        ? html`<li class="list-group-item">No timeline events match the selected filters.</li>`
        : html`${repeat(filtered, e => e.id, e => timelineRowTemplate(match, e))}`);
}

// ===== Timeline Graphs =====

// Stats derivable from a single participant timeline frame, grouped for the radio-button selector
const TIMELINE_STAT_OPTIONS = [
    { key: 'totalGold', label: 'Total Gold', category: 'Economy' },
    { key: 'cs', label: 'Creep Score', category: 'Economy' },
    { key: 'xp', label: 'Experience', category: 'Progression' },
    { key: 'level', label: 'Champion Level', category: 'Progression' },
    { key: 'damageDealt', label: 'Damage Dealt to Champions', category: 'Damage', requiresDamage: true },
    { key: 'damageTaken', label: 'Damage Taken', category: 'Damage', requiresDamage: true },
];

function getFrameStatValue(participantFrame, statKey) {
    switch (statKey) {
        case 'totalGold': return participantFrame.totalGold;
        case 'xp': return participantFrame.xp;
        case 'cs': return (participantFrame.minionsKilled || 0) + (participantFrame.jungleMinionsKilled || 0);
        case 'level': return participantFrame.level;
        case 'damageDealt': return participantFrame.damageStats ? participantFrame.damageStats.totalDamageDoneToChampions : null;
        case 'damageTaken': return participantFrame.damageStats ? participantFrame.damageStats.totalDamageTaken : null;
        default: return null;
    }
}

// v4 timelines don't carry per-frame damage stats; detect availability so those options can be hidden
function timelineHasDamageStats(match) {
    if (!match || !match.frames || match.frames.length === 0) return false;
    const lastFrame = match.frames[match.frames.length - 1];
    const pf = Object.values(lastFrame.participantFrames)[0];
    return !!(pf && pf.damageStats && (pf.damageStats.totalDamageDoneToChampions !== null && pf.damageStats.totalDamageDoneToChampions !== undefined));
}

// Mix a hex color toward white by `fraction` (0 = original color, 1 = white); used to give teammates distinguishable shades
function mixWithWhite(hex, fraction) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (c) => Math.round(c + (255 - c) * fraction);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const TIMELINE_TEAM_COLORS = { 100: '#0d6efd', 200: '#dc3545' };
const TIMELINE_SUBTEAM_COLORS = ['#0d6efd', '#dc3545', '#20c997', '#fd7e14', '#6f42c1', '#ffc107', '#0dcaf0', '#6c757d'];

// Read a Bootstrap theme variable (set by data-bs-theme on <html>)
function themeColor(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
}

// Plotly layout properties that follow the current light/dark theme; merged into every chart layout
function plotlyThemeLayout() {
    const fg = themeColor('--bs-body-color');
    const grid = themeColor('--bs-border-color');
    const axis = { gridcolor: grid, zerolinecolor: grid, linecolor: grid };
    return {
        // Opaque background so exported PNGs stay readable
        paper_bgcolor: themeColor('--bs-body-bg'),
        plot_bgcolor: themeColor('--bs-body-bg'),
        font: { color: fg },
        xaxis: axis,
        yaxis: { ...axis }
    };
}

// Merge the theme into a chart layout, keeping the chart's own axis settings
function withPlotlyTheme(layout) {
    const theme = plotlyThemeLayout();
    return {
        ...layout,
        ...theme,
        xaxis: { ...theme.xaxis, ...layout.xaxis },
        yaxis: { ...theme.yaxis, ...layout.yaxis }
    };
}

// Re-theme already rendered charts when the system color scheme changes
window.addEventListener('themechange', () => {
    const theme = plotlyThemeLayout();
    ['stats-graph', 'timeline-graph'].forEach(id => {
        const el = $(id);
        if (!el || !el.data) return;
        Plotly.relayout(el, {
            paper_bgcolor: theme.paper_bgcolor,
            plot_bgcolor: theme.plot_bgcolor,
            'font.color': theme.font.color,
            'xaxis.gridcolor': theme.xaxis.gridcolor, 'xaxis.zerolinecolor': theme.xaxis.zerolinecolor, 'xaxis.linecolor': theme.xaxis.linecolor,
            'yaxis.gridcolor': theme.yaxis.gridcolor, 'yaxis.zerolinecolor': theme.yaxis.zerolinecolor, 'yaxis.linecolor': theme.yaxis.linecolor
        });
        const insideText = el.data.map((t, i) => t.insidetextfont ? i : -1).filter(i => i >= 0);
        if (insideText.length) Plotly.restyle(el, { 'insidetextfont.color': theme.font.color }, insideText);
        const killIndex = el.data.findIndex(t => t.name === 'Kills');
        if (killIndex !== -1) Plotly.restyle(el, { 'marker.line.color': theme.paper_bgcolor }, [killIndex]);
    });
});

// Timeline Graphs controls state: the selected stat (the mode and kill toggle are static form controls)
const timelineGraphControls = { ready: false, stat: TIMELINE_STAT_OPTIONS[0].key };

function getSelectedTimelineStat() {
    return timelineGraphControls.stat;
}

function populateTimelineGraphControls(match) {
    const statSelector = $('timeline-stat-selector');
    const modeSelector = $('timeline-mode-selector');
    if (!statSelector || !modeSelector) return;

    // Only build once
    if (timelineGraphControls.ready) return;
    timelineGraphControls.ready = true;

    const hasDamage = timelineHasDamageStats(match);
    const availableStats = TIMELINE_STAT_OPTIONS.filter(opt => !opt.requiresDamage || hasDamage);

    const statsByCategory = {};
    availableStats.forEach(opt => {
        if (!statsByCategory[opt.category]) statsByCategory[opt.category] = [];
        statsByCategory[opt.category].push(opt);
    });

    renderInto(statSelector, html`${Object.entries(statsByCategory).map(([categoryName, opts]) => html`
        <div class="stat-category">
            <h5>${categoryName}</h5>
            ${opts.map(opt => html`
                <div class="form-check">
                    <input class="form-check-input timeline-stat-radio" type="radio" name="timeline-stat" id="tl-stat-${opt.key}" value=${opt.key}
                        .checked=${opt.key === timelineGraphControls.stat}
                        @change=${() => {
                            timelineGraphControls.stat = opt.key;
                            renderTimelineGraph(match);
                        }}>
                    <label class="form-check-label" for="tl-stat-${opt.key}">${opt.label}</label>
                </div>`)}
        </div>`)}`);

    const isArena = isArenaMatch(match);
    const modeOptions = [
        { value: 'player', label: 'Per Player' },
        { value: 'team', label: isArena ? 'Per Subteam (Totals)' : 'Team Totals' },
    ];
    if (!isArena) {
        modeOptions.push({ value: 'diff', label: 'Team Difference (Blue - Red)' });
    }
    // Default to the gold difference view when available (not applicable to Arena matches)
    const defaultMode = isArena ? 'player' : 'diff';
    renderInto(modeSelector, html`${modeOptions.map(opt => html`<option value=${opt.value} ?selected=${opt.value === defaultMode}>${opt.label}</option>`)}`);

    modeSelector.addEventListener('change', () => renderTimelineGraph(match));
    const showKillsCheckbox = $('timeline-show-kills-checkbox');
    if (showKillsCheckbox) {
        showKillsCheckbox.addEventListener('change', () => renderTimelineGraph(match));
    }
}

function getChampionNameForParticipant(participant) {
    if (!champion_data || !participant) return '';
    for (const key in champion_data.data) {
        if (champion_data.data[key].key == participant.championId) {
            return champion_data.data[key].name;
        }
    }
    return '';
}

// Render the Timeline Graphs section (stat-over-time chart) for the current match/controls
function renderTimelineGraph(match) {
    const container = $('timeline-graph');
    if (!container) return;

    if (!match || !match.mtValid || !match.frames || match.frames.length === 0) {
        DOMUtils.showChartMessage(container, 'No timeline data available for this match.', '15%');
        return;
    }

    populateTimelineGraphControls(match);

    const statKey = getSelectedTimelineStat();
    const mode = $('timeline-mode-selector').value;
    const showKills = $('timeline-show-kills-checkbox').checked;
    const statOption = TIMELINE_STAT_OPTIONS.find(opt => opt.key === statKey) || TIMELINE_STAT_OPTIONS[0];
    const statLabel = statOption.label;

    const frames = match.frames;
    const minutesAxis = frames.map(f => f.timestamp / 60000);
    const timeHover = frames.map(f => standardTimestamp(f.timestamp / 1000));

    // Per-participant, per-frame stat values (aligned index-for-index with `frames`)
    const participantSeries = {};
    frames.forEach((frame, frameIndex) => {
        for (const [pidStr, pf] of Object.entries(frame.participantFrames)) {
            const pid = parseInt(pidStr, 10);
            if (!participantSeries[pid]) participantSeries[pid] = new Array(frames.length).fill(0);
            participantSeries[pid][frameIndex] = getFrameStatValue(pf, statKey) || 0;
        }
    });

    const isArena = isArenaMatch(match);
    const traces = [];

    if (mode === 'player') {
        if (isArena) {
            const subteams = getArenaSubteams(match);
            subteams.forEach((subteam, subteamIndex) => {
                const baseColor = TIMELINE_SUBTEAM_COLORS[subteamIndex % TIMELINE_SUBTEAM_COLORS.length];
                subteam.participants.forEach((p, memberIndex) => {
                    const color = mixWithWhite(baseColor, memberIndex * 0.35);
                    traces.push(buildPlayerTrace(match, p, participantSeries[p.participantId], minutesAxis, timeHover, statLabel, color));
                });
            });
        } else {
            [100, 200].forEach(teamId => {
                const teamPlayers = match.participants.filter(p => p.teamId === teamId);
                teamPlayers.forEach((p, memberIndex) => {
                    const color = mixWithWhite(TIMELINE_TEAM_COLORS[teamId] || '#6c757d', memberIndex * 0.15);
                    traces.push(buildPlayerTrace(match, p, participantSeries[p.participantId], minutesAxis, timeHover, statLabel, color));
                });
            });
        }
    } else if (mode === 'team') {
        if (isArena) {
            const subteams = getArenaSubteams(match);
            subteams.forEach((subteam, subteamIndex) => {
                const color = TIMELINE_SUBTEAM_COLORS[subteamIndex % TIMELINE_SUBTEAM_COLORS.length];
                const values = frames.map((f, i) => subteam.participants.reduce((sum, p) => sum + (participantSeries[p.participantId][i] || 0), 0));
                const placement = subteam.placement && subteam.placement !== 99 ? `${subteam.placement}${{1:'st',2:'nd',3:'rd'}[subteam.placement] || 'th'} Place` : `Subteam ${subteamIndex + 1}`;
                traces.push({
                    x: minutesAxis, y: values, type: 'scatter', mode: 'lines',
                    name: placement,
                    line: { color, width: 2 },
                    hoverinfo: 'text',
                    hovertext: values.map((v, i) => `<b>${placement}</b><br>${timeHover[i]}<br>${statLabel}: ${v.toLocaleString()}`)
                });
            });
        } else {
            [100, 200].forEach(teamId => {
                const teamPlayers = match.participants.filter(p => p.teamId === teamId);
                const values = frames.map((f, i) => teamPlayers.reduce((sum, p) => sum + (participantSeries[p.participantId][i] || 0), 0));
                const teamLabel = teamId === 100 ? 'Blue Team' : 'Red Team';
                traces.push({
                    x: minutesAxis, y: values, type: 'scatter', mode: 'lines',
                    name: teamLabel,
                    line: { color: TIMELINE_TEAM_COLORS[teamId], width: 3 },
                    hoverinfo: 'text',
                    hovertext: values.map((v, i) => `<b>${teamLabel}</b><br>${timeHover[i]}<br>${statLabel}: ${v.toLocaleString()}`)
                });
            });
        }
    } else if (mode === 'diff') {
        const blueValues = frames.map((f, i) => match.participants.filter(p => p.teamId === 100).reduce((sum, p) => sum + (participantSeries[p.participantId][i] || 0), 0));
        const redValues = frames.map((f, i) => match.participants.filter(p => p.teamId === 200).reduce((sum, p) => sum + (participantSeries[p.participantId][i] || 0), 0));
        const diff = blueValues.map((v, i) => v - redValues[i]);

        // Insert exact zero-crossing points between frames where the lead flips sides, so the
        // blue/red fill areas meet precisely at 0 instead of both being non-zero over the same
        // stretch (each fill is only clipped at its own frame points otherwise).
        const crossedX = [];
        const crossedY = [];
        const crossedHover = [];
        const hoverFor = (d, mins) => `${standardTimestamp(mins * 60)}<br>${statLabel} Diff: ${d >= 0 ? '+' : ''}${Math.round(d).toLocaleString()} (${d >= 0 ? 'Blue' : 'Red'} ahead)`;
        diff.forEach((d, i) => {
            if (i > 0) {
                const prevD = diff[i - 1];
                if ((prevD > 0 && d < 0) || (prevD < 0 && d > 0)) {
                    const prevX = minutesAxis[i - 1];
                    const curX = minutesAxis[i];
                    const t = prevD / (prevD - d);
                    const crossX = prevX + t * (curX - prevX);
                    crossedX.push(crossX);
                    crossedY.push(0);
                    crossedHover.push(`${standardTimestamp(crossX * 60)}<br>${statLabel} Diff: Even`);
                }
            }
            crossedX.push(minutesAxis[i]);
            crossedY.push(d);
            crossedHover.push(hoverFor(d, minutesAxis[i]));
        });

        const diffPos = crossedY.map(v => v >= 0 ? v : 0);
        const diffNeg = crossedY.map(v => v <= 0 ? v : 0);

        traces.push({
            x: crossedX, y: diffPos, type: 'scatter', mode: 'lines', fill: 'tozeroy',
            line: { color: TIMELINE_TEAM_COLORS[100], width: 1, shape: 'linear' },
            fillcolor: 'rgba(13, 110, 253, 0.35)',
            name: 'Blue Lead', hoverinfo: 'skip'
        });
        traces.push({
            x: crossedX, y: diffNeg, type: 'scatter', mode: 'lines', fill: 'tozeroy',
            line: { color: TIMELINE_TEAM_COLORS[200], width: 1, shape: 'linear' },
            fillcolor: 'rgba(220, 53, 69, 0.35)',
            name: 'Red Lead', hoverinfo: 'skip'
        });
        traces.push({
            x: crossedX, y: crossedY, type: 'scatter', mode: 'lines',
            line: { color: 'rgba(0,0,0,0)' }, showlegend: false,
            hoverinfo: 'text',
            hovertext: crossedHover
        });
    }

    if (showKills) {
        const killEvents = buildTimelineEvents(match).filter(e => e.kind === 'kill');
        if (killEvents.length > 0) {
            let yBaseline = 0;
            for (const trace of traces) {
                if (Array.isArray(trace.y) && trace.y.length) {
                    yBaseline = Math.min(yBaseline, ...trace.y.filter(v => typeof v === 'number'));
                }
            }
            traces.push({
                x: killEvents.map(e => e.t / 60),
                y: killEvents.map(() => yBaseline),
                type: 'scatter', mode: 'markers',
                marker: {
                    symbol: 'diamond', size: 9,
                    color: killEvents.map(e => e.killerTeamId === 100 ? TIMELINE_TEAM_COLORS[100] : e.killerTeamId === 200 ? TIMELINE_TEAM_COLORS[200] : '#6c757d'),
                    line: { color: themeColor('--bs-body-bg'), width: 1 }
                },
                name: 'Kills',
                hoverinfo: 'text',
                hovertext: killEvents.map(e => `${standardTimestamp(e.t)}<br>${e.killer ? escapeHtml(getParticipantName(match, e.killer)) : 'Someone'} killed ${e.victim ? escapeHtml(getParticipantName(match, e.victim)) : 'a champion'}`)
            });
        }
    }

    const layout = withPlotlyTheme({
        title: `${statLabel} Over Time`,
        xaxis: { title: 'Game Time (minutes)' },
        yaxis: { title: statLabel, rangemode: mode === 'diff' ? 'normal' : 'tozero' },
        legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
        margin: { l: 70, r: 30, t: 70, b: 50 },
        height: 600
    });

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: 'LoL_Timeline_Graph',
            height: 500,
            width: 900,
            scale: 2
        }
    };

    DOMUtils.clearChartMessage(container);
    Plotly.newPlot(container, traces, layout, config);
}

function buildPlayerTrace(match, participant, values, minutesAxis, timeHover, statLabel, color) {
    const playerName = getParticipantName(match, participant);
    const champName = getChampionNameForParticipant(participant);
    return {
        x: minutesAxis, y: values, type: 'scatter', mode: 'lines',
        name: `${champName} (${playerName})`,
        line: { color, width: 2 },
        hoverinfo: 'text',
        hovertext: values.map((v, i) => `<b>${escapeHtml(playerName)}</b><br>${escapeHtml(champName)}<br>${timeHover[i]}<br>${statLabel}: ${v.toLocaleString()}`)
    };
}

// Match Statistics stat checkboxes: the stats grouped by category, and which ones are selected
const statSelector = { match: null, categories: {}, selected: new Set() };

// Selected stats in the order they appear in the selector
function getSelectedStats() {
	return Object.values(statSelector.categories).flat().filter(statName => statSelector.selected.has(statName));
}

// Redraw the Match Statistics chart for the current selection and chart options
function updateStatsGraph() {
	const selectedStats = getSelectedStats();
	if (selectedStats.length > 0) {
		createMultiStatsGraph(statSelector.match, selectedStats);
	} else {
		DOMUtils.showChartMessage($("stats-graph"), "Please select at least one stat to display", "25%");
	}
}

function populateStatSelector(match) {
	const isArena = isArenaMatch(match);
	const availableStats = [];

	// Add prioritized stats first
	for (const statName of prioritized_stats) {
		if (getParticipantStat(match.participants[0], statName) !== undefined) {
			availableStats.push(statName);
		}
	}

	// Add other graphable stats
	for (const statName of graphable_stats) {
		if (!availableStats.includes(statName) && getParticipantStat(match.participants[0], statName) !== undefined) {
			availableStats.push(statName);
		}
	}

	// Add all remaining numeric stats that aren't in the exclude list
	for (const participant of match.participants) {
		const participantStats = getParticipantStatNames(participant, isArena);
		for (const statName of participantStats) {
			if (!availableStats.includes(statName) &&
				typeof getParticipantStat(participant, statName) === 'number') {
				availableStats.push(statName);
			}
		}
	}

	statSelector.match = match;
	statSelector.categories = getSortedStats(availableStats);
	statSelector.selected = new Set(availableStats.filter(statName => statName === 'totalDamageDealtToChampions'));
	renderStatSelector();
}

function renderStatSelector() {
	renderInto($("stat-selector"), html`${Object.entries(statSelector.categories).map(([categoryName, stats]) => html`
		<div class="stat-category">
			<h5>${categoryName}</h5>
			${stats.map(statName => html`
				<div class="form-check">
					<input type="checkbox" class="form-check-input stat-checkbox" id="stat-${statName}" value=${statName} data-stat=${statName}
						.checked=${live(statSelector.selected.has(statName))}
						@change=${(e) => {
							toggleSetValue(statSelector.selected, statName, e.target.checked);
							updateStatsGraph();
						}}>
					<label class="form-check-label" for="stat-${statName}">${statDisplayName(statName)}</label>
				</div>`)}
		</div>`)}`);
}

// Function to create a multi-stats graph grouped by player
function createMultiStatsGraph(match, selectedStats) {
	const graphContainer = $("stats-graph");
	const chartType = $("chart-type-selector").value;
	const isHorizontal = chartType === "horizontal";
	const sumSelections = $("sum-selections-checkbox").checked;

	// Use same participant order as scoreboard and player-stats table
	const isArena = isArenaMatch(match);
	let orderedParticipants;
	if (isArena) {
		// For Arena matches, group by subteam and order by placement (same as scoreboard)
		orderedParticipants = getArenaOrderedParticipants(match);
	} else {
		// For traditional matches, use original order
		orderedParticipants = match.participants;
	}

	// Collect player information
	const players = orderedParticipants.map(participant => {
		const playerName = getParticipantName(match, participant);
		let champName = '';
		let champKey = '';

		// Find champion info
		for (let key in champion_data.data) {
			if (champion_data.data[key].key == participant.championId) {
				champName = champion_data.data[key].name;
				champKey = key;
				break;
			}
		}

		// Collect stats for this player
		const statValues = {};
		selectedStats.forEach(statName => {
			statValues[statName] = getParticipantStat(participant, statName) || 0;
		});

		return {
			id: participant.participantId,
			name: playerName,
			teamId: participant.teamId,
			champName,
			champKey,
			statValues
		};
	});

	// Sort players by team (skip for Arena, where placement-based order is preserved)
	if (!isArena) {
		players.sort((a, b) => a.teamId - b.teamId);
	}

	const orderedPlayers = isHorizontal ? [...players].reverse() : players;
	const traces = [];

	// Get display names for stats
	const statDisplayNames = selectedStats.map(statName => {
		if (stat_name_translation[statName]) {
			return stat_name_translation[statName];
		} else {
			return camelToTitleCase(statName);
		}
	});

	// Define color palette for different stats
	const statColors = [
		'rgba(64, 128, 255, 0.7)',
		'rgba(255, 64, 64, 0.7)',
		'rgba(60, 180, 75, 0.7)',
		'rgba(255, 165, 0, 0.7)',
		'rgba(128, 0, 128, 0.7)',
		'rgba(0, 128, 128, 0.7)',
		'rgba(255, 215, 0, 0.7)',
		'rgba(210, 105, 30, 0.7)',
		'rgba(169, 169, 169, 0.7)',
		'rgba(128, 128, 128, 0.7)'
	];

	// Value labels drawn inside a bar use the theme's text colour. Plotly would otherwise pick one from
	// the bar colour alone, ignoring its transparency, and choose dark text for bars that render dark
	// over the dark theme's background. The themechange handler below keeps this in step.
	const insideTextFont = { color: plotlyThemeLayout().font.color };

	const playerLabels = orderedPlayers.map(player => `${player.champName} (${player.name})`);
	const champImages = orderedPlayers.map(player => player.champKey);
	// Use a unique category per player to avoid overlaps when multiple players pick the same champion
	const axisCategories = orderedPlayers.map(player => `${player.champKey}_${player.id}`);

	if (sumSelections && selectedStats.length > 0) {
		if (selectedStats.length > 1) {
			selectedStats.forEach((statName, statIndex) => {
				let statDisplayName = statDisplayNames[statIndex];
				const values = orderedPlayers.map(player => player.statValues[statName]);
				const color = statColors[statIndex % statColors.length];
				const borderColor = color.replace('0.7', '1.0');

				const trace = {
					name: statDisplayName,
					type: 'bar',
					x: isHorizontal ? values : axisCategories,
					y: isHorizontal ? axisCategories : values,
					orientation: isHorizontal ? 'h' : 'v',
					marker: {
						color: color,
						line: { color: borderColor, width: 1.5 }
					},
					hoverinfo: 'text',
					hovertext: orderedPlayers.map((player, i) => {
						return `<b>${player.name}</b><br>${player.champName}<br>${statDisplayName}: ${values[i].toLocaleString()}`;
					})
				};
				traces.push(trace);
			});
		} else {
			const summedValues = orderedPlayers.map(player => {
				return selectedStats.reduce((sum, statName) => sum + player.statValues[statName], 0);
			});

			const trace = {
				name: 'Sum of Selected Stats',
				type: 'bar',
				x: isHorizontal ? summedValues : axisCategories,
				y: isHorizontal ? axisCategories : summedValues,
				text: summedValues.map(val => val.toLocaleString()),
				textposition: 'auto',
				insidetextfont: insideTextFont,
				orientation: isHorizontal ? 'h' : 'v',
				marker: {
					color: orderedPlayers.map(player => player.teamId === 100 ? 'rgba(64, 128, 255, 0.7)' : 'rgba(255, 64, 64, 0.7)'),
					line: {
						color: orderedPlayers.map(player => player.teamId === 100 ? 'rgba(64, 128, 255, 1)' : 'rgba(255, 64, 64, 1)'),
						width: 1.5
					}
				},
				hoverinfo: 'text',
				hovertext: orderedPlayers.map((player, i) => {
					return `<b>${player.name}</b><br>${player.champName}<br>Total: ${summedValues[i].toLocaleString()}`;
				})
			};
			traces.push(trace);
		}
	} else {
		const orderedSelectedStats = isHorizontal ? [...selectedStats].reverse() : selectedStats;
		const orderedStatDisplayNames = isHorizontal ? [...statDisplayNames].reverse() : statDisplayNames;

		orderedSelectedStats.forEach((statName, statIndex) => {
			let statDisplayName = orderedStatDisplayNames[statIndex];
			const values = orderedPlayers.map(player => player.statValues[statName]);
			const color = statColors[statIndex % statColors.length];
			const borderColor = color.replace('0.7', '1.0');

			const trace = {
				name: statDisplayName,
				type: 'bar',
					x: isHorizontal ? values : axisCategories,
					y: isHorizontal ? axisCategories : values,
				text: values.map(val => val.toLocaleString()),
				textposition: 'auto',
				insidetextfont: insideTextFont,
				orientation: isHorizontal ? 'h' : 'v',
				marker: {
					color: color,
					line: { color: borderColor, width: 1.5 }
				},
				hoverinfo: 'text',
				hovertext: orderedPlayers.map((player, i) => {
					return `<b>${player.name}</b><br>${player.champName}<br>${statDisplayName}: ${values[i].toLocaleString()}`;
				})
			};

			traces.push(trace);
		});
	}

	// Champion icons are anchored to their bar's category on the champion axis, so each one sits on its
	// own row (or column) whatever the player count, and the name labels are pushed out past the icons
	// with ticklabelstandoff instead of the icons being drawn over them.
	const GRAPH_HEIGHT = 800;
	const marginTop = 70, marginBottom = isHorizontal ? 50 : 170;
	const ICON_MAX_PX = 36;
	const ICON_GAP_PX = 6;
	const rowPx = (GRAPH_HEIGHT - marginTop - marginBottom) / Math.max(1, axisCategories.length);
	// Horizontal rows have a known height, so the icon is sized to the row; vertical columns depend on
	// the chart's width, so the icon is capped in pixels and shrinks to the column when that is narrower.
	// Whole pixels: Plotly only accepts an integer ticklabelstandoff and silently ignores anything else.
	const iconPx = Math.round(isHorizontal ? Math.min(ICON_MAX_PX, rowPx * 0.8) : ICON_MAX_PX);
	const iconOffset = iconPx + ICON_GAP_PX;
	const plotPaperHeight = GRAPH_HEIGHT - marginTop - marginBottom;

	const layout = withPlotlyTheme({
		title: 'Multiple Stats Comparison',
		barmode: sumSelections && selectedStats.length > 1 ? 'stack' : 'group',
			xaxis: isHorizontal ? {
				title: 'Value'
			} : {
				title: 'Champions',
				//tickangle: 0,
				tickmode: 'array',
				tickvals: axisCategories,
				ticktext: playerLabels,
				tickfont: { size: 9 },
				tickangle: 45,
				ticklabelstandoff: iconOffset,
				automargin: true
			},
			yaxis: isHorizontal ? {
				title: 'Champions',
				tickmode: 'array',
				tickvals: axisCategories,
				ticktext: playerLabels,
				tickfont: { size: 10 },
				ticklabelstandoff: iconOffset,
				automargin: true
			} : {
				title: 'Value'
			},
		margin: {
			l: isHorizontal ? 150 + iconOffset : 80,
			r: 50,
			b: marginBottom,
			t: marginTop,
			pad: 4
		},
		legend: {
			title: { text: 'Statistics' },
			orientation: 'h',
			yanchor: 'bottom',
			y: 1.02,
			xanchor: 'right',
			x: 1
		},
		// On the category axis the image takes its bar's category as its coordinate and is sized in
		// category units; on the other axis it hangs off the plot edge (paper 0) with a generous box, and
		// "contain" scales it to whichever dimension is tighter, keeping it square.
		images: champImages.map((champKey, i) => ({
			source: `https://ddragon.leagueoflegends.com/cdn/${addv}/img/champion/${champKey}.png`,
			xref: isHorizontal ? 'paper' : 'x',
			yref: isHorizontal ? 'y' : 'paper',
			x: isHorizontal ? 0 : axisCategories[i],
			y: isHorizontal ? axisCategories[i] : 0,
			sizex: isHorizontal ? 1 : 0.8,
			sizey: isHorizontal ? iconPx / rowPx : iconPx / plotPaperHeight,
			xanchor: isHorizontal ? 'right' : 'center',
			yanchor: isHorizontal ? 'middle' : 'top',
			sizing: 'contain',
			layer: 'above'
		})),
		height: GRAPH_HEIGHT
	});

	const config = {
		responsive: true,
		displayModeBar: true,
		displaylogo: false,
		toImageButtonOptions: {
			format: 'png',
			filename: 'LoL_Multiple_Stats_Comparison',
			height: 500,
			width: 700,
			scale: 2
		}
	};

	DOMUtils.clearChartMessage(graphContainer);
	Plotly.newPlot(graphContainer, traces, layout, config);
	$("stats-graph").style.height = "800px";
}
