/**
 * League of Legends Queue Groups Configuration
 *
 * This module contains the mapping of League of Legends queue IDs to their
 * human-readable names and categorization by game mode/map type.
 *
 * Data is organized by queue groups for easy filtering and display in the UI.
 * Queue IDs are based on Riot Games API documentation.
 *
 * @author iaace LLC
 * @version 2.0.0
 * @license AGPL-3.0
 */

"use strict";

/**
 * Array of queue configurations with ID, name, and group categorization
 * @type {Array<{id: string|null, name: string, group: string}>}
 */
const QUEUE_GROUPS = [
    {
        "id": "0",
        "name": "Custom (Not Supported)",
        "group": "Other"
    },
    {
        "id": null,
        "name": "Unknown",
        "group": "Other"
    },




    {
        "id": "430",
        "name": "SR Blind",
        "group": "Summoner's Rift"
    },
    {
        "id": "490",
        "name": "SR Quickplay",
        "group": "Summoner's Rift"
    },
    {
        "id": "480",
        "name": "SR Swiftplay",
        "group": "Summoner's Rift"
    },
    {
        "id": "400",
        "name": "SR Draft",
        "group": "Summoner's Rift"
    },
    {
        "id": "420",
        "name": "SR Ranked Solo",
        "group": "Summoner's Rift"
    },
    {
        "id": "440",
        "name": "SR Ranked Flex",
        "group": "Summoner's Rift"
    },
    {
        "id": "700",
        "name": "SR Clash",
        "group": "Summoner's Rift"
    },




    {
        "id": "830",
        "name": "SR Co-op vs AI Intro",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "840",
        "name": "SR Co-op vs AI Beginner",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "850",
        "name": "SR Co-op vs AI Intermediate",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "870",
        "name": "SR Co-op vs AI New: Intro",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "880",
        "name": "SR Co-op vs AI New: Beginner",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "890",
        "name": "SR Co-op vs AI New: Intermediate",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "950",
        "name": "SR Doom Bots Voting",
        "group": "Summoner's Rift Co-op vs. AI"
    },
    {
        "id": "960",
        "name": "SR Doom Bots Standard",
        "group": "Summoner's Rift Co-op vs. AI"
    },





    {
        "id": "70",
        "name": "SR One for All (Old)",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "1020",
        "name": "SR One for All",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "1900",
        "name": "SR URF",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "76",
        "name": "SR URF (Old)",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "900",
        "name": "SR ARURF",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "740",
        "name": "SR ARURF Clash",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "1010",
        "name": "SR Snow ARURF",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "83",
        "name": "SR Co-op vs AI URF",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "75",
        "name": "SR 6v6 Hexakill",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "325",
        "name": "SR All Random",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "310",
        "name": "SR Nemesis",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "313",
        "name": "SR Black Market Brawlers",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "600",
        "name": "SR Blood Hunt",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "940",
        "name": "SR Nexus Siege",
        "group": "Summoner's Rift Special/RGM"
    },
    {
        "id": "1400",
        "name": "SR Ultimate Spellbook",
        "group": "Summoner's Rift Special/RGM"
    },







    {
        "id": "450",
        "name": "HA ARAM",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "920",
        "name": "HA Legend of the Poro King",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "72",
        "name": "HA 1v1 Snowdown Showdown",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "73",
        "name": "HA 2v2 Snowdown Showdown",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "78",
        "name": "HA One For All: Mirror",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "100",
        "name": "BB 5v5 ARAM",
        "group": "Howling Abyss (Special/RGM)"
    },
    {
        "id": "720",
        "name": "HA Clash",
        "group": "Howling Abyss (Special/RGM)"
    },









    {
        "id": "1200",
        "name": "NB Nexus Blitz (Old)",
        "group": "Nexus Blitz"
    },
    {
        "id": "1300",
        "name": "NB Nexus Blitz",
        "group": "Nexus Blitz"
    },










    {
        "id": "460",
        "name": "TT Blind",
        "group": "Twisted Treeline"
    },
    {
        "id": "470",
        "name": "TT Ranked Flex",
        "group": "Twisted Treeline"
    },








    {
        "id": "98",
        "name": "TT 6v6 Hexakill",
        "group": "Twisted Treeline Special/RGM"
    },







    {
        "id": "810",
        "name": "TT Co-op vs AI Intro",
        "group": "Twisted Treeline Co-op vs. AI"
    },
    {
        "id": "820",
        "name": "TT Co-op vs AI Beginner",
        "group": "Twisted Treeline Co-op vs. AI"
    },
    {
        "id": "800",
        "name": "TT Co-op vs AI Intermediate",
        "group": "Twisted Treeline Co-op vs. AI"
    },







    {
        "id": "317",
        "name": "CS Definitely Not Dominion",
        "group": "Crystal Scar Special/RGM"
    },
    {
        "id": "910",
        "name": "CS Ascension",
        "group": "Crystal Scar Special/RGM"
    },







    {
        "id": "1810",
        "name": "FC Swarm (1 Player)",
        "group": "Swarm Event"
    },
    {
        "id": "1820",
        "name": "FC Swarm (2 Players)",
        "group": "Swarm Event"
    },
    {
        "id": "1830",
        "name": "FC Swarm (3 Players)",
        "group": "Swarm Event"
    },
    {
        "id": "1840",
        "name": "FC Swarm (4 Players)",
        "group": "Swarm Event"
    },







    {
        "id": "610",
        "name": "CR Dark Star: Singularity",
        "group": "Dark Star Event"
    },







    {
        "id": "980",
        "name": "VP Star Guardian Invasion: Normal",
        "group": "Star Guardian Event"
    },
    {
        "id": "990",
        "name": "VP Star Guardian Invasion: Onslaught",
        "group": "Star Guardian Event"
    },






    {
        "id": "1000",
        "name": "OC Project: Hunters",
        "group": "Project Event"
    },






    {
        "id": "1030",
        "name": "OE Intro",
        "group": "Odyssey Event"
    },
    {
        "id": "1040",
        "name": "OE Cadet",
        "group": "Odyssey Event"
    },
    {
        "id": "1050",
        "name": "OE Crewmember",
        "group": "Odyssey Event"
    },
    {
        "id": "1060",
        "name": "OE Captain",
        "group": "Odyssey Event"
    },
    {
        "id": "1070",
        "name": "OE Onslaught",
        "group": "Odyssey Event"
    },






    {
        "id": "2000",
        "name": "SR Tutorial 1",
        "group": "Tutorial"
    },
    {
        "id": "2010",
        "name": "SR Tutorial 2",
        "group": "Tutorial"
    },
    {
        "id": "2020",
        "name": "SR Tutorial 3",
        "group": "Tutorial"
    },

    {
        "id": "1700",
        "name": "RW Arena",
        "group": "Arena"
    },
    {
        "id": "1710",
        "name": "RW Arena (Custom)",
        "group": "Arena"
    }
];

/**
 * Utility functions for working with queue data
 */

/**
 * Find queue information by queue ID
 * @param {string|number|null} queueId - The queue ID to search for
 * @returns {Object|null} Queue object if found, null otherwise
 */
function findQueueById(queueId) {
    const id = queueId ? String(queueId) : null;
    return QUEUE_GROUPS.find(queue => queue.id === id) || null;
}

/**
 * Get all unique queue groups
 * @returns {Array<string>} Array of unique group names
 */
function getQueueGroups() {
    return [...new Set(QUEUE_GROUPS.map(queue => queue.group))].sort();
}

/**
 * Get all queues in a specific group
 * @param {string} groupName - Name of the group to filter by
 * @returns {Array<Object>} Array of queue objects in the specified group
 */
function getQueuesByGroup(groupName) {
    return QUEUE_GROUPS.filter(queue => queue.group === groupName);
}

/**
 * Get a human-readable queue name by ID
 * @param {string|number|null} queueId - The queue ID
 * @returns {string} Human-readable queue name
 */
function getQueueName(queueId) {
    const queue = findQueueById(queueId);
    return queue ? queue.name : "Unknown Queue";
}

/**
 * Check if a queue ID represents a ranked queue
 * @param {string|number|null} queueId - The queue ID to check
 * @returns {boolean} True if the queue is ranked
 */
function isRankedQueue(queueId) {
    const queue = findQueueById(queueId);
    return queue ? queue.name.toLowerCase().includes('ranked') : false;
}

// Export for browser usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QUEUE_GROUPS,
        findQueueById,
        getQueueGroups,
        getQueuesByGroup,
        getQueueName,
        isRankedQueue
    };
}