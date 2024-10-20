"use strict";
let match_url = undefined;
let match_timeline_url = undefined;
if (getParameterByName("example")) {
    match_url = "example-data/match/v5.json";
    match_timeline_url = "example-data/timeline/v5.json";
} else {
    match_url = getParameterByName("match");
    match_timeline_url = getParameterByName("timeline");
}
const queues = {
    "0": "Custom",
    "70": "SR One for All",
    "72": "HA 1v1 Snowdown Showdown",
    "73": "HA 2v2 Snowdown Showdown",
    "75": "SR 6v6 Hexakill",
    "76": "SR URF",
    "78": "HA One For All: Mirror",
    "83": "SR Co-op vs AI URF",
    "98": "TT 6v6 Hexakill",
    "100": "BB 5v5 ARAM",
    "310": "SR Nemesis",
    "313": "SR Black Market Brawlers",
    "317": "CS Definitely Not Dominion",
    "325": "SR All Random",
    "400": "SR Draft",
    "420": "SR Ranked Solo", //ranked
    "430": "SR Blind",
    "440": "SR Ranked Flex", //ranked
    "450": "HA ARAM",
    "460": "TT Blind",
    "470": "TT Ranked Flex", //ranked
    "600": "SR Blood Hunt",
    "610": "CR Dark Star: Singularity",
    "700": "SR Clash",
    "720": "HA Clash",
    "800": "TT Co-op vs AI Intermediate",
    "810": "TT Co-op vs AI Intro",
    "820": "TT Co-op vs AI Beginner",
    "830": "SR Co-op vs AI Intro",
    "840": "SR Co-op vs AI Beginner",
    "850": "SR Co-op vs AI Intermediate",
    "870": "SR Co-op vs AI New: Intro",
    "880": "SR Co-op vs AI New: Beginner",
    "890": "SR Co-op vs AI New: Intermediate",
    "900": "SR ARURF",
    "910": "CS Ascension",
    "920": "HA Legend of the Poro King",
    "940": "SR Nexus Siege",
    "950": "SR Doom Bots Voting",
    "960": "SR Doom Bots Standard",
    "980": "VP Star Guardian Invasion: Normal",
    "990": "VP Star Guardian Invasion: Onslaught",
    "1000": "OC Project: Hunters",
    "1010": "SR Snow ARURF",
    "1020": "SR One for All",
    "1030": "OE Intro",
    "1040": "OE Cadet",
    "1050": "OE Crewmember",
    "1060": "OE Captain",
    "1070": "OE Onslaught",
    "1200": "NB Nexus Blitz",
    "1300": "NB Nexus Blitz",
    "1400": "SR Ultimate Spellbook",
    "1810": "FC Swarm (1 Player)",
    "1810": "FC Swarm (2 Players)",
    "1810": "FC Swarm (3 Players)",
    "1810": "FC Swarm (4 Players)",
    "2000": "SR Tutorial 1",
    "2010": "SR Tutorial 2",
    "2020": "SR Tutorial 3"
};
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

};
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
            ${headerText(`Team ${team_index + 1}`)}
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
            return `<tr>${headerText(prop_name, "tal")}${match.participants.map(p => {
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
    }).catch(handleError);
}).catch(handleError);

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
    alert(err);
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
	if (hours < 10) hours = "0" + hours;
	if (hours == "00" && days == 0) return `${mins}m:${secs}s`;
	else if (days == 0) return `${hours}h:${mins}m:${secs}s`;
	else return `${days}d:${hours}h:${mins}m:${secs}s`;
}
