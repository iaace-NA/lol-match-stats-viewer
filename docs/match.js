"use strict";
class Match {
	/*
	Data policy:
	- If something is present in v5 but not in v4, make a method for it and see if it can be reconstructed. If something is present in v4 but not in v5, omit it.
	- Try to use the data structure that makes the most sense. Otherwise, use the v5 structure.
	- store in v5
	- access in v4
	*/
	constructor(MATCH_CHAMPIONS, m, mt = null, json = false) {
		function matchFindChampion(id, name) {
			for (let b in MATCH_CHAMPIONS.data) {
				if (id == MATCH_CHAMPIONS.data[b].key) {
					return id;
				}
			}
			for (let b in MATCH_CHAMPIONS.data) {
				if (name.toLowerCase() == b.toLowerCase()) {
					return parseInt(MATCH_CHAMPIONS.data[b].key);
				}
			}
			return id;
		}
		//expect strings for both unless json == true
		this.m_valid = false;
		this.mt_valid = false;
		if (!json) {
			try {
				this.m_raw = JSON.parse(m);
				this.m_valid = true;
			}
			catch (e) {
			}
			try {
				if (mt !== null) {
					this.mt_raw = JSON.parse(mt);
					this.mt_valid = true;
				}
			}
			catch (e) {
			}
		}
		else {
			this.m_raw = m;
			this.mt_raw = mt;
			if (m) {
				this.m_valid = true;
			}
			if (mt) {
				this.mt_valid = true;
			}
			//TODO: some validations?
		}
		this.data_version = null;
		if (this.m_raw.metadata) {
			this.data_version = 5;
		}
		else {
			this.data_version = 4;
		}
		this.m = {
			teams: [],
			participants: [],
		};
		this.mt = {};
		if (this.version === 4 && this.mValid) {
			//basic metadata
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

			//differences
			this.m.gameName = null;
			this.m.gameStartTimestamp = this.m_raw.gameCreation;
			this.m.tournamentCode = null;

			//teams
			for (let team of this.m_raw.teams) {
				let team_kills = 0;
				for (let c in this.m_raw.participants) {
					if (this.m_raw.participants[c].teamId == team.teamId) {
						team_kills += this.m_raw.participants[c].stats.kills;
					}
				}
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
							kills: team_kills//tbd
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

			//participants
			for (let participant of this.m_raw.participants) {
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
					perks: {
						statPerks: {
							defense: null,
							flex: null,
							offensive: null
						},
						styles: [
							{
								description: "primaryStyle",
								selections: [{
									perk: participant.stats.perk0,
									var1: participant.stats.perk0Var1,
									var2: participant.stats.perk0Var2,
									var3: participant.stats.perk0Var3
								},
								{
									perk: participant.stats.perk1,
									var1: participant.stats.perk1Var1,
									var2: participant.stats.perk1Var2,
									var3: participant.stats.perk1Var3
								},
								{
									perk: participant.stats.perk2,
									var1: participant.stats.perk2Var1,
									var2: participant.stats.perk2Var2,
									var3: participant.stats.perk2Var3
								},
								{
									perk: participant.stats.perk3,
									var1: participant.stats.perk3Var1,
									var2: participant.stats.perk3Var2,
									var3: participant.stats.perk3Var3
								}],
								style: participant.stats.perkPrimaryStyle
							},
							{
								description: "subStyle",
								selections: [{
									perk: participant.stats.perk4,
									var1: participant.stats.perk4Var1,
									var2: participant.stats.perk4Var2,
									var3: participant.stats.perk4Var3
								},
								{
									perk: participant.stats.perk5,
									var1: participant.stats.perk5Var1,
									var2: participant.stats.perk5Var2,
									var3: participant.stats.perk5Var3
								}],
								style: participant.stats.perkSubStyle
							}
						]
					},
					physicalDamageDealt: participant.stats.physicalDamageDealt,
					physicalDamageDealtToChampions: participant.stats.physicalDamageDealtToChampions,
					physicalDamageTaken: participant.stats.physicalDamageTaken,
					profileIcon: this.m_raw.participantIdentities.find(x => x.participantId == participant.participantId).player.profileIcon,
					puuid: null,
					quadraKills: participant.stats.quadraKills,
					riotIdName: null,
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
					summonerId: this.m_raw.participantIdentities.find(x => x.participantId == participant.participantId).player.summonerId,
					summonerLevel: null,
					summonerName: this.m_raw.participantIdentities.find(x => x.participantId == participant.participantId).player.summonerName,
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
		else if (this.version === 5 && this.mValid) {
			this.m.gameId = this.m_raw.info.gameId;
			this.m.platformId = this.m_raw.info.platformId;
			this.m.gameCreation = this.m_raw.info.gameCreation;
			this.m.gameDuration = this.m_raw.info.gameDuration;
			this.m.queueId = this.m_raw.info.queueId;
			this.m.seasonId = null;
			this.m.gameVersion = this.m_raw.info.gameVersion;
			this.m.mapId = this.m_raw.info.mapId;
			this.m.gameMode = this.m_raw.info.gameMode;
			this.m.gameType = this.m_raw.info.gameType;

			//differences
			this.m.gameName = this.m_raw.info.gameName;
			this.m.gameStartTimestamp = this.m_raw.info.gameStartTimestamp;
			this.m.tournamentCode = this.m_raw.info.tournamentCode;

			//teams
			for (let team of this.m_raw.info.teams) {
				this.m.teams.push(team);
			}

			//participants
			for (let participant of this.m_raw.info.participants) {
				try {
					participant.championId = matchFindChampion(participant.championId, participant.championName);
				}
				catch(e) {
					console.error(e);
				}
				this.m.participants.push(participant);
			}
		}

		if (this.version === 4 && this.mtValid) {
			this.mt.metadata = {
				dataVersion: "2",
				matchId: `${this.m.platformId}_${this.m.gameId}`,
				participants: this.m.participants.map(x => x.puuid),
			};
			this.mt.info = {
				frameInterval: this.mt_raw.frameInterval,
				frames: this.mt_raw.frames.map(f => {
					let answer = {
						events: f.events,
						participantFrames: {},
						timestamp: f.timestamp,
					};
					for (let b in f.participantFrames) {
						answer.participantFrames[b] = {
							championStats: {
								"abilityHaste": null,
								"abilityPower": null,
								"armor": null,
								"armorPen": null,
								"armorPenPercent": null,
								"attackDamage": null,
								"attackSpeed": null,
								"bonusArmorPenPercent": null,
								"bonusMagicPenPercent": null,
								"ccReduction": null,
								"cooldownReduction": null,
								"health": null,
								"healthMax": null,
								"healthRegen": null,
								"lifesteal": null,
								"magicPen": null,
								"magicPenPercent": null,
								"magicResist": null,
								"movementSpeed": null,
								"omnivamp": null,
								"physicalVamp": null,
								"power": null,
								"powerMax": null,
								"powerRegen": null,
								"spellVamp": null
							},
							currentGold: f.participantFrames[b].currentGold,
							damageStats: {
								"magicDamageDone": null,
								"magicDamageDoneToChampions": null,
								"magicDamageTaken": null,
								"physicalDamageDone": null,
								"physicalDamageDoneToChampions": null,
								"physicalDamageTaken": null,
								"totalDamageDone": null,
								"totalDamageDoneToChampions": null,
								"totalDamageTaken": null,
								"trueDamageDone": null,
								"trueDamageDoneToChampions": null,
								"trueDamageTaken": null
							},
							goldPerSecond: null,
							jungleMinionsKilled: f.participantFrames[b].jungleMinionsKilled,
							level: f.participantFrames[b].level,
							minionsKilled: f.participantFrames[b].minionsKilled,
							participantId: parseInt(b),
							position: f.participantFrames[b].position,
							timeEnemySpentControlled: null,
							totalGold: f.participantFrames[b].totalGold,
							xp: f.participantFrames[b].xp,
						};
					}
					return answer;
				}),
				gameId: this.m.gameId,
				participants: this.m.participants.map(x => {
					return {
						participantId: x.participantId,
						puuid: x.puuid,
					};
				}),
			};
		}
		else if (this.version === 5 && this.mtValid) {
			this.mt.metadata = this.mt_raw.metadata;
			this.mt.info = this.mt_raw.info;
		}
		delete this.m_raw;
		delete this.mt_raw;

		if (this.gameVersion === undefined || this.gameVersion === null) {
			this.m_valid = false;
			return this;
		}

		this.cache = {};
		if (this.version === 4) {
			this.cache.gameDuration = this.m.gameDuration;
		}
		else {
			const game_version = this.gameVersion;
			const game_version_first_dot_index = game_version.indexOf(".");
			const patch = (parseInt(game_version.substring(0, game_version_first_dot_index)) * 100) + parseInt(game_version.substring(game_version_first_dot_index + 1, game_version.indexOf(".", game_version_first_dot_index + 1)));
			//console.log(`----------------------${patch}`);
			if (patch > 1119) {
				this.cache.gameDuration = this.m.gameDuration;
			}
			else {
				this.cache.gameDuration = Math.ceil(this.m.gameDuration / 1000);
			}
		}

		let answer = [];
		for (let team of this.m.teams) {
			let temp_team = {
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
			};
			answer.push(temp_team);
		}
		this.cache.teams = answer;
		this.cache.participants = this.m.participants.map(participant => {
			return {
				participantId: participant.participantId,
				teamId: participant.teamId,
				championId: participant.championId,
				spell1Id: participant.summoner1Id,
				spell2Id: participant.summoner2Id,
				highestAchievedSeasonTier: null,
				stats: {
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
					//new
					spell1Casts: participant.spell1Casts,
					spell2Casts: participant.spell2Casts,
					spell3Casts: participant.spell3Casts,
					spell4Casts: participant.spell4Casts,
					summoner1Casts: participant.summoner1Casts,
					summoner2Casts: participant.summoner2Casts,
				},
				timeline: {
					participantId: participant.participantId,
					role: participant.role,
					lane: participant.lane,
				},
				role: participant.role
			};
		});

		this.cache.participantIdentities = this.m.participants.map(participant => {
			return {
				participantId: participant.participantId,
				player: {
					platformId: this.m.platformId,
					accountId: null,
					summonerName: participant.summonerName,
					summonerId: participant.summonerId,
					currentPlatformId: this.m.platformId,
					currentAccountId: null,
					matchHistoryUri: null,
					profileIcon: participant.profileIcon,
				}
			};
		});

		if (this.mtValid) {
			this.cache.frames = this.mt.info.frames.map(frame => {
				let answer = {
					participantFrames: {},
					events: frame.events,
					timestamp: frame.timestamp,
				};
				for (let b in frame.participantFrames) {
					answer.participantFrames[b] = {
						participantId: parseInt(b),
						position: frame.participantFrames[b].position,
						currentGold: frame.participantFrames[b].currentGold,
						totalGold: frame.participantFrames[b].totalGold,
						level: frame.participantFrames[b].level,
						xp: frame.participantFrames[b].xp,
						minionsKilled: frame.participantFrames[b].minionsKilled,
						jungleMinionsKilled: frame.participantFrames[b].jungleMinionsKilled,
						dominionScore: null,
						teamScore: null,
					};
				}
				return answer;
			});
		}
		else {
			this.cache.frames = null;
		}
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
}
