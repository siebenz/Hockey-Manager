/**
 * APEX HOCKEY SIMULATION ENGINE
 * Core Javascript Architectural Blueprint
 */

// Global Config Database Structs
const LEAGUE_STRUCTURE = {
    "Eastern": {
        "Atlantic": ["Boston Bruins", "Buffalo Sabres", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "Ottawa Senators", "Tampa Bay Lightning", "Toronto Maple Leafs"],
        "Metropolitan": ["Carolina Hurricanes", "Columbus Blue Jackets", "New Jersey Devils", "New York Islanders", "New York Rangers", "Philadelphia Flyers", "Pittsburgh Penguins", "Washington Capitals"]
    },
    "Western": {
        "Central": ["Chicago Blackhawks", "Colorado Avalanche", "Dallas Stars", "Minnesota Wild", "Nashville Predators", "St. Louis Blues", "Utah Hockey Club", "Winnipeg Jets"],
        "Pacific": ["Anaheim Ducks", "Calgary Flames", "Edmonton Oilers", "Los Angeles Kings", "San Jose Sharks", "Seattle Kraken", "Vancouver Canucks", "Vegas Golden Knights"]
    }
};

const ARCHE_TYPES = {
    Skaters: ["Sniper", "Playmaker", "Two-Way Forward", "Power Forward", "Enforcer", "Offensive D-Man", "Shutdown D-Man"],
    Goalies: ["Butterfly", "Hybrid", "Standup"]
};

const FIRST_NAMES = ["Connor", "Auston", "Leon", "Nathan", "Nikita", "Cale", "Artemi", "David", "Sidney", "Mitch", "Aleksander", "Kirill", "Jack", "Quinn", "Sebastian", "Elias", "William", "Juuse", "Igor", "Andrei"];
const LAST_NAMES = ["McDavid", "Matthews", "Draisaitl", "MacKinnon", "Kucherov", "Makar", "Panarin", "Pastrnak", "Crosby", "Marner", "Barkov", "Kaprizov", "Hughes", "Hughes", "Aho", "Pettersson", "Nylander", "Saros", "Shesterkin", "Vasilevskiy"];

// Main State Container
let franchiseState = {
    userTeam: "Boston Bruins",
    simDay: 1,
    teams: {},
    schedule: [],
    draftClass: [],
    currentStandingsScope: "league",
    activeView: "dashboard"
};

// Utilities & Generators
const utils = {
    randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    generateName: () => `${utils.choice(FIRST_NAMES)} ${utils.choice(LAST_NAMES)}`,
    
    // Algorithmic Attribute Assigner matching tactical player profiles
    createProceduralPlayer: (pos, overrideOvr = null) => {
        const age = utils.randInt(18, 38);
        const pot = utils.randInt(70, 96);
        const baseOvr = overrideOvr ? overrideOvr : (age < 23 ? utils.randInt(65, pot) : utils.randInt(74, 91));
        const arch = pos === 'G' ? utils.choice(ARCHE_TYPES.Goalies) : utils.choice(ARCHE_TYPES.Skaters);
        
        let p = {
            id: Math.random().toString(36).substr(2, 9),
            name: utils.generateName(),
            pos: pos,
            archetype: arch,
            age: age,
            ovr: baseOvr,
            potential: pot,
            salary: parseFloat(((baseOvr * baseOvr) / 850).toFixed(2)), // Scaling market curve
            contractTerm: utils.randInt(1, 8),
            fatigue: 0,
            injuryDays: 0,
            // Core attributes
            skating: utils.randInt(baseOvr-5, Math.min(99, baseOvr+7)),
            shooting: utils.randInt(baseOvr-5, Math.min(99, baseOvr+7)),
            passing: utils.randInt(baseOvr-5, Math.min(99, baseOvr+7)),
            defense: utils.randInt(baseOvr-6, Math.min(99, baseOvr+6)),
            physical: utils.randInt(baseOvr-6, Math.min(99, baseOvr+8)),
            consistency: utils.randInt(60, 99)
        };

        // Enforce Archetype Bias Math
        if (arch === "Sniper") p.shooting = Math.min(99, p.shooting + 8);
        if (arch === "Playmaker") p.passing = Math.min(99, p.passing + 8);
        if (arch === "Shutdown D-Man") p.defense = Math.min(99, p.defense + 10);
        
        // Re-normalize asset valuation boundaries
        if (p.salary < 0.77) p.salary = 0.77; // League Minimum Cap Entry
        return p;
    }
};

// Simulation Systems Core Logic
const simEngine = {
    initUniverse: () => {
        // Build all 32 real-world scalable franchises
        for (const conf in LEAGUE_STRUCTURE) {
            for (const div in LEAGUE_STRUCTURE[conf]) {
                LEAGUE_STRUCTURE[conf][div].forEach(teamName => {
                    let teamRoster = [];
                    // Generate positionally deep core roster structures
                    for(let i=0; i<4; i++) teamRoster.push(utils.createProceduralPlayer('C'));
                    for(let i=0; i<4; i++) teamRoster.push(utils.createProceduralPlayer('LW'));
                    for(let i=0; i<4; i++) teamRoster.push(utils.createProceduralPlayer('RW'));
                    for(let i=0; i<4; i++) teamRoster.push(utils.createProceduralPlayer('LD'));
                    for(let i=0; i<4; i++) teamRoster.push(utils.createProceduralPlayer('RD'));
                    for(let i=0; i<3; i++) teamRoster.push(utils.createProceduralPlayer('G'));

                    // Give every team 1 true Elite Star Player out of the gate
                    teamRoster[0] = utils.createProceduralPlayer('C', utils.randInt(90, 98));

                    franchiseState.teams[teamName] = {
                        name: teamName,
                        conference: conf,
                        division: div,
                        roster: teamRoster,
                        lines: {},
                        wins: 0, losses: 0, otl: 0, points: 0,
                        gf: 0, ga: 0, ppAttempts: 0, ppGoals: 0, pkAttempts: 0, pkGoals: 0
                    };
                    
                    simEngine.optimizeTeamLineup(teamName);
                });
            }
        }
        simEngine.generateLeagueSchedule();
        simEngine.generateDraftClass();
    },

    optimizeTeamLineup: (teamName) => {
        const team = franchiseState.teams[teamName];
        const r = team.roster.filter(p => p.injuryDays === 0);
        
        const cs = r.filter(p => p.pos === 'C').sort((a,b) => b.ovr - a.ovr);
        const lws = r.filter(p => p.pos === 'LW').sort((a,b) => b.ovr - a.ovr);
        const rws = r.filter(p => p.pos === 'RW').sort((a,b) => b.ovr - a.ovr);
        const lds = r.filter(p => p.pos === 'LD').sort((a,b) => b.ovr - a.ovr);
        const rds = r.filter(p => p.pos === 'RD').sort((a,b) => b.ovr - a.ovr);
        const gs = r.filter(p => p.pos === 'G').sort((a,b) => b.ovr - a.ovr);

        // Map operational standard 4-line Forward groups, 3 Defensive pairings, 2 active goalies
        team.lines = {
            f1: [lws[0] || cs[4], cs[0] || cs[5], rws[0] || cs[6]],
            f2: [lws[1] || cs[7], cs[1] || cs[8], rws[1] || cs[9]],
            f3: [lws[2], cs[2], rws[2]],
            f4: [lws[3], cs[3], rws[3]],
            d1: [lds[0] || lds[3], rds[0] || rds[3]],
            d2: [lds[1], rds[1]],
            d3: [lds[2], rds[2]],
            goalies: [gs[0], gs[1]]
        };
    },

    generateLeagueSchedule: () => {
        const teamNames = Object.keys(franchiseState.teams);
        // Generates an automated calendar array sequence across simulated time blocks
        for (let i = 0; i < teamNames.length; i++) {
            for (let j = i + 1; j < teamNames.length; j++) {
                franchiseState.schedule.push({
                    day: utils.randInt(1, 175),
                    away: teamNames[i],
                    home: teamNames[j],
                    played: false,
                    result: null
                });
            }
        }
        // Cap schedule sequencing at realistic standard constraints
        franchiseState.schedule = franchiseState.schedule.slice(0, 1312).sort((a,b) => a.day - b.day);
    },

    generateDraftClass: () => {
        franchiseState.draftClass = [];
        for (let i = 0; i < 60; i++) {
            let p = utils.createProceduralPlayer(utils.choice(['C','LW','RW','LD','RD','G']));
            p.age = 18;
            p.ovr = utils.randInt(62, 76);
            p.potential = utils.randInt(80, 97);
            franchiseState.draftClass.push(p);
        }
        franchiseState.draftClass.sort((a,b) => b.potential - a.potential);
    },

    // Possessional Multi-Variable Hockey Match Simulator Engine Matrix
    simulateMatchCalculus: (game, liveReporting = false) => {
        const away = franchiseState.teams[game.away];
        const home = franchiseState.teams[game.home];

        // Aggregate unit-level performance ratings
        let awayOff = away.roster.reduce((acc, p) => acc + (p.shooting + p.passing)/2, 0) / away.roster.length;
        let awayDef = away.roster.reduce((acc, p) => acc + p.defense, 0) / away.roster.length;
        let homeOff = home.roster.reduce((acc, p) => acc + (p.shooting + p.passing)/2, 0) / home.roster.length;
        let homeDef = home.roster.reduce((acc, p) => acc + p.defense, 0) / home.roster.length;

        let awayG = away.lines.goalies[0] ? away.lines.goalies[0].ovr : 75;
        let homeG = home.lines.goalies[0] ? home.lines.goalies[0].ovr : 75;

        let aScore = 0, hScore = 0, aShots = 0, hShots = 0;
        let logs = [];

        // Loop through standard 3-period system
        for (let p = 1; p <= 3; p++) {
            let periodShotsAway = Math.floor((awayOff / homeDef) * utils.randInt(8, 14));
            let periodShotsHome = Math.floor((homeOff / awayDef) * utils.randInt(8, 14));
            
            aShots += periodShotsAway;
            hShots += periodShotsHome;

            // Compute probabilistic saving thresholds vs offensive conversion ratios
            for(let s=0; s<periodShotsAway; s++) {
                if (Math.random() * 100 > (awayG * 0.45 + 50)) {
                    aScore++;
                    if(liveReporting && logs.length < 15) logs.push(`P${p} - GOAL: ${game.away} scores past netminder!`);
                }
            }
            for(let s=0; s<periodShotsHome; s++) {
                if (Math.random() * 100 > (homeG * 0.45 + 50)) {
                    hScore++;
                    if(liveReporting && logs.length < 15) logs.push(`P${p} - GOAL: ${game.home} strikes cleanly into mesh!`);
                }
            }
        }

        // Overtime safety catch
        if (aScore === hScore) {
            if (Math.random() > 0.5) { aScore++; logs.push("OT - GOAL: Breakaway winner captures extra point."); } 
            else { hScore++; logs.push("OT - GOAL: Blue-line slapshot seals home win."); }
        }

        // Apply global state object stats updates
        away.gf += aScore; away.ga += hScore; home.gf += hScore; home.ga += aScore;
        franchiseState.teams[game.away].wins += aScore > hScore ? 1 : 0;
        franchiseState.teams[game.away].losses += aScore < hScore ? 1 : 0;
        franchiseState.teams[game.home].wins += hScore > aScore ? 1 : 0;
        franchiseState.teams[game.home].losses += hScore < aScore ? 1 : 0;
        
        // Basic point tally updating logic
        franchiseState.teams[game.away].points = (franchiseState.teams[game.away].wins * 2);
        franchiseState.teams[game.home].points = (franchiseState.teams[game.home].wins * 2);

        // Process procedural random micro-injuries across roster depths
        [away, home].forEach(t => {
            if(utils.randInt(1, 100) > 94) {
                let casualty = utils.choice(t.roster);
                casualty.injuryDays = utils.randInt(4, 20);
                if(liveReporting || t.name === franchiseState.userTeam) {
                    ui.logTicker(`${t.name} medical update: ${casualty.name} diagnosed with upper-body strain.`, true);
                }
            }
        });

        game.played = true;
        game.result = { aScore, hScore, aShots, hShots, logs };
        return game.result;
    },

    simDays: (days) => {
        for(let d=0; d<days; d++) {
            let dailyGames = franchiseState.schedule.filter(g => g.day === franchiseState.simDay && !g.played);
            dailyGames.forEach(g => {
                simEngine.simulateMatchCalculus(g, false);
            });
            
            // Advance development curves on critical day increments
            if (franchiseState.simDay % 30 === 0) {
                simEngine.processRosterDevelopmentTick();
            }

            franchiseState.simDay++;
        }
        ui.updateView();
    },

    processRosterDevelopmentTick: () => {
        // Handle physical rating adaptations based on individual potential ceilings
        Object.values(franchiseState.teams).forEach(t => {
            t.roster.forEach(p => {
                if (p.age < 24 && p.ovr < p.potential) {
                    if (Math.random() > 0.6) p.ovr += 1;
                } else if (p.age > 33) {
                    if (Math.random() > 0.6) p.ovr -= 1; // Age-based athletic decline regression curve
                }
                if (p.injuryDays > 0) p.injuryDays = Math.max(0, p.injuryDays - 3);
            });
            simEngine.optimizeTeamLineup(t.name);
        });
    },

    evaluateTradeProposal: () => {
        const userSel = document.getElementById('trade-user-asset-select');
        const partnerSel = document.getElementById('trade-partner-asset-select');
        const partnerTeamName = document.getElementById('trade-partner-team-select').value;

        if(!userSel.value || !partnerSel.value) {
            document.getElementById('trade-valuation-feedback').innerText = "Select specific assets from both pools to execute processing.";
            return;
        }

        const myTeam = franchiseState.teams[franchiseState.userTeam];
        const alienTeam = franchiseState.teams[partnerTeamName];

        let myAsset = myTeam.roster.find(p => p.id === userSel.value);
        let alienAsset = alienTeam.roster.find(p => p.id === partnerSel.value);

        // Core Mathematical Value Index Calculation
        let valueOffered = (myAsset.ovr * 1.2) + (myAsset.potential * 0.8) + (35 - myAsset.age);
        let valueDemanded = (alienAsset.ovr * 1.2) + (alienAsset.potential * 0.8) + (35 - alienAsset.age);

        let diff = valueOffered - valueDemanded;
        const feedback = document.getElementById('trade-valuation-feedback');

        if(diff >= -5) {
            // Transaction executed successfully. Swapping object matrices.
            myTeam.roster = myTeam.roster.filter(p => p.id !== myAsset.id);
            alienTeam.roster = alienTeam.roster.filter(p => p.id !== alienAsset.id);
            
            myTeam.roster.push(alienAsset);
            alienTeam.roster.push(myAsset);
            
            simEngine.optimizeTeamLineup(franchiseState.userTeam);
            simEngine.optimizeTeamLineup(partnerTeamName);

            feedback.innerHTML = `<span class="text-success"><b>TRADE APPROVED:</b> Transaction compiled seamlessly. Assets updated inside main rosters.</span>`;
            ui.logTicker(`TRADE: ${franchiseState.userTeam} acquires ${alienAsset.name} from ${partnerTeamName}.`, false);
            ui.populateTradeDesk();
        } else {
            feedback.innerHTML = `<span class="text-danger"><b>TRADE REJECTED:</b> The AI package evaluation matrix returns a deficit of ${Math.abs(Math.round(diff))} points. Add stronger assets.</span>`;
        }
    }
};

// UI Rendering Engine Context Bindings
const ui = {
    switchTab: (tabId) => {
        document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`view-${tabId}`).classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        franchiseState.activeView = tabId;
        ui.updateView();
    },

    updateView: () => {
        // Global header syncs
        const myTeam = franchiseState.teams[franchiseState.userTeam];
        if(myTeam) {
            document.getElementById('user-team-display').innerText = myTeam.name;
            const totalSal = myTeam.roster.reduce((sum, p) => sum + p.salary, 0);
            document.getElementById('user-cap-display').innerText = `$${(92.00 - totalSal).toFixed(2)}M`;
            document.getElementById('user-record-display').innerText = `${myTeam.wins}-${myTeam.losses}-${myTeam.otl}`;
            
            document.getElementById('dash-pp').innerText = "18.4%";
            document.getElementById('dash-pk').innerText = "81.2%";
            document.getElementById('dash-injuries').innerText = `${myTeam.roster.filter(p => p.injuryDays > 0).length} Enrolled`;
        }

        document.getElementById('schedule-day-indicator').innerText = franchiseState.simDay;

        // Sub-view component targeted renders
        if(franchiseState.activeView === 'roster') ui.renderRoster();
        if(franchiseState.activeView === 'lines') ui.renderLines();
        if(franchiseState.activeView === 'schedule') ui.renderSchedule();
        if(franchiseState.activeView === 'standings') ui.renderStandings(franchiseState.currentStandingsScope);
        if(franchiseState.activeView === 'trade') ui.populateTradeDesk();
        if(franchiseState.activeView === 'draft') ui.renderDraft();
    },

    logTicker: (msg, priority) => {
        const box = document.getElementById('ticker-box');
        const item = document.createElement('p');
        item.className = `ticker-item ${priority ? 'injury' : ''}`;
        item.innerHTML = `[DAY ${franchiseState.simDay}] ${msg}`;
        box.prepend(item);
    },

    renderRoster: () => {
        const filter = document.getElementById('roster-team-filter');
        if(filter.options.length === 0) {
            Object.keys(franchiseState.teams).sort().forEach(t => {
                filter.options[filter.options.length] = new Option(t, t);
            });
            filter.value = franchiseState.userTeam;
        }

        const team = franchiseState.teams[filter.value];
        const tbody = document.getElementById('roster-table-rows');
        tbody.innerHTML = '';

        team.roster.sort((a,b) => b.ovr - a.ovr).forEach(p => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${p.name}</b></td>
                <td>${p.pos}</td>
                <td><small>${p.archetype}</small></td>
                <td>${p.age}</td>
                <td style="color:var(--color-accent)"><b>${p.ovr}</b></td>
                <td>$${p.salary.toFixed(2)}M</td>
                <td>${p.contractTerm}y</td>
                <td>${p.potential}</td>
                <td><span class="${p.injuryDays > 0 ? 'text-danger' : 'text-success'}">${p.injuryDays > 0 ? `INJ (${p.injuryDays}d)` : '100%'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderLines: () => {
        const team = franchiseState.teams[franchiseState.userTeam];
        const container = document.getElementById('lines-workspace');
        container.innerHTML = '';

        for (const lineKey in team.lines) {
            if(lineKey === 'goalies') continue;
            let lineArr = team.lines[lineKey];
            let block = document.createElement('div');
            block.className = 'line-block-card';
            block.innerHTML = `<h3>${lineKey.toUpperCase()} Combination</h3>`;
            
            let slotContainer = document.createElement('div');
            slotContainer.className = 'line-slots-container';
            
            lineArr.forEach(p => {
                let pill = document.createElement('div');
                pill.className = 'player-line-pill';
                pill.innerHTML = `<b>${p ? p.name : 'EMPTY'}</b><br><small>${p ? p.pos : ''} | OVR: ${p ? p.ovr : '--'} (${p ? p.archetype : ''})</small>`;
                slotContainer.appendChild(pill);
            });
            block.appendChild(slotContainer);
            container.appendChild(block);
        }
    },

    optimizeLineups: () => {
        simEngine.optimizeTeamLineup(franchiseState.userTeam);
        ui.renderLines();
        alert("Roster performance tiers recalculated. Optimal lines set.");
    },

    renderSchedule: () => {
        const tbody = document.getElementById('schedule-table-rows');
        tbody.innerHTML = '';

        // Display current upcoming or historically completed matching games context scope
        let localizedGames = franchiseState.schedule.filter(g => g.day >= franchiseState.simDay - 1 && g.day <= franchiseState.simDay + 3);
        
        localizedGames.slice(0, 30).forEach(g => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${g.day}</td>
                <td>${g.away}</td>
                <td>${g.home}</td>
                <td>${g.played ? `<strong class="text-success">${g.result.aScore} - ${g.result.hScore}</strong>` : 'Scheduled'}</td>
                <td>${g.played ? '<span class="color-text-muted">Final</span>' : `<button class="btn btn-sm btn-accent" onclick="ui.launchLiveSimModal(${g.id || g.day})">Sim Live</button>`}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    launchLiveSimModal: (dayId) => {
        let game = franchiseState.schedule.find(g => (g.id === dayId || g.day === dayId) && !g.played);
        if(!game) return;

        document.getElementById('match-sim-modal').style.display = 'flex';
        document.getElementById('modal-away-name').innerText = game.away;
        document.getElementById('modal-home-name').innerText = game.home;

        // Trigger probabilistic background calculation
        let res = simEngine.simulateMatchCalculus(game, true);
        
        document.getElementById('modal-away-score').innerText = res.aScore;
        document.getElementById('modal-home-score').innerText = res.hScore;
        document.getElementById('modal-away-shots').innerText = res.aShots;
        document.getElementById('modal-home-shots').innerText = res.hShots;

        const logBox = document.getElementById('modal-live-log');
        logBox.innerHTML = '';
        res.logs.forEach(l => {
            logBox.innerHTML += `<div>${l}</div>`;
        });

        document.getElementById('modal-close-btn').disabled = false;
    },

    closeModal: () => {
        document.getElementById('match-sim-modal').style.display = 'none';
        ui.updateView();
    },

    renderStandings: (scope) => {
        franchiseState.currentStandingsScope = scope;
        document.querySelectorAll('.tabs-sub .btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-stand-${scope.slice(0,4)}`).classList.add('active');

        const tbody = document.getElementById('standings-table-rows');
        tbody.innerHTML = '';

        let list = Object.values(franchiseState.teams);
        if(scope === 'conference') {
            list = list.filter(t => t.conference === franchiseState.teams[franchiseState.userTeam].conference);
        } else if (scope === 'division') {
            list = list.filter(t => t.division === franchiseState.teams[franchiseState.userTeam].division);
        }

        list.sort((a,b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga)).forEach((t, i) => {
            let tr = document.createElement('tr');
            let totalGames = t.wins + t.losses + t.otl;
            tr.innerHTML = `
                <td>${i+1}</td>
                <td><b>${t.name}</b></td>
                <td>${totalGames}</td>
                <td>${t.wins}</td>
                <td>${t.losses}</td>
                <td>${t.otl}</td>
                <td style="color:var(--color-primary)"><b>${t.points}</b></td>
                <td>${t.gf}</td>
                <td>${t.ga}</td>
                <td>${t.gf - t.ga}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    populateTradeDesk: () => {
        const mySelect = document.getElementById('trade-user-asset-select');
        mySelect.innerHTML = '';
        franchiseState.teams[franchiseState.userTeam].roster.sort((a,b)=>b.ovr-a.ovr).forEach(p => {
            mySelect.options[mySelect.options.length] = new Option(`OVR: ${p.ovr} - ${p.name} (${p.pos})`, p.id);
        });

        const teamSelect = document.getElementById('trade-partner-team-select');
        if(teamSelect.options.length === 0) {
            Object.keys(franchiseState.teams).sort().forEach(t => {
                if(t !== franchiseState.userTeam) teamSelect.options[teamSelect.options.length] = new Option(t, t);
            });
        }
        ui.populatePartnerAssets();
    },

    populatePartnerAssets: () => {
        const targetTeam = document.getElementById('trade-partner-team-select').value;
        const alienSelect = document.getElementById('trade-partner-asset-select');
        alienSelect.innerHTML = '';
        if(!targetTeam) return;
        
        franchiseState.teams[targetTeam].roster.sort((a,b)=>b.ovr-a.ovr).forEach(p => {
            alienSelect.options[alienSelect.options.length] = new Option(`OVR: ${p.ovr} - ${p.name} (${p.pos})`, p.id);
        });
    },

    renderDraft: () => {
        const tbody = document.getElementById('draft-table-rows');
        tbody.innerHTML = '';

        franchiseState.draftClass.forEach((p, idx) => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${idx+1}</td>
                <td><b>${p.name}</b></td>
                <td>${p.pos}</td>
                <td>${p.archetype}</td>
                <td>${p.ovr}</td>
                <td style="color:var(--color-success)"><b>${p.potential}</b></td>
                <td>High (95%)</td>
                <td><button class="btn btn-sm btn-primary" onclick="ui.executeDraftPick(${idx})">Select Prospect</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    executeDraftPick: (index) => {
        let prospect = franchiseState.draftClass[index];
        franchiseState.teams[franchiseState.userTeam].roster.push(prospect);
        franchiseState.draftClass.splice(index, 1);
        
        alert(`Transaction Completed: ${prospect.name} added to franchise core development system list.`);
        ui.renderDraft();
        ui.updateView();
    }
};

// Application Life Cycle Bootstrap Entry Point Hook
window.onload = () => {
    simEngine.initUniverse();
    ui.switchTab('dashboard');
};