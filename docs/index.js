"use strict";
let match_url = undefined;
let match_timeline_url = undefined;
const example_param = getParameterByName("example")
if (example_param == "4") {
    match_url = "example-data/match/2808045821.json";
    match_timeline_url = "example-data/timeline/2808045821.json";
}
else if (example_param) {
    match_url = "example-data/match/v5.json";
    match_timeline_url = "example-data/timeline/v5.json";
} else {
    match_url = getParameterByName("match");
    match_timeline_url = getParameterByName("timeline");
}
const queues = {};
for (let queue of QUEUE_GROUPS) {
    queues[queue.id] = queue.name;
}
const exclude_stat_name = [
    "playerScore0",
    "playerScore1",
    "playerScore2",
    "playerScore3",
    "playerScore4",
    "playerScore5",
    "playerScore6",
    "playerScore7",
    "playerScore8",
    "playerScore9",
    "item0",
    "item1",
    "item2",
    "item3",
    "item4",
    "item5",
    "item6",
    "participantId"
];
const stat_name_translation = {
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
};

// Stats that should be prioritized in the dropdown for the graph
const prioritized_stats = [
    "kills", "deaths", "assists", "totalDamageDealtToChampions",
    "goldEarned", "visionScore", "totalMinionsKilled", "wardsPlaced",
    "turretKills", "totalHeal", "damageDealtToObjectives"
];

// Stats that work well in graph format
const graphable_stats = [
    ...prioritized_stats,
    "magicDamageDealtToChampions", "physicalDamageDealtToChampions", "trueDamageDealtToChampions",
    "totalDamageTaken", "damageDealtToTurrets", "timeCCingOthers", "totalTimeCrowdControlDealt",
    "neutralMinionsKilled", "wardsKilled", "spell1Casts", "spell2Casts", "spell3Casts", "spell4Casts"
];

// Define stat categories for grouping in the UI
const stat_categories = [
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
            "champLevel",
            "kills", "deaths", "assists",
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
        stats: [] // Will be populated automatically with any stats not in other categories
    }
];

// Function to get the category for a stat
function getStatCategory(statName) {
    for (const category of stat_categories) {
        if (category.stats.includes(statName)) {
            return category.name;
        }
    }
    return "Other"; // Default category for uncategorized stats
}

// Function to sort stats by their categories and maintain original ordering within categories
function getSortedStats(availableStats) {
    // Create a map of all stats by category
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
        // Only process if this category has stats
        if (statsByCategory[category.name].length > 0) {
            // Create a copy of the original array to sort
            const statsInCategory = [...statsByCategory[category.name]];

            // Sort based on the order in the stat_categories definition
            statsInCategory.sort((a, b) => {
                // For stats in the predefined category, use the order in stat_categories
                if (category.stats.includes(a) && category.stats.includes(b)) {
                    return category.stats.indexOf(a) - category.stats.indexOf(b);
                }
                // If only one stat is in the predefined list, prioritize it
                else if (category.stats.includes(a)) {
                    return -1;
                }
                else if (category.stats.includes(b)) {
                    return 1;
                }
                // For stats not in the predefined list (like new stats that were added later),
                // sort them alphabetically at the end
                else {
                    const nameA = stat_name_translation[a] || camelToTitleCase(a);
                    const nameB = stat_name_translation[b] || camelToTitleCase(b);
                    return nameA.localeCompare(nameB);
                }
            });

            // Replace the original array with the sorted one
            statsByCategory[category.name] = statsInCategory;
        }
    }

    return statsByCategory;
}

function camelToTitleCase(str) {
    // Insert a space before all capital letters
    let result = str.replace(/([A-Z])/g, ' $1');
    // Capitalize the first letter and return the modified string
    return result.charAt(0).toUpperCase() + result.slice(1);
}
const stat_value_override = {
    "perk0": runeToCell,
    "perk1": runeToCell,
    "perk2": runeToCell,
    "perk3": runeToCell,
    "perk4": runeToCell,
    "perk5": runeToCell,
    "perkPrimaryStyle": runeToCell,
    "perkSubStyle": runeToCell,
};
const regions = {
    "BR1": "BR",
    "EUN1": "EUNE",
    "EUW1": "EUW",
    "JP1": "JP",
    "KR": "KR",
    "LA1": "LAN",
    "LA2": "LAS",
    "NA1": "NA",
    "OC1": "OCE",
    "TR1": "TR",
    "RU": "RU",
    "PBE1": "PBE",
    "PH2": "PH",
    "SG2": "SG",
    "TH2": "TH",
    "TW2": "TW",
    "VN2": "VN",
    "ME1": "ME"
};
let addv;
let spell_data;
let champion_data;
let rune_data;
loadJSON(match_url).then(match_data => {
    let match = new Match(champion_data, match_data, null, true);
    const major_patch = match.gameVersion.substring(0, match.gameVersion.indexOf(".", match.gameVersion.indexOf(".") + 1));
    addv = major_patch + ".1"; //active ddragon version
    $("metadata").innerHTML = `<h1>${queues[match.queueId]}</h1>
        <p class="m-1">${new Date(match.gameCreation).toLocaleDateString()} ${new Date(match.gameCreation).toLocaleTimeString()}</p>
        <p class="m-1">Region: ${escapeHtml(regions[match.platformId])}, Match ID: ${escapeHtml(match.gameId)}, Patch ${escapeHtml(major_patch)}, Duration: ${standardTimestamp(match.gameDuration)}</p>`;
    Promise.all([
        loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/champion.json`),
        loadJSON(match_timeline_url, true),
        loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/summoner.json`),
        loadJSON(`https://ddragon.leagueoflegends.com/cdn/${addv}/data/en_US/runesReforged.json`)
    ]).then(responses => {
        console.log(responses);
        champion_data = responses[0];
        const timeline_data = responses[1];
        spell_data = responses[2];
        rune_data = responses[3];
        match = new Match(champion_data, match_data, timeline_data, true);
        console.log(match);
        let teams = match.teams.map((team, team_index) => {
            //____, ______, ______, Level, _____, Team #       , _____, _____, _____, _____, _____, _____, _____, _________, __, ____
            //Rune, Spell1, Spell2, Level, Champ, Summoner Name, Item0, Item1, Item2, Item3, Item4, Item5, Item6, K / D / A, CS, Gold
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
                let pI = match.participantIdentities.find(pI => p.participantId == pI.participantId);
                return `<tr class="match-${p.stats.win ? "victory" : "defeat"}">
            <td>${runeIDtoImg(p.stats.perk0)}</td>
            <td>${spellIDtoImg(p.spell1Id)}${spellIDtoImg(p.spell2Id)}</td>
            ${cellText(p.stats.champLevel)}
            <td>${championIDtoImg(p.championId)}</td>
            ${cellText(pI.player.summonerName)}
            <td class="tal">${itemIDtoImg(p.stats.item0)}
            ${itemIDtoImg(p.stats.item1)}
            ${itemIDtoImg(p.stats.item2)}
            ${itemIDtoImg(p.stats.item3)}
            ${itemIDtoImg(p.stats.item4)}
            ${itemIDtoImg(p.stats.item5)}
            ${itemIDtoImg(p.stats.item6, "item-img ms-5")}</td>
            ${cellText(`${p.stats.kills} / ${p.stats.deaths} / ${p.stats.assists}`)}
            ${cellText(p.stats.neutralMinionsKilled + p.stats.totalMinionsKilled)}
            ${cellText(p.stats.goldEarned)}</tr>`;
            }).join("")}`;
        }).join("<tr><td>&nbsp;</td></tr>");
        teams = "<table class=\"table\">" + teams + "</table>";
        $("scoreboard").innerHTML = teams;
        let participant_stat_props = [];
        for (let participant_id in match.participants) {
            for (let prop_name in match.participants[participant_id].stats) {
                if (!exclude_stat_name.includes(prop_name) && !participant_stat_props.includes(prop_name)) {
                    participant_stat_props.push(prop_name);
                }
            }
        }
        let stats = `<table class="table table-striped mt-5"><thead class="sticky">
        <tr>${headerText("Summoner Name")}${match.participants.map(p => {
            let pI = match.participantIdentities.find(pI => p.participantId == pI.participantId);
            return headerText(pI.player.summonerName);
        }).join("")}</tr>
        <tr>${headerText("Champion")}${match.participants.map(p => {
            return `<th>${championIDtoImg(p.championId)}</th>`;
        }).join("")}</tr>
        </thead>
        ${participant_stat_props.map(prop_name => {
            let remapped_prop_name = camelToTitleCase(prop_name);
            if (stat_name_translation[prop_name]) {
                remapped_prop_name = stat_name_translation[prop_name];
            }
            return `<tr>${headerText(remapped_prop_name, "tal")}${match.participants.map(p => {
                let classes = "";
                if (p.stats[prop_name] === true) {
                    classes = "bool-true";
                }
                else if (p.stats[prop_name] === false) {
                    classes = "bool-false";
                }
                else if (p.stats[prop_name] === null || p.stats[prop_name] === undefined) {
                    return cellText("");
                }
                if (stat_value_override[prop_name]) {
                    return stat_value_override[prop_name](p.stats[prop_name]);
                }
                else {
                    return cellText(p.stats[prop_name], classes);
                }
            }).join("")}</tr>`;
        }).join("")}</table>`
        $("player-stats").innerHTML = stats;

        // Initialize the stats graph functionality
        populateStatSelector(match);

        // Add event listener for chart type selection to update the graph when chart type changes
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
                // Show message in plot area
                const graphContainer = $("stats-graph");
                if (graphContainer) {
                    graphContainer.innerHTML = '<div class="alert alert-info text-center" style="margin-top: 25%;">Please select at least one stat to display</div>';
                }
            };
        }

        // Plot the default selected stats on page load (with a slight delay to ensure DOM is ready)
        setTimeout(() => {
            const selectedStats = getSelectedStats();
            if (selectedStats.length > 0) {
                createMultiStatsGraph(match, selectedStats);
            }
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

function runeToCell(id) {
    return cellUnsafe(runeIDtoImg(id));
}
function cellUnsafe(text = "", classes = "") {
    return `<td${classes == "" ? "" : ` class="${escapeHtml(classes)}"`}>${text}</td>`;
}
function cellText(text = "", classes = "") {
    return `<td${classes == "" ? "" : ` class="${escapeHtml(classes)}"`}>${escapeHtml(text)}</td>`;
}
function headerText(text = "", classes = "") {
    return `<th${classes == "" ? "" : ` class="${escapeHtml(classes)}"`}>${escapeHtml(text)}</th>`;
}

function $(id) {
    return document.getElementById(id);
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadJSON(url, allow_null = false) {
    if (url === undefined || url === null && allow_null) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }
    else {
        return new Promise((resolve, reject) => {
            let request = new Request(url, { method: "GET" });
            fetch(request).then(response => {
                resolve(response.json());
            }).catch(error => {
                console.error(error);
                reject(error);
            });
        });
    }
}

function handleError(err) {
    console.error(err);
    // Remove spinner and show error message in scoreboard
    var scoreboard = $("scoreboard");
    if (scoreboard) {
        scoreboard.innerHTML = '<div class="alert alert-danger text-center mt-5">' +
            (err instanceof SyntaxError && /JSON/.test(err.message)
                ? "No match or timeline data provided, or the data could not be loaded. Please select an example or provide valid data sources in the URL."
                : escapeHtml(err.message || err)) +
            '</div>';
    }
    // Optionally clear stats graph and player stats
    var statsGraph = $("stats-graph");
    if (statsGraph) statsGraph.innerHTML = "";
    var playerStats = $("player-stats");
    if (playerStats) playerStats.innerHTML = "";
}

function escapeHtml(unsafe) {
    unsafe = unsafe + "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function championIDtoImg(id, img_class = "champion-img") {
    for (let b in champion_data.data) {
        if (champion_data.data[b].key == id) {
            return `<img${img_class == "" ? "" : ` class=${escapeHtml(img_class)}`} src="https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(addv)}/img/champion/${encodeURIComponent(b)}.png">`;
        }
    }
    return `<div class="${img_class}">&nbsp;</div>`;
}

function itemIDtoImg(id, img_class = "item-img") {
    if (id == 0) return `<div class="${img_class}">&nbsp;</div>`;
    return `<img class="${img_class}" src="https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(addv)}/img/item/${encodeURIComponent(id)}.png">`;
}

function spellIDtoImg(id, img_class = "spell-img") {
    for (let b in spell_data.data) {
        if (spell_data.data[b].key == id) {
            return `<img class="${img_class}" src="https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(addv)}/img/spell/${encodeURIComponent(spell_data.data[b].id)}.png">`;
        }
    }
    return "";
}

function runeIDtoImg(id, img_class = "rune-img") {
    for (let b in rune_data) {
        if (rune_data[b].id == id) {
            return `<img class="${img_class}" src="https://ddragon.leagueoflegends.com/cdn/img/${rune_data[b].icon}">`;
        }
        for (let c in rune_data[b].slots) {
            for (let d in rune_data[b].slots[c].runes) {
                if (rune_data[b].slots[c].runes[d].id == id) {
                    return `<img class="${img_class}" src="https://ddragon.leagueoflegends.com/cdn/img/${rune_data[b].slots[c].runes[d].icon}">`;
                }
            }
        }
    }
    return "";
}

function standardTimestamp(sec) {
    let mins = Math.floor(parseInt(sec) / 60);
    let hours = Math.floor(parseInt(mins) / 60);
    let days = Math.floor(parseInt(hours) / 24);
    mins = mins % 60;
    hours = hours % 24;
    let secs = Math.floor(parseInt(sec) % 60);
    if (secs < 10) secs = "0" + secs;
    if (mins < 10) mins = "0" + mins;
    if (hours == "00" && days == 0) return `${mins}m:${secs}s`;
    else if (days == 0) return `${hours}h:${mins}m:${secs}s`;
    else return `${days}d:${hours}h:${mins}m:${secs}s`;
}

// Function to populate the stat selector dropdown
function populateStatSelector(match) {
    const statSelectorContainer = $("stat-selector").parentElement;

    // Replace the select element with a div for checkboxes
    const oldSelector = $("stat-selector");
    const statCheckboxContainer = document.createElement("div");
    statCheckboxContainer.id = "stat-checkbox-container";
    statCheckboxContainer.className = "stat-checkbox-container overflow-auto";
    statCheckboxContainer.style.maxHeight = "400px"; // Increased height from 300px to 400px
    statCheckboxContainer.style.width = "100%"; // Use full width of parent container instead of fixed 300px
    statCheckboxContainer.style.border = "1px solid #dee2e6";
    statCheckboxContainer.style.borderRadius = "0.25rem";
    statCheckboxContainer.style.padding = "10px";

    // Replace the selector with the checkbox container
    oldSelector.parentNode.replaceChild(statCheckboxContainer, oldSelector);

    // Create a list of all available stats for graphing
    const availableStats = [];

    // Add prioritized stats first
    for (const statName of prioritized_stats) {
        if (match.participants[0].stats[statName] !== undefined) {
            availableStats.push(statName);
        }
    }

    // Add other graphable stats
    for (const statName of graphable_stats) {
        if (!availableStats.includes(statName) && match.participants[0].stats[statName] !== undefined) {
            availableStats.push(statName);
        }
    }

    // Add all remaining numeric stats that aren't in the exclude list
    for (const participant of match.participants) {
        for (const statName in participant.stats) {
            if (!exclude_stat_name.includes(statName) &&
                !availableStats.includes(statName) &&
                typeof participant.stats[statName] === 'number') {
                availableStats.push(statName);
            }
        }
    }

    // Sort stats by categories
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

            // Only select totalDamageDealtToChampions by default
            checkbox.checked = (statName === 'totalDamageDealtToChampions');

            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `stat-${statName}`;

            // Use translated stat name if available
            if (stat_name_translation[statName]) {
                label.textContent = stat_name_translation[statName];
            } else {
                label.textContent = camelToTitleCase(statName);
            }

            // Add click event listener to update the plot immediately when a checkbox changes
            checkbox.addEventListener('change', function () {
                const selectedStats = getSelectedStats();
                // Only update if at least one stat is selected
                if (selectedStats.length > 0) {
                    createMultiStatsGraph(match, selectedStats);
                } else if (selectedStats.length === 0) {
                    // If no stats are selected, show a brief message in the plot area
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
            // Show message in plot area
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

    // Collect player information
    const players = match.participants.map(participant => {
        const playerIdentity = match.participantIdentities.find(pI => pI.participantId === participant.participantId);
        const playerName = playerIdentity ? playerIdentity.player.summonerName : `Player ${participant.participantId}`;
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
            statValues[statName] = participant.stats[statName] || 0;
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

    // In horizontal mode, reverse the players array so they appear in reverse order on the y-axis
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

    // Create player labels that include champion name and player name
    const playerLabels = orderedPlayers.map(player => `${player.champName} (${player.name})`);

    // Create champion images array for axis labeling
    const champImages = orderedPlayers.map(player => player.champKey);

    if (sumSelections && selectedStats.length > 0) {
        // Create a single trace with summed stats
        const summedValues = orderedPlayers.map(player => {
            return selectedStats.reduce((sum, statName) => sum + player.statValues[statName], 0);
        });

        // If we have multiple stats selected, use a stacked bar chart
        if (selectedStats.length > 1) {
            // Create one trace per stat, but with stack group for sum representation
            selectedStats.forEach((statName, statIndex) => {
                // Get stat display name
                let statDisplayName = statDisplayNames[statIndex];

                // Values for each player for this stat
                const values = orderedPlayers.map(player => player.statValues[statName]);

                // Choose a color for this stat
                const color = statColors[statIndex % statColors.length];
                const borderColor = color.replace('0.7', '1.0');

                const trace = {
                    name: statDisplayName,
                    type: 'bar',
                    x: isHorizontal ? values : champImages,
                    y: isHorizontal ? champImages : values,
                    orientation: isHorizontal ? 'h' : 'v',
                    marker: {
                        color: color,
                        line: {
                            color: borderColor,
                            width: 1.5
                        }
                    },
                    hoverinfo: 'text',
                    hovertext: orderedPlayers.map((player, i) => {
                        return `<b>${player.name}</b><br>${player.champName}<br>${statDisplayName}: ${values[i].toLocaleString()}`;
                    })
                };
                traces.push(trace);
            });
        } else {
            // If only one stat, use a regular bar chart
            const trace = {
                name: 'Sum of Selected Stats',
                type: 'bar',
                x: isHorizontal ? summedValues : champImages,
                y: isHorizontal ? champImages : summedValues,
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
        // Handle normal mode (non-summed stats)
        // For horizontal mode, reverse the order of stats to display them in a more intuitive order
        const orderedSelectedStats = isHorizontal ? [...selectedStats].reverse() : selectedStats;
        const orderedStatDisplayNames = isHorizontal ? [...statDisplayNames].reverse() : statDisplayNames;

        // Create a trace for each stat
        orderedSelectedStats.forEach((statName, statIndex) => {
            // Get stat display name
            let statDisplayName = orderedStatDisplayNames[statIndex];

            // Values for each player for this stat
            const values = orderedPlayers.map(player => player.statValues[statName]);

            // Choose a color for this stat
            const color = statColors[statIndex % statColors.length];
            const borderColor = color.replace('0.7', '1.0');

            // Create the trace for this stat
            const trace = {
                name: statDisplayName,
                type: 'bar',
                // If horizontal, swap x and y
                x: isHorizontal ? values : champImages,
                y: isHorizontal ? champImages : values,
                text: values.map(val => val.toLocaleString()),
                textposition: 'auto',
                orientation: isHorizontal ? 'h' : 'v',
                marker: {
                    color: color,
                    line: {
                        color: borderColor,
                        width: 1.5
                    }
                },
                hoverinfo: 'text',
                hovertext: orderedPlayers.map((player, i) => {
                    return `<b>${player.name}</b><br>${player.champName}<br>${statDisplayName}: ${values[i].toLocaleString()}`;
                })
            };

            traces.push(trace);
        });
    }

    // Set up the layout for the graph
    const layout = {
        title: 'Multiple Stats Comparison',
        barmode: sumSelections && selectedStats.length > 1 ? 'stack' : 'group', // Stack when summing multiple stats
        xaxis: isHorizontal ? {
            title: 'Value'
        } : {
            title: 'Champions',
            tickangle: 0,
            tickmode: 'array',
            tickvals: champImages,
            ticktext: playerLabels,
            tickfont: {
                size: 9
            },
            tickangle: 45 // Angle text for readability
        },
        yaxis: isHorizontal ? {
            title: 'Champions',
            tickmode: 'array',
            tickvals: champImages,
            ticktext: playerLabels,
            tickfont: {
                size: 10
            }
        } : {
            title: 'Value'
        },
        margin: {
            l: isHorizontal ? 150 : 80,
            r: 50,
            b: isHorizontal ? 50 : 170, // Increase bottom margin to fit angled labels in vertical mode
            t: 70,
            pad: 4
        },
        legend: {
            title: {
                text: 'Statistics'
            },
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'right',
            x: 1
        },
        // Add champion images
        images: champImages.map((champKey, i) => ({
            source: `https://ddragon.leagueoflegends.com/cdn/${addv}/img/champion/${champKey}.png`,
            x: isHorizontal ? -0.05 : (i / champImages.length + 0.03),
            y: isHorizontal ? (i / champImages.length) + 0.085 : -0.05,
            xref: 'paper',
            yref: 'paper',
            sizex: isHorizontal ? 0.05 : 0.075,
            sizey: isHorizontal ? 0.05 : 0.075,
            xanchor: isHorizontal ? 'right' : 'center',
            yanchor: isHorizontal ? 'middle' : 'top'
        })),
        height: 600
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

    // Update the height of the graph container
    $("stats-graph").style.height = "600px";
}
