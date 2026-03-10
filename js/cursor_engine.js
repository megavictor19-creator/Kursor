// js/cursor_engine.js
const SAFEPAD = { minX: 2100, maxX: 2900, minY: 2200, maxY: 2800 };

window.playerData = null;
window.playerSkills = {}; 
window.playerPassives = [];
window.globalPlayerX = 2500; 
window.globalPlayerY = 2500;
window.isTacticalMode = false; 
window.canDragMap = false;

window.xpTable = [
    0, 121, 320, 900, 2000, 4500, 7000, 13000, 21000, 36000, 52000, 73000, 94000, 110000, 121000, 135000, 161000, 191000, 226000, 265000, 
    309000, 358000, 410000, 467000, 533000, 603000, 680000, 761000, 845000, 933000, 1030000, 1130000, 1250000, 1370000, 1510000, 1670000, 1840000, 2050000, 2270000, 2520000, 
    2790000, 3080000, 3410000, 3770000, 4150000, 4540000, 5040000, 5590000, 6210000, 6890000, 7650000, 8570000, 9520000, 10580000, 11750000, 13060000, 14570000, 16200000, 18000000, 20010000, 
    22240000, 24840000, 27620000, 30710000, 34150000, 37980000, 42420000, 47190000, 52500000, 58410000, 64980000, 72610000, 80820000, 89950000, 100120000, 111430000, 124570000, 138710000, 154460000, 171990000, 
    191510000, 226000000, 252000000, 283000000, 317000000, 355000000, 397000000, 498000000, 559000000, 1040000000, 1250000000, 1500000000, 1800000000, 2160000000, 2590000000, 3110000000, 3730000000, 4480000000, 5370000000, 6420000000, 
    7740000000, 9290000000, 11140000000, 13370000000, 16050000000, 19260000000, 23110000000, 27740000000, 33290000000, 40000000000, 47900000000,
    57530000000, 69020000000, 82850000000, 99410000000, 119280000000, 143150000000, 171130000000, 206000000000, 248000000000, 222000000000,
    256000000000, 295000000000, 338000000000, 390000000000, 446000000000, 515000000000, 593000000000, 681000000000, 688000000000, 767000000000,
    867000000000, 979000000000, 1107000000000, 1250000000000, 1413000000000, 1597000000000, 1805000000000, 2039000000000, 1949000000000, 2164000000000,
    2402000000000, 2666000000000, 2960000000000, 3285000000000, 3646000000000, 4048000000000, 4493000000000, 4498000000000, 5535000000000, 7262000000000,
    8206000000000, 9272000000000, 10478000000000, 11840000000000, 13379000000000, 15118000000000, 17084000000000, 19304000000000, 21815000000000, 26546000000000,
    32424000000000, 39771000000000, 49022000000000, 60729000000000, 75641000000000, 94751000000000, 119385000000000, 151336000000000, 185629000000000, 265291000000000,
    377016000000000, 563433000000000, 780676000000000, 1114000000000000, 1608000000000000, 2351000000000000, 3395000000000000, 4936000000000000, 7223000000000000, 9999999999999999
];

window.recalculatePlayerStats = function() {
    if (!window.playerData) return;
    
    let eq = window.equipmentStats || {};
    let p = window.playerData;

    let statSTR = parseInt(p.stat_str) || 0;
    let statDEX = parseInt(p.stat_dex) || 0;
    let statCON = parseInt(p.stat_con) || 0;
    let statINT = parseInt(p.stat_int) || 0;
    let statWIS = parseInt(p.stat_wis) || 0;
    let statCHA = parseInt(p.stat_cha) || 0;

    let strDmg = statSTR * 2; let strMelee = statSTR * 1;
    let dexRange = statDEX * 1; let dexCrit = statDEX * 0.5; let dexDodge = statDEX * 0.5;
    let conHp = statCON * 15; let conResist = statCON * 1;
    let intArea = statINT * 1; let intMp = statINT * 5;
    let wisSingle = statWIS * 1; let wisXp = statWIS * 1;
    let chaLoot = statCHA * 1; let chaSp = statCHA * 5;
    
    let vit = (parseInt(p.attr_vitality) || 0) + (eq.attr_vitality || 0);
    window.playerMaxHp = parseInt(p.max_hp) + (vit * 20) + (eq.max_hp || 0) + conHp;
    
    if (typeof window.playerCurrentHp === 'undefined' || isNaN(window.playerCurrentHp)) {
        window.playerCurrentHp = parseInt(p.current_hp) || window.playerMaxHp;
    }
    
    let power = (parseInt(p.attr_power) || 0) + (eq.attr_power || 0);
    window.playerBaseDamage = 35 + (power * 3) + (eq.base_damage || 0) + strDmg;
    
    let crit = (parseInt(p.attr_critical) || 0) + (eq.attr_critical || 0);
    window.playerCritChance = (parseFloat(p.crit_chance) || 5.0) + (crit * 1.5) + dexCrit;
    
    let critDmg = (parseInt(p.attr_critical_damage) || 0) + (eq.attr_critical_damage || 0);
    window.playerCritDamage = 150 + (critDmg * 5);
    
    let areaDmg = (parseInt(p.attr_area_damage) || 0) + (eq.attr_area_damage || 0);
    window.playerAreaDamageBonus = areaDmg * 2 + intArea;
    
    let singleDmg = (parseInt(p.attr_single_target) || 0) + (eq.attr_single_target || 0);
    window.playerSingleTargetBonus = singleDmg * 2 + wisSingle;
    
    let resist = (parseInt(p.attr_resist) || 0) + (eq.attr_resist || 0);
    window.playerResist = resist * 1.5 + conResist;
    
    let loot = (parseInt(p.attr_loot) || 0) + (eq.attr_loot || 0);
    window.playerLootBonus = loot * 2 + chaLoot;
    
    let xp = (parseInt(p.attr_xp_bonus) || 0) + (eq.attr_xp_bonus || 0);
    window.playerXpBonus = xp * 2 + wisXp;
    
    let melee = (parseInt(p.attr_melee) || 0) + (eq.attr_melee || 0);
    window.playerMeleeBonus = melee * 2 + strMelee;
    
    let range = (parseInt(p.attr_range) || 0) + (eq.attr_range || 0);
    window.playerRangeBonus = range * 2 + dexRange;

    let dodge = (parseInt(p.attr_dodge) || 0) + (eq.attr_dodge || 0);
    window.playerDodgeChance = dodge + dexDodge; 

    let maxMana = (parseInt(p.max_mana) || 100) + (eq.max_mana || 0) + intMp;
    window.playerMaxMana = maxMana;
    if (typeof window.playerMana === 'undefined' || isNaN(window.playerMana)) {
        window.playerMana = parseInt(p.current_mana) || window.playerMaxMana;
    }
    
    let maxEnergy = (parseInt(p.max_energy) || 100) + (eq.max_energy || 0) + chaSp;
    window.playerMaxEnergy = maxEnergy;
    if (typeof window.playerEnergy === 'undefined' || isNaN(window.playerEnergy)) {
        window.playerEnergy = parseInt(p.current_energy) || window.playerMaxEnergy;
    }

    if(typeof window.updateAccountAttributesUI === 'function') window.updateAccountAttributesUI();
    if (typeof window.updateHealthBars === 'function') window.updateHealthBars();
    if (typeof window.updateMpUI === 'function') window.updateMpUI();
    if (typeof window.updateEnergyUI === 'function') window.updateEnergyUI();
};

window.refreshSkillUI = function() {
    window.availableSkillPoints = parseInt(window.playerData.skill_points) || 0;
    let skillLevels = {};
    try { skillLevels = JSON.parse(window.playerData.skill_levels_json || '{}'); } catch(e){}

    window.playerSkills = {};
    window.playerPassives = [];

    if (window.playerData.skills && window.playerData.skills.length > 0) {
        window.playerData.skills.forEach(skill => {
            let sLevel = skillLevels[skill.skill_name] || 1;
            let actualDmg = parseInt(skill.base_damage) || 0;
            let actualMana = parseInt(skill.mana_cost) || 0;

            if (skill.skill_type === 'Active') {
                if (actualDmg > 0) actualDmg += ((sLevel - 1) * 15); 
                if (actualMana > 0) actualMana += ((sLevel - 1) * 2); 
            }

            let activeSkill = { ...skill, base_damage: actualDmg, mana_cost: actualMana, level: sLevel };

            if (activeSkill.skill_type === 'Active' && activeSkill.keyboard_key) {
                let key = activeSkill.keyboard_key.toString().trim().toLowerCase(); 
                window.playerSkills[key] = activeSkill; 
                let slot = document.getElementById(`skill-${key}`);
                if (slot) {
                    slot.innerHTML = `<span class="key">${activeSkill.keyboard_key.toUpperCase()}</span><img src="${activeSkill.icon_path}" alt="${activeSkill.skill_name}" style="position:absolute; top:0; left:0; z-index:2; width: 100%; height: 100%; object-fit: cover; border-radius: 6px; opacity: 0.9;" onerror="this.style.display='none'">`;
                    slot.title = `${activeSkill.skill_name} (Lv.${sLevel})\nCost: ${activeSkill.mana_cost} MP\nCooldown: ${activeSkill.cooldown_ms / 1000}s`;
                }
            } else if (activeSkill.skill_type === 'Passive') { 
                window.playerPassives.push(activeSkill); 
            }
        });
    }
};

window.updateXpUI = function() {
    if (!window.playerNextLevelXp) return;
    let pct = (window.playerXp / window.playerNextLevelXp) * 100;
    if (pct >= 100) pct = 99.999;
    
    const pctText = document.getElementById('ui-xp-percent');
    if (pctText) pctText.innerText = pct.toFixed(3) + '%';
    
    for (let i=0; i<10; i++) {
        let seg = document.getElementById('xp-seg-' + i);
        if (seg) {
            let segPct = Math.max(0, Math.min(100, (pct - i*10) * 10));
            seg.style.width = segPct + '%';
        }
    }
};

window.teleportPlayer = function(newX, newY) {
    window.globalPlayerX = newX;
    window.globalPlayerY = newY;
    
    const cursorContainer = document.getElementById("cursor-container");
    if (cursorContainer) {
        cursorContainer.style.left = `${window.globalPlayerX}px`;
        cursorContainer.style.top = `${window.globalPlayerY}px`;
    }
    
    if (window.gameWs && window.gameWs.readyState === WebSocket.OPEN) { 
        window.gameWs.send(JSON.stringify({ type: 'move', x: window.globalPlayerX, y: window.globalPlayerY })); 
    }
};

const allGameRaces = [
    { name: 'Human', path: 'img/races/humano.png', desc: 'Standard balanced race.' },
    { name: 'Elf', path: 'img/races/elfo.png', desc: 'Green magic archers.' },
    { name: 'Orc', path: 'img/races/orc.png', desc: 'Warriors of absurd resistance.' },
    { name: 'Dwarf', path: 'img/races/anao.png', desc: 'Forge and defense specialists.' }
];

window.openRaceModal = async function() {
    const pGlobalX = window.globalPlayerX; 
    const pGlobalY = window.globalPlayerY; 
    const inSafezone = (pGlobalX >= SAFEPAD.minX && pGlobalX <= SAFEPAD.maxX && pGlobalY >= SAFEPAD.minY && pGlobalY <= SAFEPAD.maxY);
    
    if (!inSafezone) {
        alert("You must be inside the Safezone to transmute!");
        return;
    }

    try {
        let res = await fetch('backend/api_races.php?action=get');
        let data = await res.json();
        
        let invRes = await fetch('backend/api_inventory.php');
        let invData = await invRes.json();
        let myItems = invData.success ? invData.inventory : [];
        
        if (data.success) {
            const unlocked = data.unlocked; 
            const container = document.getElementById('race-list-container');
            if (!container) return;
            
            container.innerHTML = '';
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '1fr 1fr';
            container.style.gap = '10px';

            allGameRaces.forEach(race => {
                let checkRaceName = race.name;
                if (race.name === 'Human') checkRaceName = 'Humano';
                if (race.name === 'Elf') checkRaceName = 'Elfo';
                if (race.name === 'Dwarf') checkRaceName = 'Anão';

                const isUnlocked = unlocked.includes(race.name) || unlocked.includes(checkRaceName);
                const isCurrent = (window.playerData && (window.playerData.race === race.name || window.playerData.race === checkRaceName));
                
                let fragNamePt = `Fragmento de ${checkRaceName}`;
                let fragNameEn = `${race.name} Fragment`;
                let fragCount = myItems.filter(i => i.item_name === fragNamePt || i.item_name === fragNameEn).length;
                
                let actionHtml = '';
                if (isCurrent) {
                    actionHtml = `<span style="color: #00e5ff; font-weight: bold; font-size: 11px; padding: 4px 0; margin-top: auto;">EQUIPPED</span>`;
                } else if (isUnlocked) {
                    actionHtml = `<button class="btn-equip-race" style="width: 100%; margin-top: auto;" onclick="window.requestRaceChange('${race.name}', '${race.path}')">Transmute</button>`;
                } else {
                    if (fragCount >= 5) {
                        actionHtml = `<button class="btn-equip-race" style="width: 100%; margin-top: auto; color: #ffca28; border-color: rgba(255, 202, 40, 0.4); background: rgba(255, 202, 40, 0.1);" onmouseenter="this.style.background='#ffca28'; this.style.color='#000'; this.style.boxShadow='0 0 15px rgba(255, 202, 40, 0.6)';" onmouseleave="this.style.background='rgba(255, 202, 40, 0.1)'; this.style.color='#ffca28'; this.style.boxShadow='none';" onclick="window.craftRace('${race.name}')">Forge (${fragCount}/5)</button>`;
                    } else {
                        actionHtml = `<div style="padding: 2px 0; margin-top: auto;"><span style="color: #ff4444; font-size: 10px; font-weight: bold;">🔒 LOCKED</span><br><span style="color: #888; font-size: 9px;">(${fragCount}/5)</span></div>`;
                    }
                }

                let itemClass = (!isUnlocked && fragCount < 5) ? 'opacity: 0.5;' : '';

                container.innerHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: center; transition: 0.2s; height: 100%; box-sizing: border-box; ${itemClass}" onmouseover="if(!this.style.opacity) { this.style.background='rgba(0, 229, 255, 0.05)'; this.style.borderColor='rgba(0, 229, 255, 0.3)'; this.style.transform='translateY(-2px)'; }" onmouseout="if(!this.style.opacity) { this.style.background='rgba(0,0,0,0.4)'; this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='none'; }">
                        <img src="${race.path}" style="width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)); margin-bottom: 8px; image-rendering: pixelated;" onerror="this.src='img/items/default.png'">
                        <span style="color: #fff; font-weight: bold; font-size: 13px; margin-bottom: 2px;">${race.name}</span>
                        <span style="color: #8fa0b5; font-size: 9px; margin-bottom: 12px; min-height: 22px; display: flex; align-items: center; justify-content: center;">${race.desc}</span>
                        ${actionHtml}
                    </div>
                `;
            });
            
            if (typeof toggleWindow === 'function') toggleWindow('window-race-selector');
        } else {
            alert("Error reading races from database.");
        }
    } catch(e) {}
};

window.requestRaceChange = async function(newRace, spritePath) {
    if (confirm(`Transmute soul to the ${newRace} race? Your spells and stats will be reset for this class.`)) {
        try {
            let res = await fetch('backend/api_races.php?action=change', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ race: newRace, sprite_path: spritePath }) 
            });
            let data = await res.json();
            
            if (data.success) { 
                window.location.reload(); 
            } else { 
                alert("Error transmuting: " + (data.error || "Unknown")); 
            }
        } catch(e) {}
    }
};

window.craftRace = async function(raceName) {
    if (confirm(`Do you want to consume 5x [${raceName} Fragment] to unlock this race on your account forever?`)) {
        try {
            let res = await fetch('backend/api_races.php?action=craft', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ race: raceName }) 
            });
            let data = await res.json();
            
            if (data.success) {
                alert(`SUCCESS! The ${raceName} race has been unlocked in the Transmutation Panel!`);
                window.openRaceModal();
                if (typeof loadInventoryData === 'function') loadInventoryData();
            } else { 
                alert("Error forging: " + (data.error || "Unknown")); 
            }
        } catch(e) {}
    }
};

window.updateAccountAttributesUI = function() {
    let attrBox = document.getElementById('ui-account-attributes');
    if (!attrBox || !window.playerData) return; 
    
    let eq = window.equipmentStats || {};
    let p = window.playerData;

    let html = `<div class="title">Account & Equip Bonus</div>`;
    
    let pPower = parseInt(p.attr_power) || 0;
    let tPower = pPower + (eq.attr_power || 0);
    let powerDmg = tPower * 3 + (eq.base_damage || 0);
    html += `<div class="stat-line"><span>Power Strike</span> <span class="highlight">+${powerDmg} DMG</span></div>`;
    
    let pVitality = parseInt(p.attr_vitality) || 0;
    let tVitality = pVitality + (eq.attr_vitality || 0);
    let vitHp = tVitality * 20 + (eq.max_hp || 0);
    html += `<div class="stat-line"><span>Vitality Boost</span> <span class="highlight">+${vitHp} HP</span></div>`;
    
    let pCrit = parseInt(p.attr_critical) || 0;
    let tCrit = pCrit + (eq.attr_critical || 0);
    html += `<div class="stat-line"><span>Critical Strike</span> <span class="highlight">+${(tCrit * 1.5).toFixed(1)}%</span></div>`;
    
    let pDodge = parseInt(p.attr_dodge) || 0;
    let tDodge = pDodge + (eq.attr_dodge || 0);
    html += `<div class="stat-line"><span>Dodge Mastery</span> <span class="highlight">+${tDodge}%</span></div>`;
    
    let cDmg = (parseInt(p.attr_critical_damage) || 0) + (eq.attr_critical_damage || 0);
    if (cDmg > 0) html += `<div class="stat-line"><span>Critical Damage</span> <span class="highlight">+${cDmg * 5}%</span></div>`;
    
    let aDmg = (parseInt(p.attr_area_damage) || 0) + (eq.attr_area_damage || 0);
    if (aDmg > 0) html += `<div class="stat-line"><span>Area Damage</span> <span class="highlight">+${aDmg * 2}%</span></div>`;
    
    let sDmg = (parseInt(p.attr_single_target) || 0) + (eq.attr_single_target || 0);
    if (sDmg > 0) html += `<div class="stat-line"><span>Single Target</span> <span class="highlight">+${sDmg * 2}%</span></div>`;
    
    let pRes = (parseInt(p.attr_resist) || 0) + (eq.attr_resist || 0);
    if (pRes > 0) html += `<div class="stat-line"><span>Resistance</span> <span class="highlight">+${(pRes * 1.5).toFixed(1)}%</span></div>`;
    
    let pLoot = (parseInt(p.attr_loot) || 0) + (eq.attr_loot || 0);
    if (pLoot > 0) html += `<div class="stat-line"><span>Loot Bonus</span> <span class="highlight">+${pLoot * 2}%</span></div>`;
    
    let pXp = (parseInt(p.attr_xp_bonus) || 0) + (eq.attr_xp_bonus || 0);
    if (pXp > 0) html += `<div class="stat-line"><span>XP Bonus</span> <span class="highlight">+${pXp * 2}%</span></div>`;

    let pMelee = (parseInt(p.attr_melee) || 0) + (eq.attr_melee || 0);
    if (pMelee > 0) html += `<div class="stat-line"><span>Melee Bonus</span> <span class="highlight">+${pMelee * 2}%</span></div>`;

    let pRange = (parseInt(p.attr_range) || 0) + (eq.attr_range || 0);
    if (pRange > 0) html += `<div class="stat-line"><span>Range Bonus</span> <span class="highlight">+${pRange * 2}%</span></div>`;
    
    attrBox.innerHTML = html;
};

window.upgradeSkill = async function(skillName) {
    if (window.availableSkillPoints <= 0) return;
    try {
        let res = await fetch('backend/api_save_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'upgrade_skill', skill_name: skillName })
        });
        let data = await res.json();
        if (data.success) {
            if (typeof window.showFloatingText === 'function') {
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 50, "SKILL UPGRADED!", "#00e5ff");
            }
            const response = await fetch('backend/api_player.php');
            const pdata = await response.json();
            if (pdata.success) {
                window.playerData = pdata.player;
                window.refreshSkillUI();
                if (typeof window.renderCharacterSheet === 'function') window.renderCharacterSheet();
            }
        }
    } catch(e) {}
};

async function bootCursorEngine() {
    const gameArea = document.getElementById("gameArea");
    const worldMap = document.getElementById("worldMap");

    let otherPlayersDOM = {}; 
    let lastWsSend = 0;

    const cursorContainer = document.createElement("div"); 
    cursorContainer.id = "cursor-container";
    Object.assign(cursorContainer.style, { position: "absolute", width: "0px", height: "0px", pointerEvents: "none", zIndex: "9999" });

    const playerCursor = document.createElement("img"); 
    playerCursor.id = "player-avatar";
    playerCursor.src = "img/races/humano.png"; 
    Object.assign(playerCursor.style, { position: "absolute", width: "45px", height: "45px", objectFit: "contain", pointerEvents: "none", transformOrigin: "top left", top: "0", left: "0", transition: "transform 0.05s, opacity 0.3s" });
    cursorContainer.appendChild(playerCursor);

    const playerNameTag = document.createElement("div");
    Object.assign(playerNameTag.style, { position: "absolute", left: "22.5px", top: "55px", transform: "translateX(-50%)", color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "300", fontFamily: "'Segoe UI', Tahoma, sans-serif", letterSpacing: "1px", pointerEvents: "none", zIndex: "9998", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", whiteSpace: "nowrap", transition: "opacity 0.2s" });
    cursorContainer.appendChild(playerNameTag);

    const ringsContainer = document.createElement("div");
    Object.assign(ringsContainer.style, { position: "absolute", left: "22.5px", top: "22.5px", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: "9998", opacity: "0.6" });
    ringsContainer.innerHTML = `<svg width="160" height="160" viewBox="0 0 160 160"><path d="M 55,123 A 50,50 0 0,1 55,37" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5" stroke-linecap="round" /><path id="player-hp-ring" d="M 55,123 A 50,50 0 0,1 55,37" fill="none" stroke="rgba(0, 230, 118, 0.45)" stroke-width="5" stroke-linecap="round" stroke-dasharray="104.72" stroke-dashoffset="0" style="transition: stroke-dashoffset 0.2s linear, stroke 0.3s;" /><path d="M 105,123 A 50,50 0 0,0 105,37" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5" stroke-linecap="round" /><path id="player-crit-ring" d="M 105,123 A 50,50 0 0,0 105,37" fill="none" stroke="rgba(255, 202, 40, 0.5)" stroke-width="5" stroke-linecap="round" stroke-dasharray="104.72" stroke-dashoffset="104.72" style="transition: stroke-dashoffset 0.1s linear;" /></svg>`;
    cursorContainer.appendChild(ringsContainer);
    worldMap.appendChild(cursorContainer);

    let cameraZoom = 1.0; 
    let screenMouseX = window.innerWidth / 2; 
    let screenMouseY = window.innerHeight / 2;
    let cameraX = - (5000 / 2) + (window.innerWidth / 2); 
    let cameraY = - (5000 / 2) + (window.innerHeight / 2);
    
    let isDraggingMap = false; 
    let dragStartCamX = 0; 
    let dragStartCamY = 0; 
    let dragStartXMap = 0; 
    let dragStartYMap = 0; 
    let mouseOffsetX = 0; 
    let mouseOffsetY = 0;

    try {
        const response = await fetch('backend/api_player.php');
        const data = await response.json();
        if (data.success) {
            window.playerData = data.player;
            
            let raceStr = window.playerData.race.trim().toLowerCase();
            
            if (raceStr === 'anão' || raceStr === 'anao' || raceStr === 'dwarf') { 
                window.playerData.sprite_path = 'img/races/anao.png';
                window.playerData.race = 'Dwarf'; 
            } else if (raceStr === 'elfo' || raceStr === 'elf') {
                window.playerData.sprite_path = 'img/races/elfo.png';
                window.playerData.race = 'Elf';
            } else if (raceStr === 'orc') {
                window.playerData.sprite_path = 'img/races/orc.png';
                window.playerData.race = 'Orc';
            } else {
                window.playerData.sprite_path = 'img/races/humano.png';
                window.playerData.race = 'Human';
            }
            
            window.playerManaRegen = parseFloat(window.playerData.mana_regen) || 1.0;
            window.playerXp = parseInt(window.playerData.race_xp) || 0;
            window.playerLevel = parseInt(window.playerData.race_level) || 1;
            window.playerNextLevelXp = window.xpTable[window.playerLevel] || 99999999999;
            
            window.playerGold = parseInt(window.playerData.gold) || 0; 
            window.playerKills = parseInt(window.playerData.kills) || 0; 

            window.recalculatePlayerStats();
            window.refreshSkillUI();
            
            if (typeof window.renderCharacterSheet === 'function') {
                window.renderCharacterSheet();
            }

            document.getElementById('ui-level-display').innerText = window.playerLevel;
            document.getElementById('ui-bag-gold').innerText = window.playerGold + " DPI"; 

            const bottomMpText = document.getElementById('ui-mp-text'); if (bottomMpText) bottomMpText.innerText = `${Math.floor(window.playerMana)} / ${window.playerMaxMana}`;
            const bottomMpFill = document.getElementById('bottom-mp-fill'); if (bottomMpFill) bottomMpFill.style.width = `${Math.max(0, (window.playerMana / window.playerMaxMana) * 100)}%`;

            window.updateXpUI();

            playerNameTag.innerText = window.playerData.username; 
            playerCursor.src = window.playerData.sprite_path;

            initMultiplayer();
        } 
    } catch (error) {}

    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    let currentChatChannel = 'zone';

    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active'); 
            currentChatChannel = e.target.dataset.channel;
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !window.isDead) {
            if (document.activeElement === chatInput) {
                const msg = chatInput.value.trim();
                if (msg !== '' && window.gameWs && window.gameWs.readyState === WebSocket.OPEN) {
                    window.gameWs.send(JSON.stringify({ type: 'chat', channel: currentChatChannel, text: msg }));
                }
                chatInput.value = ''; 
                chatInput.blur(); 
                chatContainer.classList.remove('active');
            } else {
                chatInput.focus(); 
                chatContainer.classList.add('active'); 
                e.preventDefault(); 
            }
        }
    });

    function initMultiplayer() {
        window.gameWs = new WebSocket('ws://127.0.0.1:8080');
        window.gameWs.onopen = () => { 
            window.gameWs.send(JSON.stringify({ type: 'init', username: window.playerData.username, sprite: window.playerData.sprite_path, x: window.globalPlayerX, y: window.globalPlayerY, combatTagId: window.myCombatTagId })); 
        };
        window.gameWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'current_players') { 
                for (let id in data.players) { 
                    if (data.players[id].username !== window.playerData.username) spawnOtherPlayer(data.players[id]); 
                } 
            } else if (data.type === 'new_player') { 
                spawnOtherPlayer(data.player); 
            } else if (data.type === 'player_moved') { 
                if (otherPlayersDOM[data.id]) { 
                    otherPlayersDOM[data.id].style.left = `${data.x}px`; 
                    otherPlayersDOM[data.id].style.top = `${data.y}px`; 
                } 
            } else if (data.type === 'player_disconnected') { 
                if (otherPlayersDOM[data.id]) { 
                    otherPlayersDOM[data.id].remove(); 
                    delete otherPlayersDOM[data.id]; 
                } 
            } else if (data.type === 'chat_msg') {
                const msgDiv = document.createElement('div'); 
                msgDiv.style.wordBreak = 'break-word';
                if (data.channel === 'global') msgDiv.innerHTML = `<span style="color: #c4c9cd; font-weight: bold;">[Global] ${data.sender}:</span> <span style="color: #fff;">${data.text}</span>`;
                else if (data.channel === 'zone') msgDiv.innerHTML = `<span style="color: #00e5ff; font-weight: bold;">[Local] ${data.sender}:</span> <span style="color: #ddd;">${data.text}</span>`;
                else msgDiv.innerHTML = `<span style="color: #ff4444; font-weight: bold;">[System]:</span> <span style="color: #fff;">${data.text}</span>`;
                chatMessages.appendChild(msgDiv); 
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        };
    }

    function spawnOtherPlayer(p) {
        if (otherPlayersDOM[p.id]) return;
        const container = document.createElement("div");
        Object.assign(container.style, { position: "absolute", width: "0px", height: "0px", pointerEvents: "none", zIndex: "9997", left: `${p.x}px`, top: `${p.y}px`, transition: "left 0.05s linear, top 0.05s linear" });
        
        const img = document.createElement("img"); 
        let safeSprite = p.sprite;
        if (safeSprite.includes('an%C3%A3o') || safeSprite.includes('Anão')) safeSprite = 'img/races/anao.png';
        img.src = safeSprite;

        Object.assign(img.style, { position: "absolute", width: "45px", height: "45px", objectFit: "contain", transformOrigin: "top left", top: "0", left: "0", opacity: "0.8" });
        container.appendChild(img);
        const nameTag = document.createElement("div"); nameTag.innerText = p.username;
        Object.assign(nameTag.style, { position: "absolute", left: "22.5px", top: "55px", transform: "translateX(-50%)", color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", fontWeight: "300", fontFamily: "'Segoe UI', Tahoma, sans-serif", letterSpacing: "1px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", whiteSpace: "nowrap" });
        container.appendChild(nameTag);
        worldMap.appendChild(container); 
        otherPlayersDOM[p.id] = container;
    }

    let draggedWindow = null; 
    let dragOffsetX = 0; 
    let dragOffsetY = 0;
    
    document.querySelectorAll('.drag-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            draggedWindow = handle.closest('.draggable-window');
            const rect = draggedWindow.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left; 
            dragOffsetY = e.clientY - rect.top;
            draggedWindow.style.left = `${rect.left}px`; 
            draggedWindow.style.top = `${rect.top}px`;
            if (typeof highestZ !== 'undefined') { highestZ++; draggedWindow.style.zIndex = highestZ; }
            e.preventDefault(); 
        });
    });
    
    document.addEventListener('mousemove', (e) => { 
        if (draggedWindow) {
            const w = draggedWindow.offsetWidth  || 300;
            const h = draggedWindow.offsetHeight || 200;
            const margin = 4;
            const rawLeft = e.clientX - dragOffsetX;
            const rawTop  = e.clientY - dragOffsetY;
            const clampedLeft = Math.max(margin, Math.min(window.innerWidth  - w - margin, rawLeft));
            const clampedTop  = Math.max(margin, Math.min(window.innerHeight - h - margin, rawTop));
            draggedWindow.style.left = clampedLeft + 'px';
            draggedWindow.style.top  = clampedTop  + 'px';
        } 
    });
    document.addEventListener('mouseup', () => { draggedWindow = null; });

    const MIN_ZOOM = 0.5; const MAX_ZOOM = 1.5; const ZOOM_SPEED = 0.05;
    window.addEventListener('wheel', (e) => {
        if (e.target.closest('.ui-window') || e.target.closest('.desktop-os-hud') || e.target.closest('.chat-container')) return;
        if (window.isDead) return;
        let oldZoom = cameraZoom;
        if (e.deltaY < 0) cameraZoom += ZOOM_SPEED; else cameraZoom -= ZOOM_SPEED;
        cameraZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraZoom));
        if (oldZoom !== cameraZoom) {
            let worldAnchorX = (screenMouseX - cameraX) / oldZoom; 
            let worldAnchorY = (screenMouseY - cameraY) / oldZoom;
            cameraX -= worldAnchorX * (cameraZoom - oldZoom); 
            cameraY -= worldAnchorY * (cameraZoom - oldZoom);
            cameraX = Math.max(-(5000 * cameraZoom - window.innerWidth), Math.min(0, cameraX)); 
            cameraY = Math.max(-(5000 * cameraZoom - window.innerHeight), Math.min(0, cameraY));
            if (window.isTacticalMode) { 
                let charScreenX = window.globalPlayerX * cameraZoom + cameraX; 
                let charScreenY = window.globalPlayerY * cameraZoom + cameraY; 
                mouseOffsetX = screenMouseX - charScreenX; 
                mouseOffsetY = screenMouseY - charScreenY; 
            }
        }
    });

    setInterval(() => { 
        const pingDisplay = document.getElementById('ui-ping-display'); 
        if (pingDisplay && document.getElementById('toggle-ping').checked) { 
            pingDisplay.innerText = `Ping: ${Math.floor(Math.random() * 16) + 12} ms`; 
        } 
    }, 2500);

    let frames = 0; 
    let lastFpsTime = performance.now(); 
    let edgeScrollEnabled = true;
    const defaultSettings = { 'toggle-edge-scroll': true, 'toggle-cursor-ui': true, 'toggle-name': true, 'toggle-ping': false, 'toggle-fps': false, 'toggle-coords': false };

    function loadSettings() {
        for (let key in defaultSettings) {
            const el = document.getElementById(key);
            if (el) { 
                const saved = localStorage.getItem('ks_setting_' + key); 
                if (saved !== null) { el.checked = saved === 'true'; } else { el.checked = defaultSettings[key]; } 
                el.dispatchEvent(new Event('change')); 
            }
        }
    }

    document.getElementById('toggle-edge-scroll').addEventListener('change', (e) => { edgeScrollEnabled = e.target.checked; localStorage.setItem('ks_setting_toggle-edge-scroll', e.target.checked); });
    document.getElementById('toggle-cursor-ui').addEventListener('change', (e) => { ringsContainer.style.opacity = e.target.checked ? '0.6' : '0'; localStorage.setItem('ks_setting_toggle-cursor-ui', e.target.checked); });
    document.getElementById('toggle-name').addEventListener('change', (e) => { playerNameTag.style.opacity = e.target.checked ? '1' : '0'; localStorage.setItem('ks_setting_toggle-name', e.target.checked); });
    document.getElementById('toggle-ping').addEventListener('change', (e) => { document.getElementById('ui-ping-display').style.display = e.target.checked ? 'block' : 'none'; localStorage.setItem('ks_setting_toggle-ping', e.target.checked); });
    document.getElementById('toggle-fps').addEventListener('change', (e) => { document.getElementById('ui-fps-display').style.display = e.target.checked ? 'block' : 'none'; localStorage.setItem('ks_setting_toggle-fps', e.target.checked); });
    document.getElementById('toggle-coords').addEventListener('change', (e) => { document.getElementById('ui-coords-display').style.display = e.target.checked ? 'block' : 'none'; localStorage.setItem('ks_setting_toggle-coords', e.target.checked); });

    loadSettings();

    function isInSafezone() { 
        return window.globalPlayerX >= SAFEPAD.minX && window.globalPlayerX <= SAFEPAD.maxX && window.globalPlayerY >= SAFEPAD.minY && window.globalPlayerY <= SAFEPAD.maxY; 
    }

    const keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false };
    window.addEventListener('keydown', (e) => { if (document.activeElement === chatInput) return; const key = e.key.toLowerCase(); if (keys.hasOwnProperty(key)) keys[key] = true; });
    window.addEventListener('keyup', (e) => { if (document.activeElement === chatInput) return; const key = e.key.toLowerCase(); if (keys.hasOwnProperty(key)) keys[key] = false; });

    let isMouseOutside = false;
    document.addEventListener('mouseleave', () => { isMouseOutside = true; });
    document.addEventListener('mouseenter', (e) => { 
        if (isMouseOutside && !window.isTacticalMode && !window.isDead) { 
            let charScreenX = window.globalPlayerX * cameraZoom + cameraX; 
            let charScreenY = window.globalPlayerY * cameraZoom + cameraY; 
            mouseOffsetX = e.clientX - charScreenX; 
            mouseOffsetY = e.clientY - charScreenY; 
        }
        isMouseOutside = false; screenMouseX = e.clientX; screenMouseY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => { screenMouseX = e.clientX; screenMouseY = e.clientY; });

    window.addEventListener('playerRespawn', () => {
        window.teleportPlayer(2500, 2500);
        window.isTacticalMode = false; 
        playerCursor.style.opacity = "1"; 
        playerCursor.style.filter = "none"; 
        ringsContainer.style.opacity = document.getElementById('toggle-cursor-ui').checked ? "0.6" : "0";
        gameArea.style.cursor = "none"; 
        window.canDragMap = false; 
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault(); if (window.isDead) return;
        window.isTacticalMode = !window.isTacticalMode;
        if (window.isTacticalMode) {
            window.canDragMap = isInSafezone(); 
            playerCursor.style.opacity = "0.3"; 
            playerCursor.style.filter = "grayscale(100%)"; 
            ringsContainer.style.opacity = "0.1";
            gameArea.style.cursor = window.canDragMap ? "grab" : "default";
            if (!window.canDragMap) {
                const txt = document.createElement("div"); txt.innerText = "FREE MOUSE (MENUS & SKILLS)";
                Object.assign(txt.style, { position: "absolute", left: `${window.globalPlayerX}px`, top: `${window.globalPlayerY - 40}px`, color: "rgba(255,202,40,0.8)", fontWeight: "300", fontSize: "11px", letterSpacing: "1px", pointerEvents: "none", zIndex: "9999" });
                worldMap.appendChild(txt); setTimeout(() => txt.remove(), 1500);
            }
        } else {
            playerCursor.style.opacity = "1"; 
            playerCursor.style.filter = "none"; 
            ringsContainer.style.opacity = document.getElementById('toggle-cursor-ui').checked ? "0.6" : "0";
            gameArea.style.cursor = "none"; 
            window.canDragMap = false; 
            isDraggingMap = false; 
            let charScreenX = window.globalPlayerX * cameraZoom + cameraX; 
            let charScreenY = window.globalPlayerY * cameraZoom + cameraY;
            mouseOffsetX = screenMouseX - charScreenX; 
            mouseOffsetY = screenMouseY - charScreenY;
        }
    });

    gameArea.addEventListener('mousedown', (e) => {
        if (window.isTacticalMode && window.canDragMap && !window.isDead) {
            if (e.target.closest('.ui-window') || e.target.closest('.desktop-os-hud') || e.target.closest('.chat-container')) return; 
            if (e.button === 0) { isDraggingMap = true; dragStartXMap = e.clientX; dragStartYMap = e.clientY; dragStartCamX = cameraX; dragStartCamY = cameraY; gameArea.style.cursor = "grabbing"; e.stopPropagation(); }
        }
    }, true);
    window.addEventListener('mouseup', () => { if (isDraggingMap) { isDraggingMap = false; if (window.isTacticalMode && window.canDragMap) gameArea.style.cursor = "grab"; } });

    window.critGauge = 0; 

    function gameLoop() {
        if (window.isDead) {
            playerCursor.style.opacity = "0"; ringsContainer.style.opacity = "0"; playerNameTag.style.opacity = "0";
            worldMap.style.transform = `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${cameraZoom})`;
            requestAnimationFrame(gameLoop); return; 
        } else {
            if (!window.isTacticalMode) { 
                playerCursor.style.opacity = "1"; 
                if (document.getElementById('toggle-name').checked) playerNameTag.style.opacity = "1"; 
            }
        }

        frames++; 
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            const fpsDisplay = document.getElementById('ui-fps-display');
            if (fpsDisplay && document.getElementById('toggle-fps').checked) { fpsDisplay.innerText = `FPS: ${frames}`; }
            frames = 0; lastFpsTime = now;
        }

        if (typeof window.playerCurrentHp !== 'undefined') {
            const hpText = document.getElementById('ui-hp-text'); 
            if (hpText) hpText.innerText = `${Math.floor(window.playerCurrentHp)} / ${window.playerMaxHp}`;
            const uiStatHp = document.getElementById('ui-stat-hp'); 
            if (uiStatHp) uiStatHp.innerText = `${Math.floor(window.playerCurrentHp)}/${window.playerMaxHp}`;
        }

        if (!window.isTacticalMode) {
            if (Math.abs(mouseOffsetX) > 0.5 || Math.abs(mouseOffsetY) > 0.5) {
                let lerpSpeed = 0.12; 
                let panX = mouseOffsetX * lerpSpeed; 
                let panY = mouseOffsetY * lerpSpeed;
                let testCamX = cameraX + panX; 
                let testCamY = cameraY + panY;
                let clampedPanX = Math.max(-(5000 * cameraZoom - window.innerWidth), Math.min(0, testCamX)); 
                let clampedPanY = Math.max(-(5000 * cameraZoom - window.innerHeight), Math.min(0, testCamY));
                let actualPanX = clampedPanX - cameraX; 
                let actualPanY = clampedPanY - cameraY;
                mouseOffsetX -= actualPanX; 
                mouseOffsetY -= actualPanY; 
                cameraX = clampedPanX; 
                cameraY = clampedPanY;
                if (Math.abs(actualPanX) < 0.1 && Math.abs(mouseOffsetX) > 0.5) mouseOffsetX *= 0.8;
                if (Math.abs(actualPanY) < 0.1 && Math.abs(mouseOffsetY) > 0.5) mouseOffsetY *= 0.8;
            } else { mouseOffsetX = 0; mouseOffsetY = 0; }

            let effectiveScreenX = screenMouseX - mouseOffsetX; 
            let effectiveScreenY = screenMouseY - mouseOffsetY;
            const edgeZoneX = window.innerWidth * 0.15; 
            const edgeZoneY = window.innerHeight * 0.15;
            const playableHeight = window.innerHeight - 120; 
            const edgeMaxSpeed = 16; 
            const keySpeed = 22; 
            let moveX = 0, moveY = 0;

            if (keys.w || keys.arrowup) moveY += keySpeed; 
            if (keys.s || keys.arrowdown) moveY -= keySpeed; 
            if (keys.a || keys.arrowleft) moveX += keySpeed; 
            if (keys.d || keys.arrowright) moveX -= keySpeed;
            
            if (edgeScrollEnabled) {
                if (effectiveScreenX < edgeZoneX) moveX += edgeMaxSpeed * (1 - (effectiveScreenX / edgeZoneX)); 
                else if (effectiveScreenX > window.innerWidth - edgeZoneX) moveX -= edgeMaxSpeed * (1 - ((window.innerWidth - effectiveScreenX) / edgeZoneX));
                
                if (effectiveScreenY < edgeZoneY) moveY += edgeMaxSpeed * (1 - (effectiveScreenY / edgeZoneY)); 
                else if (effectiveScreenY > playableHeight - edgeZoneY && effectiveScreenY < playableHeight) moveY -= edgeMaxSpeed * (1 - ((playableHeight - effectiveScreenY) / edgeZoneY)); 
                else if (effectiveScreenY >= playableHeight) moveY = 0; 
            }

            cameraX += moveX; cameraY += moveY;
            cameraX = Math.max(-(5000 * cameraZoom - window.innerWidth), Math.min(0, cameraX)); 
            cameraY = Math.max(-(5000 * cameraZoom - window.innerHeight), Math.min(0, cameraY));
            
            window.globalPlayerX = (screenMouseX - mouseOffsetX - cameraX) / cameraZoom; 
            window.globalPlayerY = (screenMouseY - mouseOffsetY - cameraY) / cameraZoom;
            
            cursorContainer.style.left = `${window.globalPlayerX}px`; 
            cursorContainer.style.top = `${window.globalPlayerY}px`;
            
            if (window.gameWs && window.gameWs.readyState === WebSocket.OPEN && (now - lastWsSend > 33)) { 
                window.gameWs.send(JSON.stringify({ type: 'move', x: window.globalPlayerX, y: window.globalPlayerY })); 
                lastWsSend = now; 
            }
        } else {
            let moveX = 0, moveY = 0; 
            const keySpeed = 22;
            if (window.canDragMap) {
                if (keys.w || keys.arrowup) moveY += keySpeed; 
                if (keys.s || keys.arrowdown) moveY -= keySpeed; 
                if (keys.a || keys.arrowleft) moveX += keySpeed; 
                if (keys.d || keys.arrowright) moveX -= keySpeed;
                if (moveX !== 0 || moveY !== 0) { cameraX += moveX; cameraY += moveY; }
                if (isDraggingMap) { 
                    cameraX = dragStartCamX + (screenMouseX - dragStartXMap); 
                    cameraY = dragStartCamY + (screenMouseY - dragStartYMap); 
                }
            }
            cameraX = Math.max(-(5000 * cameraZoom - window.innerWidth), Math.min(0, cameraX)); 
            cameraY = Math.max(-(5000 * cameraZoom - window.innerHeight), Math.min(0, cameraY));
        }

        if (document.getElementById('toggle-coords').checked) {
            const coordsDisplay = document.getElementById('ui-coords-display');
            if (coordsDisplay) coordsDisplay.innerText = `X: ${Math.round(window.globalPlayerX)} | Y: ${Math.round(window.globalPlayerY)}`;
        }

        worldMap.style.transform = `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${cameraZoom})`;

        const critRing = document.getElementById('player-crit-ring');
        if (critRing) {
            if (window.critGauge < 100) {
                window.critGauge = Math.min(100, window.critGauge + 0.15); 
                const percent = window.critGauge / 100;
                critRing.style.strokeDashoffset = 104.72 - (percent * 104.72);
                if (window.critGauge >= 100) { 
                    critRing.style.stroke = "rgba(255, 255, 255, 0.6)"; 
                    critRing.style.filter = "drop-shadow(0 0 4px rgba(255, 202, 40, 0.6))"; 
                } else { 
                    critRing.style.stroke = "rgba(255, 202, 40, 0.5)"; 
                    critRing.style.filter = "none"; 
                }
            } else { 
                critRing.style.strokeDashoffset = 0; 
            }
        }
        requestAnimationFrame(gameLoop);
    }
    
    function checkLevelUp() {
        let leveledUp = false;
        let earnedSkillPoints = 0;
        let earnedStatPoints = 0;
        
        while (window.playerXp >= window.playerNextLevelXp) {
            window.playerXp -= window.playerNextLevelXp; 
            window.playerLevel++; 
            window.playerNextLevelXp = window.xpTable[window.playerLevel] || 99999999999;
            window.playerMaxHp += 20; window.playerCurrentHp = window.playerMaxHp;
            window.playerMaxEnergy += 10; window.playerEnergy = window.playerMaxEnergy; 
            window.playerMaxMana += 10; window.playerMana = window.playerMaxMana;
            window.playerShield = 0; 
            earnedSkillPoints++;
            earnedStatPoints += 5;
            leveledUp = true;
        }
        
        if (leveledUp) {
            document.getElementById('ui-level-display').innerText = window.playerLevel;
            document.getElementById('ui-char-level').innerText = window.playerLevel;
            window.updateHealthBars(); window.updateEnergyUI(); window.updateMpUI();
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 50, "RACE LEVEL UP!", "#00e5ff");
            
            if (earnedSkillPoints > 0 || earnedStatPoints > 0) {
                fetch('backend/api_save_event.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'add_level_points', skill_points: earnedSkillPoints, stat_points: earnedStatPoints })
                }).catch(err => {});
            }
        }
        if (typeof window.updateXpUI === 'function') window.updateXpUI();
        return leveledUp;
    }
    window.checkLevelUp = checkLevelUp; 

    requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", bootCursorEngine);
} else {
    bootCursorEngine();
}