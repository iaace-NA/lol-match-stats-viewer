"use strict";

/**
 * League of Legends Match Data Processor
 *
 * Handles conversion and normalization between Riot Games API v4 and v5 match data formats.
 * Provides a unified interface for accessing match and timeline data regardless of API version.
 *
 * Data Policy:
 * - If something is present in v5 but not in v4, create a method for it and reconstruct if possible
 * - If something is present in v4 but not in v5, omit it from unified interface
 * - Use the data structure that makes the most sense, defaulting to v5 structure
 * - Store internally using v5 format, access using v4-compatible format for legacy support
 *
 * @author iaace LLC
 * @version 2.0.0
 * @license AGPL-3.0
 * @class Match
 * @author iaace
 * @version 2.0.0
 */
class Match {
	/**
	 * Creates a new Match instance from Riot API match data
	 *
	 * @param {Object} MATCH_CHAMPIONS - Champion data from Data Dragon API for champion ID resolution
	 * @param {Object|string} matchData - Raw match data (JSON object or string)
	 * @param {Object|string|null} timelineData - Raw timeline data (JSON object, string, or null)
	 * @param {boolean} isJsonObject - Whether the input data is already parsed JSON (true) or string (false)
	 *
	 * @example
	 * // Using pre-parsed JSON objects
	 * const match = new Match(championData, matchJson, timelineJson, true);
	 *
	 * @example
	 * // Using JSON strings
	 * const match = new Match(championData, matchString, timelineString, false);
	 */
	constructor(MATCH_CHAMPIONS, matchData, timelineData = null, isJsonObject = false) {
		/**
		 * Finds and resolves champion ID from champion data
		 *
		 * @private
		 * @param {number|string} id - Champion ID to look up
		 * @param {string} name - Champion name for fallback lookup
		 * @returns {number} Resolved champion ID
		 */
		function matchFindChampion(id, name) {
			if (!MATCH_CHAMPIONS) return id;

			// First try direct ID match
			for (const championKey in MATCH_CHAMPIONS.data) {
				if (id == MATCH_CHAMPIONS.data[championKey].key) {
					return id;
				}
			}

			// Fallback to name-based lookup
			for (const championKey in MATCH_CHAMPIONS.data) {
				if (name && name.toLowerCase() === championKey.toLowerCase()) {
					return parseInt(MATCH_CHAMPIONS.data[championKey].key);
				}
			}

			return id;
		}

		// Initialize validation flags
		/** @private {boolean} */
		this.m_valid = false;
		/** @private {boolean} */
		this.mt_valid = false;

		// Parse input data based on format
		if (!isJsonObject) {
			try {
				this.m_raw = JSON.parse(matchData);
				this.m_valid = true;
			} catch (error) {
				console.error('Failed to parse match data:', error);
			}

			try {
				if (timelineData !== null) {
					this.mt_raw = JSON.parse(timelineData);
					this.mt_valid = true;
				}
			} catch (error) {
				console.error('Failed to parse timeline data:', error);
			}
		} else {
			this.m_raw = matchData;
			this.mt_raw = timelineData;

			if (matchData) {
				this.m_valid = true;
			}
			if (timelineData) {
				this.mt_valid = true;
			}
			// TODO: Add data validation for JSON objects
		}

		// Determine API version from data structure
		/** @private {number|null} */
		this.data_version = null;

		if (this.m_raw?.metadata) {
			this.data_version = 5;
		} else if (this.m_raw) {
			this.data_version = 4;
		}

		// Initialize normalized data containers
		/** @private {Object} */
		this.m = {
			teams: [],
			participants: [],
		};
		/** @private {Object} */
		this.mt = {};

		// Process match data based on API version
		if (this.version === 4 && this.mValid) {
			this._processV4MatchData(matchFindChampion);
		} else if (this.version === 5 && this.mValid) {
			this._processV5MatchData(matchFindChampion);
		}

		// Process timeline data based on API version
		if (this.version === 4 && this.mtValid) {
			this._processV4TimelineData();
		} else if (this.version === 5 && this.mtValid) {
			this._processV5TimelineData();
		}

		// Clean up raw data to save memory
		delete this.m_raw;
		delete this.mt_raw;

		// Validate essential game data
		if (this.gameVersion === undefined || this.gameVersion === null) {
			this.m_valid = false;
			return this;
		}

		// Initialize cache for computed values
		/** @private {Object} */
		this.cache = {};
		this._initializeCache();
		this._buildLegacyCache();
	}
	get mValid() {
		return this.m_valid;
	}
	get mtValid() {
		return this.mt_valid;
	}
	get version() {
		return this.data_version;
	}
	get gameCreation() {
		return this.m.gameCreation;
	}
	get gameDuration() {
		//returns seconds
		return this.cache.gameDuration;
	}
	get queueId() {
		return this.m.queueId;
	}
	get mapId() {
		return this.m.mapId;
	}
	get seasonId() {
		return this.m.seasonId;
	}
	get gameId() {
		return this.m.gameId;
	}
	get gameVersion() {
		return this.m.gameVersion;
	}
	get gameMode() {
		return this.m.gameMode;
	}
	get gameType() {
		return this.m.gameType;
	}
	get platformId() {
		return this.m.platformId;
	}
	get teams() {
		return this.cache.teams;
	}
	get participants() {
		return this.cache.participants;
	}
	get participantIdentities() {
		return this.cache.participantIdentities;
	}
	get frames() {
		return this.cache.frames;
	}
	get frameInterval() {
		return this.mt.info.frameInterval;
	}
	/**
	 * Processes Riot API v4 match data into normalized format
	 * @private
	 * @param {Function} matchFindChampion - Champion resolution function
	 */
	_processV4MatchData(matchFindChampion) {
		// Basic metadata
		this.m.gameId = this.m_raw.gameId;
		this.m.platformId = this.m_raw.platformId;
		this.m.gameCreation = this.m_raw.gameCreation;
		this.m.gameDuration = this.m_raw.gameDuration;
		this.m.queueId = this.m_raw.queueId;
		this.m.mapId = this.m_raw.mapId;
		this.m.seasonId = this.m_raw.seasonId;
		this.m.gameVersion = this.m_raw.gameVersion;
		this.m.gameMode = this.m_raw.gameMode;
		this.m.gameType = this.m_raw.gameType;

		// V4-specific fields (null in v5)
		this.m.gameName = null;
		this.m.gameStartTimestamp = this.m_raw.gameCreation;
		this.m.tournamentCode = null;

		// Process teams with objective data normalization
		for (const team of this.m_raw.teams) {
			const teamKills = this.m_raw.participants
				.filter(p => p.teamId === team.teamId && p.stats)
				.reduce((sum, p) => sum + p.stats.kills, 0);

			this.m.teams.push({
				teamId: team.teamId,
				win: team.win === "Win",
				bans: team.bans,
				objectives: {
					baron: {
						first: team.firstBaron,
						kills: team.baronKills
					},
					champion: {
						first: team.firstBlood,
						kills: teamKills
					},
					dragon: {
						first: team.firstDragon,
						kills: team.dragonKills
					},
					inhibitor: {
						first: team.firstInhibitor,
						kills: team.inhibitorKills
					},
					riftHerald: {
						first: team.firstRiftHerald,
						kills: team.riftHeraldKills
					},
					tower: {
						first: team.firstTower,
						kills: team.towerKills
					},
				}
			});
		}

		// Process participants with comprehensive stat mapping
		for (const participant of this.m_raw.participants) {
			const participantIdentity = this.m_raw.participantIdentities
				.find(pi => pi.participantId === participant.participantId);

			this.m.participants.push({
				assists: participant.stats.assists,
				baronKills: null,
				bountyLevel: null,
				champExperience: null,
				champLevel: participant.stats.champLevel,
				championId: participant.championId,
				championName: null,
				championTransform: null,
				consumablesPurchased: null,
				damageDealtToBuildings: null,
				damageDealtToObjectives: participant.stats.damageDealtToObjectives,
				damageDealtToTurrets: participant.stats.damageDealtToTurrets,
				damageSelfMitigated: participant.stats.damageSelfMitigated,
				deaths: participant.stats.deaths,
				detectorWardPlaced: null,
				doubleKills: participant.stats.doubleKills,
				dragonKills: null,
				firstBloodAssist: participant.stats.firstBloodAssist,
				firstBloodKill: participant.stats.firstBloodKill,
				firstTowerAssist: participant.stats.firstTowerAssist,
				firstTowerKill: participant.stats.firstTowerKill,
				gameEndedInEarlySurrender: null,
				gameEndedInSurrender: null,
				goldEarned: participant.stats.goldEarned,
				goldSpent: participant.stats.goldSpent,
				individualPosition: participant.stats.lane,
				inhibitorKills: participant.stats.inhibitorKills,
				inhibitorTakedowns: null,
				inhibitorsLost: null,
				item0: participant.stats.item0,
				item1: participant.stats.item1,
				item2: participant.stats.item2,
				item3: participant.stats.item3,
				item4: participant.stats.item4,
				item5: participant.stats.item5,
				item6: participant.stats.item6,
				itemsPurchased: null,
				killingSprees: participant.stats.killingSprees,
				kills: participant.stats.kills,
				lane: participant.timeline.lane,
				largestCriticalStrike: participant.stats.largestCriticalStrike,
				largestKillingSpree: participant.stats.largestKillingSpree,
				largestMultiKill: participant.stats.largestMultiKill,
				longestTimeSpentLiving: participant.stats.longestTimeSpentLiving,
				magicDamageDealt: participant.stats.magicDamageDealt,
				magicDamageDealtToChampions: participant.stats.magicDamageDealtToChampions,
				magicDamageTaken: participant.stats.magicalDamageTaken,
				neutralMinionsKilled: participant.stats.neutralMinionsKilled,
				nexusKills: null,
				nexusLost: null,
				nexusTakedowns: null,
				objectivesStolen: null,
				objectivesStolenAssists: null,
				participantId: participant.participantId,
				pentaKills: participant.stats.pentaKills,
				perks: this._buildPerksFromV4(participant.stats),
				physicalDamageDealt: participant.stats.physicalDamageDealt,
				physicalDamageDealtToChampions: participant.stats.physicalDamageDealtToChampions,
				physicalDamageTaken: participant.stats.physicalDamageTaken,
				profileIcon: participantIdentity?.player.profileIcon,
				puuid: null,
				quadraKills: participant.stats.quadraKills,
				riotIdName: null,
				riotIdGameName: null,
				riotIdTagline: null,
				role: participant.timeline.role,
				sightWardsBoughtInGame: participant.stats.sightWardsBoughtInGame,
				spell1Casts: 0,
				spell2Casts: 0,
				spell3Casts: 0,
				spell4Casts: 0,
				summoner1Casts: 0,
				summoner1Id: participant.spell1Id,
				summoner2Casts: 0,
				summoner2Id: participant.spell2Id,
				summonerId: participantIdentity?.player.summonerId,
				summonerLevel: null,
				summonerName: participantIdentity?.player.summonerName,
				teamEarlySurrendered: null,
				teamId: participant.teamId,
				teamPosition: participant.stats.lane,
				timeCCingOthers: participant.stats.timeCCingOthers,
				timePlayed: null,
				totalDamageDealt: participant.stats.totalDamageDealt,
				totalDamageDealtToChampions: participant.stats.totalDamageDealtToChampions,
				totalDamageShieldedOnTeammates: null,
				totalDamageTaken: participant.stats.totalDamageTaken,
				totalHeal: participant.stats.totalHeal,
				totalHealsOnTeammates: null,
				totalMinionsKilled: participant.stats.totalMinionsKilled,
				totalTimeCCDealt: participant.stats.totalTimeCrowdControlDealt,
				totalUnitsHealed: participant.stats.totalUnitsHealed,
				tripleKills: participant.stats.tripleKills,
				trueDamageDealt: participant.stats.trueDamageDealt,
				trueDamageDealtToChampions: participant.stats.trueDamageDealtToChampions,
				trueDamageTaken: participant.stats.trueDamageTaken,
				turretKills: participant.stats.turretKills,
				turretTakedowns: null,
				turretsLost: null,
				unrealKills: participant.stats.unrealKills,
				visionScore: participant.stats.visionScore,
				visionWardsBoughtInGame: participant.stats.visionWardsBoughtInGame,
				wardsKilled: participant.stats.wardsKilled,
				wardsPlaced: participant.stats.wardsPlaced,
				win: participant.stats.win
			});
		}
	}

	/**
	 * Processes Riot API v5 match data into normalized format
	 * @private
	 * @param {Function} matchFindChampion - Champion resolution function
	 */
	_processV5MatchData(matchFindChampion) {
		const info = this.m_raw.info;

		// Basic metadata
		this.m.gameId = info.gameId;
		this.m.platformId = info.platformId;
		this.m.gameCreation = info.gameCreation;
		this.m.gameDuration = info.gameDuration;
		this.m.queueId = info.queueId;
		this.m.seasonId = null; // Not available in v5
		this.m.gameVersion = info.gameVersion;
		this.m.mapId = info.mapId;
		this.m.gameMode = info.gameMode;
		this.m.gameType = info.gameType;

		// V5-specific fields
		this.m.gameName = info.gameName;
		this.m.gameStartTimestamp = info.gameStartTimestamp;
		this.m.tournamentCode = info.tournamentCode;

		// Teams - direct copy as v5 structure is already normalized
		for (const team of info.teams) {
			this.m.teams.push(team);
		}

		// Participants with champion ID resolution
		for (const participant of info.participants) {
			try {
				participant.championId = matchFindChampion(participant.championId, participant.championName);
			} catch (error) {
				console.error('Error resolving champion ID:', error);
			}
			this.m.participants.push(participant);
		}
	}

	/**
	 * Processes Riot API v4 timeline data into normalized format
	 * @private
	 */
	_processV4TimelineData() {
		this.mt.metadata = {
			dataVersion: "2",
			matchId: `${this.m.platformId}_${this.m.gameId}`,
			participants: this.m.participants.map(p => p.puuid),
		};

		this.mt.info = {
			frameInterval: this.mt_raw.frameInterval,
			frames: this.mt_raw.frames.map(frame => {
				const normalizedFrame = {
					events: frame.events,
					participantFrames: {},
					timestamp: frame.timestamp,
				};

				for (const [participantId, frameData] of Object.entries(frame.participantFrames)) {
					normalizedFrame.participantFrames[participantId] = {
						championStats: this._createEmptyChampionStats(),
						currentGold: frameData.currentGold,
						damageStats: this._createEmptyDamageStats(),
						goldPerSecond: null,
						jungleMinionsKilled: frameData.jungleMinionsKilled,
						level: frameData.level,
						minionsKilled: frameData.minionsKilled,
						participantId: parseInt(participantId),
						position: frameData.position,
						timeEnemySpentControlled: null,
						totalGold: frameData.totalGold,
						xp: frameData.xp,
					};
				}

				return normalizedFrame;
			}),
			gameId: this.m.gameId,
			participants: this.m.participants.map(p => ({
				participantId: p.participantId,
				puuid: p.puuid,
			})),
		};
	}

	/**
	 * Processes Riot API v5 timeline data (direct copy)
	 * @private
	 */
	_processV5TimelineData() {
		this.mt.metadata = this.mt_raw.metadata;
		this.mt.info = this.mt_raw.info;
	}

	/**
	 * Builds perks object from v4 stats format
	 * @private
	 * @param {Object} stats - v4 participant stats
	 * @returns {Object} Normalized perks object
	 */
	_buildPerksFromV4(stats) {
		return {
			statPerks: {
				defense: null,
				flex: null,
				offensive: null
			},
			styles: [
				{
					description: "primaryStyle",
					selections: [
						{
							perk: stats.perk0,
							var1: stats.perk0Var1,
							var2: stats.perk0Var2,
							var3: stats.perk0Var3
						},
						{
							perk: stats.perk1,
							var1: stats.perk1Var1,
							var2: stats.perk1Var2,
							var3: stats.perk1Var3
						},
						{
							perk: stats.perk2,
							var1: stats.perk2Var1,
							var2: stats.perk2Var2,
							var3: stats.perk2Var3
						},
						{
							perk: stats.perk3,
							var1: stats.perk3Var1,
							var2: stats.perk3Var2,
							var3: stats.perk3Var3
						}
					],
					style: stats.perkPrimaryStyle
				},
				{
					description: "subStyle",
					selections: [
						{
							perk: stats.perk4,
							var1: stats.perk4Var1,
							var2: stats.perk4Var2,
							var3: stats.perk4Var3
						},
						{
							perk: stats.perk5,
							var1: stats.perk5Var1,
							var2: stats.perk5Var2,
							var3: stats.perk5Var3
						}
					],
					style: stats.perkSubStyle
				}
			]
		};
	}

	/**
	 * Creates empty champion stats object for v4 timeline normalization
	 * @private
	 * @returns {Object} Empty champion stats structure
	 */
	_createEmptyChampionStats() {
		return {
			abilityHaste: null,
			abilityPower: null,
			armor: null,
			armorPen: null,
			armorPenPercent: null,
			attackDamage: null,
			attackSpeed: null,
			bonusArmorPenPercent: null,
			bonusMagicPenPercent: null,
			ccReduction: null,
			cooldownReduction: null,
			health: null,
			healthMax: null,
			healthRegen: null,
			lifesteal: null,
			magicPen: null,
			magicPenPercent: null,
			magicResist: null,
			movementSpeed: null,
			omnivamp: null,
			physicalVamp: null,
			power: null,
			powerMax: null,
			powerRegen: null,
			spellVamp: null
		};
	}

	/**
	 * Creates empty damage stats object for v4 timeline normalization
	 * @private
	 * @returns {Object} Empty damage stats structure
	 */
	_createEmptyDamageStats() {
		return {
			magicDamageDone: null,
			magicDamageDoneToChampions: null,
			magicDamageTaken: null,
			physicalDamageDone: null,
			physicalDamageDoneToChampions: null,
			physicalDamageTaken: null,
			totalDamageDone: null,
			totalDamageDoneToChampions: null,
			totalDamageTaken: null,
			trueDamageDone: null,
			trueDamageDoneToChampions: null,
			trueDamageTaken: null
		};
	}

	/**
	 * Initializes cache with computed values
	 * @private
	 */
	_initializeCache() {
		// Calculate correct game duration based on API version and patch
		if (this.version === 4) {
			this.cache.gameDuration = this.m.gameDuration;
		} else {
			const gameVersion = this.gameVersion;
			const firstDotIndex = gameVersion.indexOf(".");
			const patch = (parseInt(gameVersion.substring(0, firstDotIndex)) * 100) +
				parseInt(gameVersion.substring(firstDotIndex + 1, gameVersion.indexOf(".", firstDotIndex + 1)));

			// Patch 11.20+ uses seconds, earlier patches use milliseconds
			this.cache.gameDuration = patch > 1119 ? this.m.gameDuration : Math.ceil(this.m.gameDuration / 1000);
		}
	}

	/**
	 * Builds legacy-compatible cache structures for backward compatibility
	 * @private
	 */
	_buildLegacyCache() {
		// Legacy teams format
		this.cache.teams = this.m.teams.map(team => ({
			bans: team.bans,
			win: team.win ? "Win" : "Fail",
			teamId: team.teamId,
			firstBlood: team.objectives.champion.first,
			firstTower: team.objectives.tower.first,
			firstInhibitor: team.objectives.inhibitor.first,
			firstBaron: team.objectives.baron.first,
			firstDragon: team.objectives.dragon.first,
			firstRiftHerald: team.objectives.riftHerald.first,
			towerKills: team.objectives.tower.kills,
			inhibitorKills: team.objectives.inhibitor.kills,
			baronKills: team.objectives.baron.kills,
			dragonKills: team.objectives.dragon.kills,
			riftHeraldKills: team.objectives.riftHerald.kills,
			vilemawKills: 0,
			dominionVictoryScore: 0,
		}));

		// Legacy participants format
		this.cache.participants = this.m.participants.map(participant => ({
			participantId: participant.participantId,
			teamId: participant.teamId,
			championId: participant.championId,
			spell1Id: participant.summoner1Id,
			spell2Id: participant.summoner2Id,
			highestAchievedSeasonTier: null,
			// Arena-specific fields (directly on participant for Arena matches)
			placement: participant.placement,
			playerSubteamId: participant.playerSubteamId,
			playerAugment1: participant.playerAugment1,
			playerAugment2: participant.playerAugment2,
			playerAugment3: participant.playerAugment3,
			playerAugment4: participant.playerAugment4,
			playerAugment5: participant.playerAugment5,
			playerAugment6: participant.playerAugment6,
			subteamPlacement: participant.subteamPlacement,
			stats: this._buildLegacyStats(participant),
			timeline: {
				participantId: participant.participantId,
				role: participant.role,
				lane: participant.lane,
			},
			role: participant.role
		}));

		// Legacy participant identities format
		this.cache.participantIdentities = this.m.participants.map(participant => {
			const hasRiotId = typeof participant.riotIdGameName === "string" && participant.riotIdGameName.length > 0;

			return {
				participantId: participant.participantId,
				player: {
					platformId: this.m.platformId,
					accountId: null,
					summonerName: hasRiotId ? `${participant.riotIdGameName}#${participant.riotIdTagline}` : participant.summonerName,
					summonerId: participant.summonerId,
					currentPlatformId: this.m.platformId,
					currentAccountId: null,
					matchHistoryUri: null,
					profileIcon: participant.profileIcon,
					riotIdGameName: participant.riotIdGameName,
					riotIdTagline: participant.riotIdTagline,
					puuid: participant.puuid
				}
			};
		});

		// Legacy timeline frames format
		if (this.mtValid) {
			this.cache.frames = this.mt.info.frames.map(frame => {
				const legacyFrame = {
					participantFrames: {},
					events: frame.events,
					timestamp: frame.timestamp,
				};

				for (const [participantId, frameData] of Object.entries(frame.participantFrames)) {
					legacyFrame.participantFrames[participantId] = {
						participantId: parseInt(participantId),
						position: frameData.position,
						currentGold: frameData.currentGold,
						totalGold: frameData.totalGold,
						level: frameData.level,
						xp: frameData.xp,
						minionsKilled: frameData.minionsKilled,
						jungleMinionsKilled: frameData.jungleMinionsKilled,
						dominionScore: null,
						teamScore: null,
					};
				}

				return legacyFrame;
			});
		} else {
			this.cache.frames = null;
		}
	}

	/**
	 * Builds legacy stats format from normalized participant data
	 * @private
	 * @param {Object} participant - Normalized participant data
	 * @returns {Object} Legacy stats format
	 */
	_buildLegacyStats(participant) {
		return {
			participantId: participant.participantId,
			win: participant.win,
			item0: participant.item0,
			item1: participant.item1,
			item2: participant.item2,
			item3: participant.item3,
			item4: participant.item4,
			item5: participant.item5,
			item6: participant.item6,
			kills: participant.kills,
			deaths: participant.deaths,
			assists: participant.assists,
			largestKillingSpree: participant.largestKillingSpree,
			largestMultiKill: participant.largestMultiKill,
			killingSprees: participant.killingSprees,
			longestTimeSpentLiving: participant.longestTimeSpentLiving,
			doubleKills: participant.doubleKills,
			tripleKills: participant.tripleKills,
			quadraKills: participant.quadraKills,
			pentaKills: participant.pentaKills,
			unrealKills: participant.unrealKills,
			totalDamageDealt: participant.totalDamageDealt,
			magicDamageDealt: participant.magicDamageDealt,
			physicalDamageDealt: participant.physicalDamageDealt,
			trueDamageDealt: participant.trueDamageDealt,
			largestCriticalStrike: participant.largestCriticalStrike,
			totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
			magicDamageDealtToChampions: participant.magicDamageDealtToChampions,
			physicalDamageDealtToChampions: participant.physicalDamageDealtToChampions,
			trueDamageDealtToChampions: participant.trueDamageDealtToChampions,
			totalHeal: participant.totalHeal,
			totalUnitsHealed: participant.totalUnitsHealed,
			damageSelfMitigated: participant.damageSelfMitigated,
			damageDealtToObjectives: participant.damageDealtToObjectives,
			damageDealtToTurrets: participant.damageDealtToTurrets,
			visionScore: participant.visionScore,
			timeCCingOthers: participant.timeCCingOthers,
			totalDamageTaken: participant.totalDamageTaken,
			magicalDamageTaken: participant.magicDamageTaken,
			physicalDamageTaken: participant.physicalDamageTaken,
			trueDamageTaken: participant.trueDamageTaken,
			goldEarned: participant.goldEarned,
			goldSpent: participant.goldSpent,
			turretKills: participant.turretKills,
			inhibitorKills: participant.inhibitorKills,
			totalMinionsKilled: participant.totalMinionsKilled,
			neutralMinionsKilled: participant.neutralMinionsKilled,
			neutralMinionsKilledTeamJungle: null,
			neutralMinionsKilledEnemyJungle: null,
			totalTimeCCDealt: participant.totalTimeCCDealt,
			champLevel: participant.champLevel,
			visionWardsBoughtInGame: participant.visionWardsBoughtInGame,
			sightWardsBoughtInGame: participant.sightWardsBoughtInGame,
			wardsPlaced: participant.wardsPlaced,
			wardsKilled: participant.wardsKilled,
			firstBloodKill: participant.firstBloodKill,
			firstBloodAssist: participant.firstBloodAssist,
			firstTowerKill: participant.firstTowerKill,
			firstTowerAssist: participant.firstTowerAssist,
			firstInhibitorKill: null,
			firstInhibitorAssist: null,
			combatPlayerScore: null,
			objectivePlayerScore: null,
			totalPlayerScore: null,
			totalScoreRank: null,
			playerScore0: null,
			playerScore1: null,
			playerScore2: null,
			playerScore3: null,
			playerScore4: null,
			playerScore5: null,
			playerScore6: null,
			playerScore7: null,
			playerScore8: null,
			playerScore9: null,
			perk0: participant.perks.styles[0].selections[0].perk,
			perk0Var1: participant.perks.styles[0].selections[0].var1,
			perk0Var2: participant.perks.styles[0].selections[0].var2,
			perk0Var3: participant.perks.styles[0].selections[0].var3,
			perk1: participant.perks.styles[0].selections[1].perk,
			perk1Var1: participant.perks.styles[0].selections[1].var1,
			perk1Var2: participant.perks.styles[0].selections[1].var2,
			perk1Var3: participant.perks.styles[0].selections[1].var3,
			perk2: participant.perks.styles[0].selections[2].perk,
			perk2Var1: participant.perks.styles[0].selections[2].var1,
			perk2Var2: participant.perks.styles[0].selections[2].var2,
			perk2Var3: participant.perks.styles[0].selections[2].var3,
			perk3: participant.perks.styles[0].selections[3].perk,
			perk3Var1: participant.perks.styles[0].selections[3].var1,
			perk3Var2: participant.perks.styles[0].selections[3].var2,
			perk3Var3: participant.perks.styles[0].selections[3].var3,
			perk4: participant.perks.styles[1].selections[0].perk,
			perk4Var1: participant.perks.styles[1].selections[0].var1,
			perk4Var2: participant.perks.styles[1].selections[0].var2,
			perk4Var3: participant.perks.styles[1].selections[0].var3,
			perk5: participant.perks.styles[1].selections[1].perk,
			perk5Var1: participant.perks.styles[1].selections[1].var1,
			perk5Var2: participant.perks.styles[1].selections[1].var2,
			perk5Var3: participant.perks.styles[1].selections[1].var3,
			perkPrimaryStyle: participant.perks.styles[0].style,
			perkSubStyle: participant.perks.styles[1].style,
			// V5 additions
			spell1Casts: participant.spell1Casts,
			spell2Casts: participant.spell2Casts,
			spell3Casts: participant.spell3Casts,
			spell4Casts: participant.spell4Casts,
			summoner1Casts: participant.summoner1Casts,
			summoner2Casts: participant.summoner2Casts,
			totalDamageShieldedOnTeammates: participant.totalDamageShieldedOnTeammates,
			totalHealsOnTeammates: participant.totalHealsOnTeammates,
			// Arena-specific fields
			placement: participant.placement,
			playerSubteamId: participant.playerSubteamId,
			subteamPlacement: participant.subteamPlacement,
		};
	}

	/**
	 * Public getter methods providing access to match data
	 */

	/**
	 * Indicates whether match data is valid and successfully parsed
	 * @returns {boolean} True if match data is valid
	 */
	get mValid() {
		return this.m_valid;
	}

	/**
	 * Indicates whether timeline data is valid and successfully parsed
	 * @returns {boolean} True if timeline data is valid
	 */
	get mtValid() {
		return this.mt_valid;
	}

	/**
	 * Returns the detected API version of the match data
	 * @returns {number|null} API version (4 or 5), or null if undetermined
	 */
	get version() {
		return this.data_version;
	}

	/**
	 * Returns the match creation timestamp
	 * @returns {number} Unix timestamp in milliseconds
	 */
	get gameCreation() {
		return this.m.gameCreation;
	}

	/**
	 * Returns the normalized game duration in seconds
	 * Handles conversion between v4/v5 formats and different patches
	 * @returns {number} Game duration in seconds
	 */
	get gameDuration() {
		return this.cache.gameDuration;
	}

	/**
	 * Returns the queue ID for the match
	 * @returns {number} Queue identifier
	 */
	get queueId() {
		return this.m.queueId;
	}

	/**
	 * Returns the map ID where the match was played
	 * @returns {number} Map identifier
	 */
	get mapId() {
		return this.m.mapId;
	}

	/**
	 * Returns the season ID (v4 only, null for v5)
	 * @returns {number|null} Season identifier or null
	 */
	get seasonId() {
		return this.m.seasonId;
	}

	/**
	 * Returns the unique game ID
	 * @returns {number} Game identifier
	 */
	get gameId() {
		return this.m.gameId;
	}

	/**
	 * Returns the game version/patch
	 * @returns {string} Game version string (e.g., "13.1.1")
	 */
	get gameVersion() {
		return this.m.gameVersion;
	}

	/**
	 * Returns the game mode
	 * @returns {string} Game mode (e.g., "CLASSIC")
	 */
	get gameMode() {
		return this.m.gameMode;
	}

	/**
	 * Returns the game type
	 * @returns {string} Game type (e.g., "MATCHED_GAME")
	 */
	get gameType() {
		return this.m.gameType;
	}

	/**
	 * Returns the platform/region identifier
	 * @returns {string} Platform ID (e.g., "NA1", "EUW1")
	 */
	get platformId() {
		return this.m.platformId;
	}

	/**
	 * Returns team data in legacy format for backward compatibility
	 * @returns {Array} Array of team objects with objectives and stats
	 */
	get teams() {
		return this.cache.teams;
	}

	/**
	 * Returns participant data in legacy format for backward compatibility
	 * @returns {Array} Array of participant objects with stats and timeline data
	 */
	get participants() {
		return this.cache.participants;
	}

	/**
	 * Returns participant identity data in legacy format
	 * @returns {Array} Array of participant identity objects with player info
	 */
	get participantIdentities() {
		return this.cache.participantIdentities;
	}

	/**
	 * Returns timeline frame data if available
	 * @returns {Array|null} Array of timeline frames or null if not available
	 */
	get frames() {
		return this.cache.frames;
	}

	/**
	 * Returns the frame interval for timeline data
	 * @returns {number|undefined} Frame interval in milliseconds
	 */
	get frameInterval() {
		return this.mt?.info?.frameInterval;
	}
}