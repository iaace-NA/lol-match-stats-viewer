#!/usr/bin/env node
"use strict";
/*
Checks that every field in match-v5 data is accounted for in the legacy (match-v4
shaped) view Match exposes. Each field must be:

  represented  the view carries it, and its value is compared against the source
  omitted      deliberately left out of the view, with the reason recorded
  gap          the view has a legacy field for it but leaves that field empty; listed
               on every run as known debt, not a failure

A field in none of these fails the check, so when Riot adds one it gets a decision
instead of silently missing from the view. A represented field whose value differs in
the view also fails.

  node tests/legacy-view-coverage.js
  node tests/legacy-view-coverage.js match.json timeline.json [match.json timeline.json ...]

With no arguments it checks every match-v5 example under docs/example-data. Pass other
match and timeline pairs to check data that is not committed here, such as a local
collection of matches. A timeline path may be "-" to check a match alone.

Rule paths are dot-separated keys. A "[]" suffix matches any array element, a "{}"
suffix any entry of a keyed object (participantFrames), and a final "**" any remaining
subtree, including none. Source paths start with "match:" or "timeline:". View paths
are read from the Match instance, their wildcards filled in order from the source's.
*/
const fs = require("fs");
const path = require("path");
const Match = require("../docs/match.js");

const represented = (source, view, expect) => ({ source, view, expect });
const omitted = (sources, reason) => sources.map(source => ({ source, omit: reason }));
const gap = (source, legacy) => ({ source, gap: legacy });
const participant = name => `match:info.participants[].${name}`;

// Participant fields _buildLegacyStats copies into stats under the same name.
const SAME_NAME_STATS = [
	"win", "item0", "item1", "item2", "item3", "item4", "item5", "item6", "roleBoundItem",
	"kills", "deaths", "assists", "largestKillingSpree", "largestMultiKill", "killingSprees",
	"longestTimeSpentLiving", "doubleKills", "tripleKills", "quadraKills", "pentaKills",
	"unrealKills", "totalDamageDealt", "magicDamageDealt", "physicalDamageDealt",
	"trueDamageDealt", "largestCriticalStrike", "totalDamageDealtToChampions",
	"magicDamageDealtToChampions", "physicalDamageDealtToChampions",
	"trueDamageDealtToChampions", "totalHeal", "totalUnitsHealed", "damageSelfMitigated",
	"damageDealtToObjectives", "damageDealtToTurrets", "visionScore", "timeCCingOthers",
	"totalDamageTaken", "physicalDamageTaken", "trueDamageTaken", "goldEarned", "goldSpent",
	"turretKills", "inhibitorKills", "totalMinionsKilled", "neutralMinionsKilled",
	"totalTimeCCDealt", "champLevel", "visionWardsBoughtInGame", "sightWardsBoughtInGame",
	"wardsPlaced", "wardsKilled", "firstBloodKill", "firstBloodAssist", "firstTowerKill",
	"firstTowerAssist", "spell1Casts", "spell2Casts", "spell3Casts", "spell4Casts",
	"summoner1Casts", "summoner2Casts", "totalDamageShieldedOnTeammates",
	"totalHealsOnTeammates", "detectorWardsPlaced", "totalTimeSpentDead", "gameEndedInSurrender",
	"gameEndedInEarlySurrender", "teamEarlySurrendered", "teamPosition", "individualPosition",
	"positionAssignedByMatchmaking",
];

// Primary style selections become perk0-perk3, secondary style selections perk4-perk5.
const perkField = ([player, style, slot], suffix) =>
	["participants", player, "stats", `perk${style === 0 ? slot : 4 + slot}${suffix}`];

const OBJECTIVES = { baron: "Baron", dragon: "Dragon", inhibitor: "Inhibitor", riftHerald: "RiftHerald", tower: "Tower" };

const RULES = [
	// Game
	represented("match:info.gameCreation", "gameCreation"),
	represented("match:info.gameId", "gameId"),
	represented("match:info.gameMode", "gameMode"),
	represented("match:info.gameType", "gameType"),
	represented("match:info.gameVersion", "gameVersion"),
	represented("match:info.mapId", "mapId"),
	represented("match:info.platformId", "platformId"),
	represented("match:info.queueId", "queueId"),
	// Riot reported milliseconds before patch 11.20 and seconds since; the view is always seconds.
	represented("match:info.gameDuration", "gameDuration", (value, { root }) => {
		const [major, minor] = root.match.info.gameVersion.split(".").map(Number);
		return major * 100 + minor > 1119 ? value : Math.ceil(value / 1000);
	}),
	...omitted(["match:metadata.dataVersion"], "The view has no metadata; it reports its own format through version."),
	...omitted(["match:metadata.matchId"], "The view exposes platformId and gameId separately."),
	...omitted(["match:metadata.participants[]"], "Duplicates info.participants[].puuid, which participantIdentities carries."),
	...omitted(["match:info.endOfGameResult", "match:info.gameEndTimestamp"], "No match-v4 equivalent."),
	...omitted(["match:info.gameName", "match:info.gameStartTimestamp", "match:info.tournamentCode"],
		"Kept on the normalized store, which has no public getter for it."),

	// Teams
	represented("match:info.teams[].teamId", "teams[].teamId"),
	represented("match:info.teams[].win", "teams[].win", value => value ? "Win" : "Fail"),
	represented("match:info.teams[].bans.**", "teams[].bans.**"),
	represented("match:info.teams[].objectives.champion.first", "teams[].firstBlood"),
	...Object.entries(OBJECTIVES).flatMap(([objective, legacy]) => [
		represented(`match:info.teams[].objectives.${objective}.first`, `teams[].first${legacy}`),
		represented(`match:info.teams[].objectives.${objective}.kills`, `teams[].${legacy[0].toLowerCase()}${legacy.slice(1)}Kills`),
	]),
	...omitted(["match:info.teams[].objectives.champion.kills"], "match-v4 teams have no champion kill total; sum the participants' kills."),
	...omitted(["match:info.teams[].objectives.atakhan.**", "match:info.teams[].objectives.horde.**"],
		"Objectives added after match-v4 (Atakhan, Void Grubs); no legacy field."),
	...omitted(["match:info.teams[].feats.**"], "Feats of Strength, added after match-v4; no legacy field."),

	// Participants: identity
	represented(participant("participantId"), "participants[].participantId"),
	represented(participant("teamId"), "participants[].teamId"),
	represented(participant("championId"), "participants[].championId"),
	represented(participant("summoner1Id"), "participants[].spell1Id"),
	represented(participant("summoner2Id"), "participants[].spell2Id"),
	represented(participant("puuid"), "participantIdentities[].player.puuid"),
	represented(participant("summonerId"), "participantIdentities[].player.summonerId"),
	represented(participant("profileIcon"), "participantIdentities[].player.profileIcon"),
	represented(participant("riotIdGameName"), "participantIdentities[].player.riotIdGameName"),
	represented(participant("riotIdTagline"), "participantIdentities[].player.riotIdTagline"),
	// A Riot ID, when present, replaces the summoner name as the legacy display name.
	represented(participant("summonerName"), "participantIdentities[].player.summonerName", (value, { parent }) =>
		typeof parent.riotIdGameName === "string" && parent.riotIdGameName.length > 0
			? `${parent.riotIdGameName}#${parent.riotIdTagline}` : value),
	...omitted([participant("championName")], "Used only to resolve championId against Data Dragon data."),
	...omitted([participant("summonerLevel")], "No match-v4 equivalent."),
	...omitted([participant("riotIdName")],
		"Riot's early name for riotIdGameName (seen on patches 11.18-12.1), empty wherever it appears."),

	// Participants: statistics
	...SAME_NAME_STATS.map(name => represented(participant(name), `participants[].stats.${name}`)),
	represented(participant("magicDamageTaken"), "participants[].stats.magicalDamageTaken"),
	represented(participant("lane"), "participants[].timeline.lane"),
	represented(participant("role"), "participants[].timeline.role"),
	represented(participant("perks.styles[].selections[].perk"), captures => perkField(captures, "")),
	...[1, 2, 3].map(n => represented(participant(`perks.styles[].selections[].var${n}`), captures => perkField(captures, `Var${n}`))),
	represented(participant("perks.styles[].style"), ([player, style]) =>
		["participants", player, "stats", style === 0 ? "perkPrimaryStyle" : "perkSubStyle"]),
	...omitted([participant("perks.styles[].description")], "Always primaryStyle or subStyle, which the legacy field name already says."),
	...omitted([participant("perks.statPerks.**")], "Stat shards have no match-v4 field."),

	// Participants: Arena
	...["placement", "playerSubteamId", "subteamPlacement", ...[1, 2, 3, 4, 5, 6].map(n => `playerAugment${n}`)]
		.map(name => represented(participant(name), `participants[].${name}`)),

	represented(participant("totalAllyJungleMinionsKilled"), "participants[].stats.neutralMinionsKilledTeamJungle"),
	represented(participant("totalEnemyJungleMinionsKilled"), "participants[].stats.neutralMinionsKilledEnemyJungle"),

	// Participants: known gaps, where the view has a legacy field but leaves it empty, go
	// here as gap(source, legacyField). There are none at the moment.

	// Participants: deliberately omitted
	...omitted(["challenges.**", "missions.**", ...[...Array(12).keys()].map(n => `PlayerScore${n}`)].map(participant),
		"Challenge, mission and score counters added in match-v5. The view's playerScore0-9 are match-v4's and stay null."),
	...omitted(["allInPings", "assistMePings", "basicPings", "commandPings", "dangerPings", "enemyMissingPings",
		"enemyVisionPings", "getBackPings", "holdPings", "needVisionPings", "onMyWayPings", "pushPings",
		"retreatPings", "visionClearedPings"].map(participant), "Ping counts, added in match-v5; no legacy field."),
	...omitted(["PlayerBehavior.**", "wasAfk", "wasSevereTransgressor", "wasPremadeWithSevereTransgressor",
		"wasPremadeWithIGNBGameEndCauser", "causedGameEndFromIGNBSurrender", "gameEndedInIGNBSurrender",
		"teamIGNBSurrendered"].map(participant), "Behavior and moderation flags, added in match-v5; no legacy field."),
	...omitted([participant("selectedRolePreferences")],
		"The player's queue preferences, not where they played; stats.teamPosition covers that."),
	...omitted(["baronKills", "dragonKills", "damageDealtToBuildings", "damageDealtToEpicMonsters",
		"inhibitorTakedowns", "inhibitorsLost", "nexusKills", "nexusLost", "nexusTakedowns", "objectivesStolen",
		"objectivesStolenAssists", "turretTakedowns", "turretsLost"].map(participant),
		"Per-player objective counters added in match-v5; no legacy field."),
	...omitted(["champExperience", "championTransform", "consumablesPurchased", "itemsPurchased",
		"eligibleForProgression", "timePlayed", "bountyLevel"].map(participant),
		"Added in match-v5; no legacy field."),

	// Timeline
	represented("timeline:info.frameInterval", "frameInterval"),
	represented("timeline:info.frames[].timestamp", "frames[].timestamp"),
	represented("timeline:info.frames[].events.**", "frames[].events.**"),
	...["participantId", "currentGold", "totalGold", "level", "xp", "minionsKilled", "jungleMinionsKilled",
		"position.**", "damageStats.**", "championStats.**"]
		.map(name => represented(`timeline:info.frames[].participantFrames{}.${name}`, `frames[].participantFrames{}.${name}`)),
	// Practice Tool and empty custom games have frames without participant data.
	represented("timeline:info.frames[].participantFrames", "frames[].participantFrames", value => value ?? {}),
	...omitted(["timeline:info.frames[].participantFrames{}.goldPerSecond",
		"timeline:info.frames[].participantFrames{}.timeEnemySpentControlled"], "No match-v4 equivalent."),
	...omitted(["timeline:metadata.**", "timeline:info.gameId", "timeline:info.endOfGameResult"],
		"Describes the same game as the match, which the view already identifies."),
	...omitted(["timeline:info.participants[].**"], "Maps participantId to puuid, which participantIdentities already carries."),
];

function tokens(pattern) {
	const out = [];
	for (const part of pattern.split(".")) {
		const [, key, wildcards] = /^(.*?)((?:\[\]|\{\})*)$/.exec(part);
		if (key) out.push(key);
		out.push(...(wildcards.match(/\[\]|\{\}/g) || []));
	}
	return out;
}

function compile(rule) {
	const [document, rest] = rule.source.split(/:(.*)/s);
	const source = tokens(rest);
	const wildcards = pattern => pattern.filter(t => t === "[]" || t === "{}" || t === "**").length;
	if (source.slice(0, -1).includes("**")) throw new Error(`"**" must end a rule path: ${rule.source}`);
	const compiled = { ...rule, document, tokens: source, uses: 0 };
	if (typeof rule.view === "string") {
		compiled.viewTokens = tokens(rule.view);
		if (wildcards(compiled.viewTokens) !== wildcards(source)) throw new Error(`Wildcard count differs: ${rule.source} -> ${rule.view}`);
	}
	return compiled;
}

// Returns the values the source's wildcards matched, or null when the path does not match.
function matchPath(pattern, keys) {
	const captures = [];
	for (let i = 0; i < pattern.length; i++) {
		const token = pattern[i];
		if (token === "**") {
			captures.push(keys.slice(i));
			return captures;
		}
		if (i >= keys.length) return null;
		const key = keys[i];
		if (token === "[]") {
			if (typeof key !== "number") return null;
			captures.push(key);
		} else if (token === "{}") {
			if (typeof key !== "string") return null;
			captures.push(key);
		} else if (token !== key) return null;
	}
	return pattern.length === keys.length ? captures : null;
}

function fill(pattern, captures) {
	const keys = [];
	let next = 0;
	for (const token of pattern) {
		if (token === "**") keys.push(...captures[next++]);
		else if (token === "[]" || token === "{}") keys.push(captures[next++]);
		else keys.push(token);
	}
	return keys;
}

function read(root, keys) {
	let value = root;
	for (const key of keys) {
		if (value === null || value === undefined) return undefined;
		value = value[key];
	}
	return value;
}

function* leaves(value, keys = []) {
	if (value !== null && typeof value === "object") {
		const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
		if (entries.length === 0) yield [keys, value];
		for (const [key, item] of entries) yield* leaves(item, [...keys, key]);
	} else {
		yield [keys, value];
	}
}

// The path pattern a field is reported under: array indexes and participantFrames keys generalized.
function describe(document, keys) {
	let out = `${document}:`;
	keys.forEach((key, index) => {
		if (typeof key === "number") out += "[]";
		else if (keys[index - 1] === "participantFrames") out += "{}";
		else out += (index ? "." : "") + key;
	});
	return out;
}

function same(a, b) {
	if (a !== null && typeof a === "object") return JSON.stringify(a) === JSON.stringify(b);
	return Object.is(a, b);
}

function fixtures(args) {
	if (args.length) {
		if (args.length % 2) throw new Error("Pass match and timeline paths in pairs (use - for no timeline).");
		const pairs = [];
		for (let i = 0; i < args.length; i += 2) pairs.push({ match: args[i], timeline: args[i + 1] === "-" ? null : args[i + 1] });
		return pairs;
	}
	const root = path.join(__dirname, "../docs/example-data");
	return fs.readdirSync(path.join(root, "match")).sort().map(name => ({
		match: path.join(root, "match", name),
		timeline: fs.existsSync(path.join(root, "timeline", name)) ? path.join(root, "timeline", name) : null,
	}));
}

function main() {
	const rules = RULES.map(compile);
	const unaccounted = new Map();
	const mismatches = [];
	const gaps = new Map();
	const counts = { fixtures: 0, skipped: 0, checked: 0, patterns: new Set() };

	for (const pair of fixtures(process.argv.slice(2))) {
		const root = {
			match: JSON.parse(fs.readFileSync(pair.match, "utf8")),
			timeline: pair.timeline ? JSON.parse(fs.readFileSync(pair.timeline, "utf8")) : null,
		};
		if (!root.match.metadata) {
			counts.skipped++;
			continue;
		}
		counts.fixtures++;
		// Match resolves champion IDs in place, so it gets its own copy of the source.
		const view = new Match(structuredClone(root.match), root.timeline && structuredClone(root.timeline), true);
		const label = path.basename(pair.match);

		for (const document of ["match", "timeline"]) {
			if (!root[document]) continue;
			for (const [keys, value] of leaves(root[document])) {
				const pattern = describe(document, keys);
				counts.patterns.add(pattern);
				let rule, captures;
				for (const candidate of rules) {
					if (candidate.document !== document) continue;
					captures = matchPath(candidate.tokens, keys);
					if (captures) {
						rule = candidate;
						break;
					}
				}
				if (!rule) {
					if (!unaccounted.has(pattern)) unaccounted.set(pattern, { value, fixture: label });
					continue;
				}
				rule.uses++;
				if (rule.omit) continue;
				if (rule.gap) {
					gaps.set(pattern, rule.gap);
					continue;
				}
				const viewKeys = typeof rule.view === "function" ? rule.view(captures) : fill(rule.viewTokens, captures);
				const parent = read(root[document], keys.slice(0, -1));
				const expected = rule.expect ? rule.expect(value, { parent, root }) : value;
				const actual = read(view, viewKeys);
				counts.checked++;
				if (!same(expected, actual)) {
					mismatches.push({ fixture: label, source: `${document}:${keys.join(".")}`, view: viewKeys.join("."), expected, actual });
				}
			}
		}
	}

	console.log(`Legacy view coverage: ${counts.fixtures} match-v5 fixtures (${counts.skipped} match-v4 skipped), ` +
		`${counts.patterns.size} field paths, ${counts.checked} represented values compared`);
	if (gaps.size) {
		console.log(`\nKnown gaps, a legacy field exists but the view leaves it empty (${gaps.size}):`);
		for (const [pattern, legacy] of gaps) console.log(`  ${pattern} -> ${legacy}`);
	}
	const unused = rules.filter(rule => rule.uses === 0);
	if (unused.length) {
		console.log(`\nRules no fixture exercised (${unused.length}); fine when they cover data these fixtures lack:`);
		for (const rule of unused) console.log(`  ${rule.source}`);
	}
	if (unaccounted.size) {
		console.log(`\nUNACCOUNTED: match-v5 fields that are neither represented, omitted, nor a known gap (${unaccounted.size}):`);
		for (const [pattern, { value, fixture }] of unaccounted) console.log(`  ${pattern}  e.g. ${JSON.stringify(value)} in ${fixture}`);
	}
	if (mismatches.length) {
		console.log(`\nMISMATCHED: represented fields whose view value differs (${mismatches.length}, first 20):`);
		for (const m of mismatches.slice(0, 20)) {
			console.log(`  ${m.fixture} ${m.source} -> ${m.view}: expected ${JSON.stringify(m.expected)}, view has ${JSON.stringify(m.actual)}`);
		}
	}
	if (unaccounted.size || mismatches.length) {
		process.exitCode = 1;
		console.log("\nFAIL");
	} else {
		console.log("\nPASS every match-v5 field is represented, omitted on purpose, or a listed gap");
	}
}

main();
