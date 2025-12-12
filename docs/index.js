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
 */

"use strict";

/**
 * Application configuration and constants
 */
const CONFIG = {
	// API endpoints and data sources
	DDRAGON_BASE_URL: 'https://ddragon.leagueoflegends.com/cdn',
	EXAMPLE_DATA_PATH: 'example-data',

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
		"item0", "item1", "item2", "item3", "item4", "item5", "item6", "participantId",
		"teamId", "championId", "spell1Id", "spell2Id", "playerSubteamId", "subteamPlacement"
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
	 * Initialize application state from URL parameters
	 */
	initialize() {
		const exampleParam = UrlUtils.getParameterByName("example");

		if (exampleParam === "4") {
			this.matchUrl = `${CONFIG.EXAMPLE_DATA_PATH}/match/2808045821.json`;
			this.timelineUrl = `${CONFIG.EXAMPLE_DATA_PATH}/timeline/2808045821.json`;
		} else if (exampleParam === "a") {
			this.matchUrl = `${CONFIG.EXAMPLE_DATA_PATH}/match/arena.json`;
			this.timelineUrl = `${CONFIG.EXAMPLE_DATA_PATH}/timeline/arena.json`;
		} else if (exampleParam === "5s") {
            this.matchUrl = `${CONFIG.EXAMPLE_DATA_PATH}/match/v5.json`;
            this.timelineUrl = null;
        } else if (exampleParam) {
			this.matchUrl = `${CONFIG.EXAMPLE_DATA_PATH}/match/v5.json`;
			this.timelineUrl = `${CONFIG.EXAMPLE_DATA_PATH}/timeline/v5.json`;
		} else {
			this.matchUrl = UrlUtils.getParameterByName("match");
			this.timelineUrl = UrlUtils.getParameterByName("timeline");
		}

		this.isInitialized = true;
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
	 * Escape HTML characters to prevent XSS
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
	 * Create HTML table cell with optional CSS class
	 * @param {*} content - Cell content
	 * @param {string} className - CSS class name
	 * @returns {string} HTML cell string
	 */
	static createCell(content = "", className = "") {
		const escapedContent = SecurityUtils.escapeHtml(content);
		const classAttr = className ? ` class="${SecurityUtils.escapeHtml(className)}"` : "";
		return `<td${classAttr}>${escapedContent}</td>`;
	}

	/**
	 * Create HTML table header cell
	 * @param {*} content - Header content
	 * @param {string} className - CSS class name
	 * @returns {string} HTML header cell string
	 */
	static createHeaderCell(content = "", className = "") {
		const escapedContent = SecurityUtils.escapeHtml(content);
		const classAttr = className ? ` class="${SecurityUtils.escapeHtml(className)}"` : "";
		return `<th${classAttr}>${escapedContent}</th>`;
	}

	/**
	 * Create unsafe HTML cell (for images and pre-escaped content)
	 * @param {string} content - Pre-escaped HTML content
	 * @param {string} className - CSS class name
	 * @returns {string} HTML cell string
	 */
	static createUnsafeCell(content = "", className = "") {
		const classAttr = className ? ` class="${SecurityUtils.escapeHtml(className)}"` : "";
		return `<td${classAttr}>${content}</td>`;
	}
}

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
	 * Get champion image HTML
	 * @param {number} championId - Champion ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {string} HTML img element or placeholder
	 */
	getChampionImage(championId, cssClass = "champion-img") {
		if (!this.state.championData) {
			return `<div class="${cssClass}">&nbsp;</div>`;
		}

		for (const championKey in this.state.championData.data) {
			if (this.state.championData.data[championKey].key == championId) {
				const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
				const escapedKey = encodeURIComponent(championKey);
				const escapedClass = SecurityUtils.escapeHtml(cssClass);
				return `<img class="${escapedClass}" src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/champion/${escapedKey}.png" alt="${SecurityUtils.escapeHtml(this.state.championData.data[championKey].name)}">`;
			}
		}

		return `<div class="${cssClass}">&nbsp;</div>`;
	}

	/**
	 * Get item image HTML
	 * @param {number} itemId - Item ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {string} HTML img element or placeholder
	 */
	getItemImage(itemId, cssClass = "item-img") {
		if (itemId === 0) {
			return `<div class="${cssClass}">&nbsp;</div>`;
		}

		const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
		const escapedId = encodeURIComponent(itemId);
		const escapedClass = SecurityUtils.escapeHtml(cssClass);
		return `<img class="${escapedClass}" src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/item/${escapedId}.png" alt="Item ${itemId}">`;
	}

	/**
	 * Get summoner spell image HTML
	 * @param {number} spellId - Summoner spell ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {string} HTML img element or empty string
	 */
	getSummonerSpellImage(spellId, cssClass = "spell-img") {
		if (!this.state.spellData) {
			return "";
		}

		for (const spellKey in this.state.spellData.data) {
			if (this.state.spellData.data[spellKey].key == spellId) {
				const escapedVersion = encodeURIComponent(this.state.activeDragonVersion);
				const escapedId = encodeURIComponent(this.state.spellData.data[spellKey].id);
				const escapedClass = SecurityUtils.escapeHtml(cssClass);
				return `<img class="${escapedClass}" src="${CONFIG.DDRAGON_BASE_URL}/${escapedVersion}/img/spell/${escapedId}.png" alt="${SecurityUtils.escapeHtml(this.state.spellData.data[spellKey].name)}">`;
			}
		}

		return "";
	}

	/**
	 * Get rune image HTML
	 * @param {number} runeId - Rune ID
	 * @param {string} cssClass - CSS class for the image
	 * @returns {string} HTML img element or empty string
	 */
	getRuneImage(runeId, cssClass = "rune-img") {
		if (!this.state.runeData) {
			return "";
		}

		// Search through rune trees and their slots
		for (const runeTree of this.state.runeData) {
			// Check main rune tree
			if (runeTree.id === runeId) {
				const escapedIcon = encodeURIComponent(runeTree.icon);
				const escapedClass = SecurityUtils.escapeHtml(cssClass);
				return `<img class="${escapedClass}" src="${CONFIG.DDRAGON_BASE_URL}/img/${escapedIcon}" alt="${SecurityUtils.escapeHtml(runeTree.name)}">`;
			}

			// Check individual runes in slots
			for (const slot of runeTree.slots) {
				for (const rune of slot.runes) {
					if (rune.id === runeId) {
						const escapedIcon = encodeURIComponent(rune.icon);
						const escapedClass = SecurityUtils.escapeHtml(cssClass);
						return `<img class="${escapedClass}" src="${CONFIG.DDRAGON_BASE_URL}/img/${escapedIcon}" alt="${SecurityUtils.escapeHtml(rune.name)}">`;
					}
				}
			}
		}

		return "";
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
function cellText(content, className) { return DOMUtils.createCell(content, className); }
function cellUnsafe(content, className) { return DOMUtils.createUnsafeCell(content, className); }
function headerText(content, className) { return DOMUtils.createHeaderCell(content, className); }
function championIDtoImg(id, cssClass) { return gameDataManager.getChampionImage(id, cssClass); }
function itemIDtoImg(id, cssClass) { return gameDataManager.getItemImage(id, cssClass); }
function spellIDtoImg(id, cssClass) { return gameDataManager.getSummonerSpellImage(id, cssClass); }
function runeIDtoImg(id, cssClass) { return gameDataManager.getRuneImage(id, cssClass); }

// Initialize legacy variables
appState.initialize();
match_url = appState.matchUrl;
match_timeline_url = appState.timelineUrl;
let arenaAugmentMap = {};

// Special functions for rune cells
const stat_value_override = {
	"perk0": runeToCell,
	"perk1": runeToCell,
	"perk2": runeToCell,
	"perk3": runeToCell,
	"perk4": runeToCell,
	"perk5": runeToCell,
	"perkPrimaryStyle": runeToCell,
	"perkSubStyle": runeToCell,
	// Arena augment IDs → names (stats table only)
	"playerAugment1": augmentToCell,
	"playerAugment2": augmentToCell,
	"playerAugment3": augmentToCell,
	"playerAugment4": augmentToCell,
	"playerAugment5": augmentToCell,
	"playerAugment6": augmentToCell,
};

function runeToCell(id) {
	return cellUnsafe(runeIDtoImg(id));
}

function augmentToCell(id) {
	// Only display names in the stats table. 0/undefined means no augment selected.
	if (id === 0 || id === undefined || id === null) {
		return cellText("");
	}
	const aug = arenaAugmentMap ? arenaAugmentMap[id] : undefined;
	const name = aug && aug.name ? aug.name : String(id);
	return cellText(name);
}

// Main execution - maintaining original structure but using new utilities
loadJSON(match_url).then(match_data => {
	let match = new Match(champion_data, match_data, null, true);
	const major_patch = match.gameVersion.substring(0, match.gameVersion.indexOf(".", match.gameVersion.indexOf(".") + 1));
	addv = major_patch + ".1";
	appState.activeDragonVersion = addv;

	$("metadata").innerHTML = `<h1>${queues[match.queueId]}</h1>
		<p class="m-1">${new Date(match.gameCreation).toLocaleDateString()} ${new Date(match.gameCreation).toLocaleTimeString()}</p>
		<p class="m-1">Region: ${escapeHtml(regions[match.platformId])}, Match ID: ${escapeHtml(match.gameId)}, Patch ${escapeHtml(major_patch)}, Duration: ${standardTimestamp(match.gameDuration)}</p>`;

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

		match = new Match(champion_data, match_data, timeline_data, true);
		console.log(match);

		// Check if this is an Arena match (queue 1700)
		const isArena = match.queueId === 1700;

		let teams;
		if (isArena) {
			// For Arena matches, display all players in one table sorted by placement
			const sortedParticipants = match.participants.slice().sort((a, b) => {
				const aPlacement = getParticipantStat(a, 'placement') || 99;
				const bPlacement = getParticipantStat(b, 'placement') || 99;
				return aPlacement - bPlacement;
			});

			teams = `<thead class="sticky"><tr>
			${headerText("Placement")}
			${headerText("Rune")}
			${headerText("Spells")}
			${headerText("Level")}
			<th>Champion</th>
			${headerText("Player")}
			${headerText("Items", "tal")}
			${headerText("K / D / A")}
			${headerText("CS")}
			${headerText("Gold")}
			</tr></thead>${sortedParticipants.map(p => {
				const placement = getParticipantStat(p, 'placement');
				return `<tr class="match-${getParticipantStat(p, 'win') ? "victory" : "defeat"}">
			${cellText(placement ? `#${placement}` : '?')}
			<td>${runeIDtoImg(getParticipantStat(p, 'perk0'))}</td>
			<td>${spellIDtoImg(p.spell1Id)}${spellIDtoImg(p.spell2Id)}</td>
			${cellText(getParticipantStat(p, 'champLevel'))}
			<td>${championIDtoImg(p.championId)}</td>
			${cellText(getParticipantName(match, p))}
			<td class="tal">${itemIDtoImg(getParticipantStat(p, 'item0'))}
			${itemIDtoImg(getParticipantStat(p, 'item1'))}
			${itemIDtoImg(getParticipantStat(p, 'item2'))}
			${itemIDtoImg(getParticipantStat(p, 'item3'))}
			${itemIDtoImg(getParticipantStat(p, 'item4'))}
			${itemIDtoImg(getParticipantStat(p, 'item5'))}
			${itemIDtoImg(getParticipantStat(p, 'item6'), "item-img ms-5")}</td>
			${cellText(`${getParticipantStat(p, 'kills')} / ${getParticipantStat(p, 'deaths')} / ${getParticipantStat(p, 'assists')}`)}
			${cellText((getParticipantStat(p, 'neutralMinionsKilled') || 0) + (getParticipantStat(p, 'totalMinionsKilled') || 0))}
			${cellText(getParticipantStat(p, 'goldEarned'))}</tr>`;
			}).join("")}`;
		} else {
			// Traditional team-based matches
			teams = match.teams.map((team, team_index) => {
				console.log(team.bans);
				return `<thead class="sticky"><tr>
				${headerText("Rune")}
				${headerText("Spells")}
				${headerText("Level")}
				<th>Champion ${team.bans.map(ban => `<div style="border: 2px solid red; display: inline-block;">${championIDtoImg(ban.championId, "champion-ban-img")}</div>`).join("")}</th>
				${headerText(`Team ${team_index + 1} (${team.win})`)}
				${headerText("Items", "tal")}
				${headerText("K / D / A")}
				${headerText("CS")}
				${headerText("Gold")}
				</tr></thead>${match.participants.map(p => {
					if (p.teamId != team.teamId) return "";
					return `<tr class="match-${getParticipantStat(p, 'win') ? "victory" : "defeat"}">
				<td>${runeIDtoImg(getParticipantStat(p, 'perk0'))}</td>
				<td>${spellIDtoImg(p.spell1Id)}${spellIDtoImg(p.spell2Id)}</td>
				${cellText(getParticipantStat(p, 'champLevel'))}
				<td>${championIDtoImg(p.championId)}</td>
				${cellText(getParticipantName(match, p))}
				<td class="tal">${itemIDtoImg(getParticipantStat(p, 'item0'))}
				${itemIDtoImg(getParticipantStat(p, 'item1'))}
				${itemIDtoImg(getParticipantStat(p, 'item2'))}
				${itemIDtoImg(getParticipantStat(p, 'item3'))}
				${itemIDtoImg(getParticipantStat(p, 'item4'))}
				${itemIDtoImg(getParticipantStat(p, 'item5'))}
				${itemIDtoImg(getParticipantStat(p, 'item6'), "item-img ms-5")}</td>
				${cellText(`${getParticipantStat(p, 'kills')} / ${getParticipantStat(p, 'deaths')} / ${getParticipantStat(p, 'assists')}`)}
				${cellText((getParticipantStat(p, 'neutralMinionsKilled') || 0) + (getParticipantStat(p, 'totalMinionsKilled') || 0))}
				${cellText(getParticipantStat(p, 'goldEarned'))}</tr>`;
				}).join("")}`;
			}).join("<tr><td>&nbsp;</td></tr>");
		}
		teams = "<table class=\"table\">" + teams + "</table>";
		$("scoreboard").innerHTML = teams;

		let participant_stat_props = [];
		// Collect all available stats from all participants (use original order for comprehensive stat collection)
		for (let participant_id in match.participants) {
			const participant = match.participants[participant_id];
			const statNames = getParticipantStatNames(participant, isArena);
			for (const prop_name of statNames) {
				if (!participant_stat_props.includes(prop_name)) {
					participant_stat_props.push(prop_name);
				}
			}
		}

		// Use same participant order as scoreboard - sorted by placement for Arena, original order for others
		let orderedParticipants;
		if (isArena) {
			// For Arena matches, use the same sorting as the scoreboard
			orderedParticipants = match.participants.slice().sort((a, b) => {
				const aPlacement = getParticipantStat(a, 'placement') || 99;
				const bPlacement = getParticipantStat(b, 'placement') || 99;
				return aPlacement - bPlacement;
			});
		} else {
			// For traditional matches, use original order
			orderedParticipants = match.participants;
		}

		let stats = `<table class="table table-striped mt-5"><thead class="sticky">
		<tr>${headerText("Summoner Name")}${orderedParticipants.map(p => {
			return headerText(getParticipantName(match, p));
		}).join("")}</tr>
		<tr>${headerText("Champion")}${orderedParticipants.map(p => {
			return `<th>${championIDtoImg(p.championId)}</th>`;
		}).join("")}</tr>
		</thead>
		${participant_stat_props.map(prop_name => {
			let remapped_prop_name = camelToTitleCase(prop_name);
			if (stat_name_translation[prop_name]) {
				remapped_prop_name = stat_name_translation[prop_name];
			}
			return `<tr>${cellText(remapped_prop_name, "tal fw-bold")}${orderedParticipants.map(p => {
				let classes = "";
				const statValue = getParticipantStat(p, prop_name);
				if (statValue === true) {
					classes = "bool-true";
				}
				else if (statValue === false) {
					classes = "bool-false";
				}
				else if (statValue === null || statValue === undefined) {
					return cellText("");
				}
				if (stat_value_override[prop_name]) {
					return stat_value_override[prop_name](statValue);
				}
				else {
					return cellText(statValue, classes);
				}
			}).join("")}</tr>`;
		}).join("")}</table>`
		$("player-stats").innerHTML = stats;

		// Initialize the stats graph functionality
		populateStatSelector(match);

		// Add event listener for chart type selection
		$("chart-type-selector").addEventListener('change', function () {
			const selectedStats = getSelectedStats();
			if (selectedStats.length > 0) {
				createMultiStatsGraph(match, selectedStats);
			}
		});

		// Add event listener for the "Sum Selections" checkbox
		const sumSelectionsCheckbox = $("sum-selections-checkbox");
		sumSelectionsCheckbox.addEventListener('change', function () {
			const selectedStats = getSelectedStats();
			if (selectedStats.length > 0) {
				createMultiStatsGraph(match, selectedStats);
			}
		});

		// Add event listener for the "Clear All" hyperlink
		const clearAllLink = document.getElementById('clear-all-stats');
		if (clearAllLink) {
			clearAllLink.onclick = function (e) {
				e.preventDefault();
				document.querySelectorAll('.stat-checkbox:checked').forEach(cb => { cb.checked = false; });
				const graphContainer = $("stats-graph");
				if (graphContainer) {
					graphContainer.innerHTML = '<div class="alert alert-info text-center" style="margin-top: 25%;">Please select at least one stat to display</div>';
				}
			};
		}

		// Plot the default selected stats on page load
		setTimeout(() => {
			const selectedStats = getSelectedStats();
			if (selectedStats.length > 0) {
				createMultiStatsGraph(match, selectedStats);
			}

			// Render the timeline explorer after initial graph setup
			renderTimelineExplorer(match);
		}, 500);
	}).catch(handleError);
}).catch(handleError);

// Helper function to get selected stats
function getSelectedStats() {
	const selectedStats = [];
	document.querySelectorAll('.stat-checkbox:checked').forEach(checkbox => {
		selectedStats.push(checkbox.value);
	});
	return selectedStats;
}

function handleError(err) {
	console.error(err);
	var scoreboard = $("scoreboard");
	if (scoreboard) {
		scoreboard.innerHTML = '<div class="alert alert-danger text-center mt-5">' +
			(err instanceof SyntaxError && /JSON/.test(err.message)
				? "No match or timeline data provided, or the data could not be loaded. Please select an example or provide valid data sources in the URL."
				: escapeHtml(err.message || err)) +
			'</div>';
	}
	var statsGraph = $("stats-graph");
	if (statsGraph) statsGraph.innerHTML = "";
	var playerStats = $("player-stats");
	if (playerStats) playerStats.innerHTML = "";
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
                    // Team attribution rules:
                    // 1) Use killerTeamId when present
                    // 2) Else, if teamId is present, the objective belongs to that team
                    // 3) Else, fall back to killer's team when resolvable
                    const teamId = (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                        ? ev.killerTeamId
                        : (ev.teamId !== undefined && ev.teamId !== null)
                            ? ev.teamId
                            : (killer ? killer.teamId : undefined);
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
                    // Apply same attribution precedence as above
                    const teamId = (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                        ? ev.killerTeamId
                        : (ev.teamId !== undefined && ev.teamId !== null)
                            ? ev.teamId
                            : (killer ? killer.teamId : undefined);
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
                    // Apply same attribution precedence as above
                    const teamId = (ev.killerTeamId !== undefined && ev.killerTeamId !== null)
                        ? ev.killerTeamId
                        : (ev.teamId !== undefined && ev.teamId !== null)
                            ? ev.teamId
                            : (killer ? killer.teamId : undefined);
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

    // Sort by timestamp
    events.sort((a, b) => a.sortKey - b.sortKey);
    return events;
}

// ===== Timeline Explorer Filters =====
function populateTimelineFilter(match) {
    const container = $('timeline-filter');
    if (!container) return;

    // Only build once
    if (container.dataset.ready === '1') return;

    const typeSection = `
        <div class="stat-category">
            <h5>Event Types</h5>
            <div class="form-check">
                <input class="form-check-input timeline-type" type="checkbox" id="tl-type-kill" value="kill" checked>
                <label class="form-check-label" for="tl-type-kill">Champion Kills</label>
            </div>
            <div class="form-check">
                <input class="form-check-input timeline-type" type="checkbox" id="tl-type-objective" value="objective" checked>
                <label class="form-check-label" for="tl-type-objective">Neutral Objectives</label>
            </div>
            <div class="form-check">
                <input class="form-check-input timeline-type" type="checkbox" id="tl-type-building" value="building" checked>
                <label class="form-check-label" for="tl-type-building">Buildings</label>
            </div>
            <div class="form-check">
                <input class="form-check-input timeline-type" type="checkbox" id="tl-type-item" value="item">
                <label class="form-check-label" for="tl-type-item">Items (purchases, sells, consumes)</label>
            </div>
        </div>`;

    // Teams selector removed per requirements. Team toggles are now integrated in the Champions section below.

    // Champions section (participants)
    const byTeam = { 100: [], 200: [], other: [] };
    if (match && Array.isArray(match.participants)) {
        for (const p of match.participants) {
            if (p.teamId === 100) byTeam[100].push(p);
            else if (p.teamId === 200) byTeam[200].push(p);
            else byTeam.other.push(p);
        }
    }

    function championCheckbox(p) {
        const id = `tl-champ-${p.participantId}`;
        const label = `${getParticipantName(match, p)}`;
        const teamCls = p.teamId === 100 ? 'team-blue' : p.teamId === 200 ? 'team-red' : 'team-other';
        const icon = championIDtoImg(p.championId, `champion-img me-1 ${teamCls}`);
        return `
            <div class="form-check">
                <input class="form-check-input timeline-champ" type="checkbox" id="${id}" value="${p.participantId}" data-team="${p.teamId}" checked>
                <label class="form-check-label d-flex align-items-center" for="${id}">${icon}<span class="ms-1">${escapeHtml(label)}</span></label>
            </div>`;
    }

    let champsHtml = '<div class="stat-category mt-3"><h5>Champions</h5>';
    if (byTeam[100].length) {
        champsHtml += '<div class="mb-2"><a href="#" class="tl-team-toggle badge bg-primary text-decoration-none me-2" data-team="100">Blue</a></div>';
        champsHtml += byTeam[100].map(championCheckbox).join('');
    }
    if (byTeam[200].length) {
        champsHtml += '<div class="mt-2 mb-2"><a href="#" class="tl-team-toggle badge bg-danger text-decoration-none me-2" data-team="200">Red</a></div>';
        champsHtml += byTeam[200].map(championCheckbox).join('');
    }
    if (byTeam.other.length) {
        champsHtml += '<div class="mt-2 mb-2"><span class="badge bg-secondary me-2">Other</span></div>';
        champsHtml += byTeam.other.map(championCheckbox).join('');
    }
    champsHtml += '</div>';

    container.innerHTML = typeSection + champsHtml;
    container.dataset.ready = '1';

    // Re-render timeline on any filter change
    container.addEventListener('change', () => {
        renderTimelineExplorer(match);
    });

    // Handle Blue/Red team toggles: unify then toggle all checkboxes for that team
    container.addEventListener('click', (ev) => {
        const toggle = ev.target.closest('.tl-team-toggle');
        if (!toggle) return;
        ev.preventDefault();
        const teamId = parseInt(toggle.getAttribute('data-team'), 10);
        const boxes = Array.from(container.querySelectorAll(`.timeline-champ[data-team="${teamId}"]`));
        if (boxes.length === 0) return;
        const allChecked = boxes.every(cb => cb.checked);
        const targetState = !allChecked; // if all checked -> uncheck all; otherwise check all
        boxes.forEach(cb => { cb.checked = targetState; });
        // Re-render since programmatic changes may not emit change events
        renderTimelineExplorer(match);
    });
}

function getSelectedTimelineFilters() {
    const types = Array.from(document.querySelectorAll('.timeline-type:checked')).map(cb => cb.value);
    const champions = Array.from(document.querySelectorAll('.timeline-champ:checked')).map(cb => parseInt(cb.value));
    return { types, champions };
}

function eventMatchesFilters(e, filters) {
    // Type filter
    if (filters.types && filters.types.length) {
        const t = e.groupType || e.kind; // fallback
        if (!filters.types.includes(t)) return false;
    }

    // Team filter removed per requirements; team toggling is handled via champion selections

    // Champion filter
    if (filters.champions && filters.champions.length) {
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
        if (!participants.some(pid => filters.champions.includes(pid))) {
            return false;
        }
    }

    return true;
}

// Render the timeline explorer UI
function renderTimelineExplorer(match) {
    const list = $('timeline-explorer-list');
    if (!list) return; // Section may not exist

    // Clear current content
    list.innerHTML = '';

    if (!match || !match.frames) {
        list.innerHTML = '<li class="list-group-item">No timeline data available for this match.</li>';
        return;
    }

    // Ensure filters are built
    populateTimelineFilter(match);

    const events = buildTimelineEvents(match);
    // Apply filters
    const filters = getSelectedTimelineFilters();
    const filtered = events.filter(e => eventMatchesFilters(e, filters));

    if (filtered.length === 0) {
        list.innerHTML = '<li class="list-group-item">No timeline events match the selected filters.</li>';
        return;
    }

    const badgeForTeam = (teamId) => teamId === 100 ? 'bg-primary' : teamId === 200 ? 'bg-danger' : 'bg-secondary';

    for (const e of filtered) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex align-items-center justify-content-between';

        const left = document.createElement('div');
        left.className = 'd-flex align-items-center';

        const timeBadge = document.createElement('span');
        timeBadge.className = 'badge rounded-pill bg-secondary me-3';
        timeBadge.textContent = standardTimestamp(e.t);
        left.appendChild(timeBadge);

        if (e.kind === 'kill') {
            // Killer image + name (with team badge) first
            if (e.killer) {
                const killerTeamCls = e.killerTeamId === 100 ? 'team-blue' : e.killerTeamId === 200 ? 'team-red' : 'team-other';
                left.insertAdjacentHTML('beforeend', championIDtoImg(e.killer.championId, `champion-img ${killerTeamCls}`));
                const kSpan = document.createElement('span');
                kSpan.className = 'ms-2 me-2';
                kSpan.innerHTML = `<span class="badge ${badgeForTeam(e.killerTeamId)} me-2">${e.killerTeamId === 100 ? 'Blue' : 'Red'}</span>${escapeHtml(getParticipantName(match, e.killer))}`;
                left.appendChild(kSpan);
            } else {
                const unknownK = document.createElement('span');
                unknownK.className = 'me-2';
                unknownK.textContent = 'Someone';
                left.appendChild(unknownK);
            }

            const actionSpan = document.createElement('span');
            actionSpan.className = 'me-2';
            actionSpan.textContent = 'killed';
            left.appendChild(actionSpan);

            // Victim image + name after
            if (e.victim) {
                const victimTeamCls = e.victimTeamId === 100 ? 'team-blue' : e.victimTeamId === 200 ? 'team-red' : 'team-other';
                left.insertAdjacentHTML('beforeend', championIDtoImg(e.victim.championId, `champion-img ${victimTeamCls}`));
                const vSpan = document.createElement('span');
                vSpan.className = 'ms-2';
                vSpan.innerHTML = `${escapeHtml(getParticipantName(match, e.victim))}`;
                left.appendChild(vSpan);
            } else {
                const unknownV = document.createElement('span');
                unknownV.className = 'ms-2';
                unknownV.textContent = 'a champion';
                left.appendChild(unknownV);
            }

            if (e.assists && e.assists.length > 0) {
                const assistWrap = document.createElement('span');
                assistWrap.className = 'timeline-assists ms-3 text-muted';

                const label = document.createElement('span');
                label.className = 'me-1';
                label.textContent = 'Assisted by:';
                assistWrap.appendChild(label);

                for (const aId of e.assists) {
                    const ap = getParticipantById(match, aId);
                    if (ap) {
                        const aTeamCls = ap.teamId === 100 ? 'team-blue' : ap.teamId === 200 ? 'team-red' : 'team-other';
                        assistWrap.insertAdjacentHTML('beforeend', championIDtoImg(ap.championId, `champion-img assist-icon ${aTeamCls}`));
                    }
                }

                left.appendChild(assistWrap);
            }
        } else if (e.kind === 'objective') {
            const desc = document.createElement('span');
            desc.className = 'me-2';

            if (e.subtype === 'ELITE_MONSTER_KILL') {
                // Compute neutral objective name and show it as a green badge
                const mType = ((e.monsterType || '') + '').toUpperCase();
                const mSub = ((e.monsterSubType || '') + '').toUpperCase();
                let monster;
                if (mType === 'DRAGON' && mSub) {
                    monster = `${mSub.replace(/_/g, ' ').toLowerCase()} dragon`;
                } else if (mType === 'RIFTHERALD' || mType === 'RIFT_HERALD') {
                    monster = 'rift herald';
                } else if (mType === 'BARON_NASHOR') {
                    monster = 'baron nashor';
                } else if (mType === 'HORDE') {
                    monster = 'grub';
                } else {
                    monster = (e.monsterType || '').toString().replace(/_/g, ' ').toLowerCase();
                }

                const actionSpan = document.createElement('span');
                actionSpan.className = 'me-2';
                actionSpan.textContent = 'secured';
                left.appendChild(actionSpan);

                const objBadge = document.createElement('span');
                objBadge.className = 'badge bg-success me-2';
                objBadge.textContent = monster;
                left.appendChild(objBadge);
            } else if (e.subtype === 'BUILDING_KILL') {
                const lane = (e.laneType || '').toString().replace(/_/g, ' ').toLowerCase();
                const tower = (e.towerType || '').toString().replace(/_/g, ' ').toLowerCase();

                let buildingName;
                if ((e.buildingType || '') === 'TOWER_BUILDING') {
                    buildingName = `${lane ? lane + ' ' : ''}${tower || 'tower'}`.trim();
                } else if ((e.buildingType || '') === 'INHIBITOR_BUILDING') {
                    buildingName = `${lane ? lane + ' ' : ''}inhibitor`.trim();
                } else {
                    buildingName = 'structure';
                }

                const actionSpan = document.createElement('span');
                actionSpan.className = 'me-2';
                actionSpan.textContent = 'destroyed';
                left.appendChild(actionSpan);

                const bBadge = document.createElement('span');
                bBadge.className = 'badge bg-warning text-dark me-2';
                bBadge.textContent = buildingName;
                left.appendChild(bBadge);
            } else if (e.subtype === 'INHIBITOR_KILL') {
                const lane = (e.laneType || '').toString().replace(/_/g, ' ').toLowerCase();
                const buildingName = `${lane ? lane + ' ' : ''}inhibitor`.trim();

                const actionSpan = document.createElement('span');
                actionSpan.className = 'me-2';
                actionSpan.textContent = 'destroyed';
                left.appendChild(actionSpan);

                const bBadge = document.createElement('span');
                bBadge.className = 'badge bg-warning text-dark me-2';
                bBadge.textContent = buildingName;
                left.appendChild(bBadge);
            } else {
                desc.textContent = 'captured an objective';
                left.appendChild(desc);
            }
        } else if (e.kind === 'item') {
            // Team badge
            const badge = document.createElement('span');
            badge.className = `badge ${badgeForTeam(e.teamId)} me-3`;
            badge.textContent = e.teamId === 100 ? 'Blue' : e.teamId === 200 ? 'Red' : 'Team';
            left.appendChild(badge);

            // Participant
            if (e.participant) {
                const partTeamCls = e.teamId === 100 ? 'team-blue' : e.teamId === 200 ? 'team-red' : 'team-other';
                left.insertAdjacentHTML('beforeend', championIDtoImg(e.participant.championId, `champion-img ${partTeamCls}`));
                const pSpan = document.createElement('span');
                pSpan.className = 'ms-2 me-2';
                pSpan.textContent = getParticipantName(match, e.participant);
                left.appendChild(pSpan);
            }

            // Action description
            const actionSpan = document.createElement('span');
            actionSpan.className = 'me-2 text-muted';
            actionSpan.textContent = e.action || 'updated items';
            left.appendChild(actionSpan);

            // Item icons
            if (e.kind === 'item' && (e.itemId || e.beforeId || e.afterId)) {
                const isConsumed = e.action === 'consumed';
                const isUndone = e.action === 'undid';
                if (e.beforeId && e.afterId) {
                    // Show transform/undo as before -> after
                    const beforeCls = `item-img me-1${isUndone ? ' grayscale' : ''}`;
                    left.insertAdjacentHTML('beforeend', itemIDtoImg(e.beforeId, beforeCls));
                    const arrow = document.createElement('span');
                    arrow.className = 'me-1 ms-1';
                    arrow.textContent = '→';
                    left.appendChild(arrow);
                    const afterCls = `item-img${isUndone ? ' grayscale' : ''}`;
                    left.insertAdjacentHTML('beforeend', itemIDtoImg(e.afterId, afterCls));
                } else if (e.itemId) {
                    const cls = `item-img${(isConsumed || isUndone) ? ' grayscale' : ''}`;
                    left.insertAdjacentHTML('beforeend', itemIDtoImg(e.itemId, cls));
                }
            }
        }

        li.appendChild(left);
        list.appendChild(li);
    }
}

function populateStatSelector(match) {
	const isArena = match.queueId === 1700;
	const statSelectorContainer = $("stat-selector").parentElement;
	const oldSelector = $("stat-selector");
	const statCheckboxContainer = document.createElement("div");

	statCheckboxContainer.id = "stat-checkbox-container";
	statCheckboxContainer.className = "stat-checkbox-container overflow-auto";
	statCheckboxContainer.style.maxHeight = "600px";
	statCheckboxContainer.style.width = "100%";
	statCheckboxContainer.style.border = "1px solid #dee2e6";
	statCheckboxContainer.style.borderRadius = "0.25rem";
	statCheckboxContainer.style.padding = "10px";

	oldSelector.parentNode.replaceChild(statCheckboxContainer, oldSelector);

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

	const sortedStats = getSortedStats(availableStats);

	// Create checkboxes for each stat category
	for (const categoryName in sortedStats) {
		const categoryDiv = document.createElement('div');
		categoryDiv.className = 'stat-category';

		const categoryHeader = document.createElement('h5');
		categoryHeader.textContent = categoryName;
		categoryDiv.appendChild(categoryHeader);

		sortedStats[categoryName].forEach(statName => {
			const checkboxDiv = document.createElement('div');
			checkboxDiv.className = 'form-check';

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'form-check-input stat-checkbox';
			checkbox.id = `stat-${statName}`;
			checkbox.value = statName;
			checkbox.dataset.stat = statName;

			checkbox.checked = (statName === 'totalDamageDealtToChampions');

			const label = document.createElement('label');
			label.className = 'form-check-label';
			label.htmlFor = `stat-${statName}`;

			if (stat_name_translation[statName]) {
				label.textContent = stat_name_translation[statName];
			} else {
				label.textContent = camelToTitleCase(statName);
			}

			checkbox.addEventListener('change', function () {
				const selectedStats = getSelectedStats();
				if (selectedStats.length > 0) {
					createMultiStatsGraph(match, selectedStats);
				} else if (selectedStats.length === 0) {
					const graphContainer = $("stats-graph");
					graphContainer.innerHTML = '<div class="alert alert-info text-center" style="margin-top: 25%;">Please select at least one stat to display</div>';
				}
			});

			checkboxDiv.appendChild(checkbox);
			checkboxDiv.appendChild(label);
			categoryDiv.appendChild(checkboxDiv);
		});

		statCheckboxContainer.appendChild(categoryDiv);
	}

	const sumSelectionsCheckbox = $("sum-selections-checkbox");
	sumSelectionsCheckbox.addEventListener('change', function () {
		const selectedStats = getSelectedStats();
		if (selectedStats.length > 0) {
			createMultiStatsGraph(match, selectedStats);
		}
	});

	const clearAllLink = document.getElementById('clear-all-stats');
	if (clearAllLink) {
		clearAllLink.onclick = function (e) {
			e.preventDefault();
			document.querySelectorAll('.stat-checkbox:checked').forEach(cb => { cb.checked = false; });
			const graphContainer = $("stats-graph");
			if (graphContainer) {
				graphContainer.innerHTML = '<div class="alert alert-info text-center" style="margin-top: 25%;">Please select at least one stat to display</div>';
			}
		};
	}
}

// Function to create a multi-stats graph grouped by player
function createMultiStatsGraph(match, selectedStats) {
	const graphContainer = $("stats-graph");
	const chartType = $("chart-type-selector").value;
	const isHorizontal = chartType === "horizontal";
	const sumSelections = $("sum-selections-checkbox").checked;

	// Use same participant order as scoreboard and player-stats table
	const isArena = match.queueId === 1700;
	let orderedParticipants;
	if (isArena) {
		// For Arena matches, use the same sorting as the scoreboard
		orderedParticipants = match.participants.slice().sort((a, b) => {
			const aPlacement = getParticipantStat(a, 'placement') || 99;
			const bPlacement = getParticipantStat(b, 'placement') || 99;
			return aPlacement - bPlacement;
		});
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

	// Sort players by team
	players.sort((a, b) => a.teamId - b.teamId);

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
		'rgba(0, 0, 0, 0.7)'
	];

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

	const layout = {
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
				tickangle: 45
			},
			yaxis: isHorizontal ? {
				title: 'Champions',
				tickmode: 'array',
				tickvals: axisCategories,
				ticktext: playerLabels,
				tickfont: { size: 10 }
			} : {
				title: 'Value'
			},
		margin: {
			l: isHorizontal ? 150 : 80,
			r: 50,
			b: isHorizontal ? 50 : 170,
			t: 70,
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
		images: champImages.map((champKey, i) => ({
			source: `https://ddragon.leagueoflegends.com/cdn/${addv}/img/champion/${champKey}.png`,
			x: isHorizontal ? -0.02 : (i / champImages.length + 0.03),
			y: isHorizontal ? (i / champImages.length) + 0.085 : -0.05,
			xref: 'paper',
			yref: 'paper',
			sizex: isHorizontal ? 0.05 : 0.075,
			sizey: isHorizontal ? 0.05 : 0.075,
			xanchor: isHorizontal ? 'right' : 'center',
			yanchor: isHorizontal ? 'middle' : 'top'
		})),
		height: 800
	};

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

	Plotly.newPlot(graphContainer, traces, layout, config);
	$("stats-graph").style.height = "800px";
}
