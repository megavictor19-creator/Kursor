if(!document.getElementById('ks-rainbow-css')) {
    let style = document.createElement('style');
    style.id = 'ks-rainbow-css';
    style.innerHTML = `@keyframes ks-rainbow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .rainbow-text { background: linear-gradient(90deg, #ff4444, #ffca28, #00e676, #00bfff, #b388ff, #ff4444); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: ks-rainbow 3s linear infinite; font-weight: bold; }`;
    document.head.appendChild(style);
}

window.renderCharacterSheet = function() {
    const container = document.querySelector('#window-character .window-content');
    if (!container || !window.playerData) return;

    const eq = window.equipmentStats || {};
    const p = window.playerData;

    let statSTR = parseInt(p.stat_str) || 0;
    let statDEX = parseInt(p.stat_dex) || 0;
    let statCON = parseInt(p.stat_con) || 0;
    let statINT = parseInt(p.stat_int) || 0;
    let statWIS = parseInt(p.stat_wis) || 0;
    let statCHA = parseInt(p.stat_cha) || 0;
    let statAUR = parseInt(p.stat_aur) || 0;
    let statPoints = parseInt(p.stat_points) || 0;

    let strDmg = statSTR * 2; let strMelee = statSTR * 1;
    let dexRange = statDEX * 1; let dexCrit = statDEX * 0.5; let dexDodge = statDEX * 0.5;
    let conHp = statCON * 15; let conResist = statCON * 1;
    let intArea = statINT * 1; let intMp = statINT * 5;
    let wisSingle = statWIS * 1; let wisXp = statWIS * 1;
    let chaLoot = statCHA * 1; let chaSp = statCHA * 5;

    let vit = (parseInt(p.attr_vitality) || 0) + (eq.attr_vitality || 0);
    let pwr = (parseInt(p.attr_power) || 0) + (eq.attr_power || 0);
    let crit = (parseInt(p.attr_critical) || 0) + (eq.attr_critical || 0);
    let dodge = (parseInt(p.attr_dodge) || 0) + (eq.attr_dodge || 0);

    let hp = parseInt(p.max_hp) + (vit * 20) + (eq.max_hp || 0) + conHp;
    let dmg = 35 + (pwr * 3) + (eq.base_damage || 0) + strDmg;
    let cChance = (parseFloat(p.crit_chance) || 5.0) + (crit * 1.5) + dexCrit;
    let cDmg = 150 + ((parseInt(p.attr_critical_damage) || 0) + (eq.attr_critical_damage || 0)) * 5;
    let aDmg = ((parseInt(p.attr_area_damage) || 0) + (eq.attr_area_damage || 0)) * 2 + intArea;
    let sDmg = ((parseInt(p.attr_single_target) || 0) + (eq.attr_single_target || 0)) * 2 + wisSingle;
    let resist = ((parseInt(p.attr_resist) || 0) + (eq.attr_resist || 0)) * 1.5 + conResist;
    let loot = ((parseInt(p.attr_loot) || 0) + (eq.attr_loot || 0)) * 2 + chaLoot;
    let xp = ((parseInt(p.attr_xp_bonus) || 0) + (eq.attr_xp_bonus || 0)) * 2 + wisXp;
    let melee = ((parseInt(p.attr_melee) || 0) + (eq.attr_melee || 0)) * 2 + strMelee;
    let range = ((parseInt(p.attr_range) || 0) + (eq.attr_range || 0)) * 2 + dexRange;
    let mp = (parseInt(p.max_mana) || 100) + (eq.max_mana || 0) + intMp;
    let sp = (parseInt(p.max_energy) || 100) + (eq.max_energy || 0) + chaSp;
    let tDodge = dodge + dexDodge;

    let equippedHtml = '';
    {
        const eqCats = ['pet','wing','aura','trail','halo'];
        const eqIcons = { pet:'🐲', wing:'🪽', aura:'✨', trail:'☄️', halo:'💫' };
        const equippedItems = (p.inventory || []).filter(i => parseInt(i.is_equipped) === 1);
        equippedHtml = `
            <div style="margin-bottom:10px; border-bottom:1px dashed rgba(255,255,255,0.07); padding-bottom:10px;">
                <div style="font-size:9px; color:#8fa0b5; text-transform:uppercase; letter-spacing:1px; margin-bottom:7px;">Equipment</div>
                <div style="display:flex; gap:7px; justify-content:center;">
                    ${eqCats.map(cat => {
                        const found = equippedItems.find(i => (i.category||'').toLowerCase() === cat || (i.category||'').toLowerCase() === cat+'s');
                        const iconPath = found ? (found.icon_path || '') : '';
                        const label   = found ? found.item_name : eqIcons[cat];
                        const rarity  = found ? found.rarity.toLowerCase() : '';
                        const inner   = iconPath 
                            ? `<img src="${iconPath}" style="width:80%;height:80%;object-fit:contain;" onerror="this.src='img/items/default.png'">`
                            : `<span style="opacity:0.3;font-size:14px;">${eqIcons[cat]}</span>`;
                        return `<div title="${label}" style="width:36px;height:36px;border-radius:6px;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;position:relative;${rarity?'border:1px solid rgba(255,255,255,0.15)':'border:1px dashed rgba(255,255,255,0.08)'};">
                            ${inner}
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    let skillsHtml = '';
    window.availableSkillPoints = parseInt(p.skill_points) || 0;
    let skillLevels = {};
    try { skillLevels = JSON.parse(p.skill_levels_json || '{}'); } catch(e){}

    if (p.skills && p.skills.length > 0) {
        p.skills.forEach(skill => {
            let sLevel = skillLevels[skill.skill_name] || 1;
            let actualDmg = parseInt(skill.base_damage) || 0;
            let actualMana = parseInt(skill.mana_cost) || 0;
            
            if (skill.skill_type === 'Active') {
                if (actualDmg > 0) actualDmg += ((sLevel - 1) * 15);
                if (actualMana > 0) actualMana += ((sLevel - 1) * 2);
            }

            let upBtn = (window.availableSkillPoints > 0) ? `<button onclick="window.upgradeSkill('${skill.skill_name}')" style="background:rgba(0, 230, 118, 0.2); border:1px solid rgba(0, 230, 118, 0.5); color:#00e676; font-weight:bold; width:22px; height:22px; border-radius:4px; cursor:pointer; font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; padding:0; transition:0.2s; flex-shrink:0;">+</button>` : '';
            let typeColor = skill.skill_type === 'Passive' ? '#4caf50' : '#00e5ff';
            let statsText = skill.skill_type === 'Active' ? `<span style="color:#00bfff;">MP: ${actualMana}</span> <span style="color:#aaa;">CD: ${skill.cooldown_ms/1000}s</span> <span style="color:#ff4444;">Dmg: ${actualDmg > 0 ? actualDmg : '-'}</span>` : `<span style="color:#4caf50;">Passiva</span>`;

            skillsHtml += `
                <div style="display:flex; align-items:flex-start; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:6px; margin-bottom:6px; gap:10px;">
                    <img src="${skill.icon_path}" style="width:36px; height:36px; border-radius:4px; border:1px solid rgba(0,229,255,0.2); object-fit:cover; flex-shrink:0;">
                    <div style="flex-grow:1; display:flex; flex-direction:column; line-height:1.3;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:12px; color:#fff; font-weight:bold;">${skill.skill_name} <span style="color:${typeColor}; font-size:10px; margin-left:4px;">[Lv.${sLevel}]</span></span>
                            ${upBtn}
                        </div>
                        <div style="font-size:10px; color:#8fa0b5; margin-bottom:4px; margin-top:2px;">${skill.description}</div>
                        <div style="font-size:9px; display:flex; gap:10px; font-weight:bold;">
                            ${statsText}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    let html = `
        <div style="display: flex; gap: 15px; width: 100%; box-sizing: border-box; align-items: stretch;">
            
            <div style="width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;">
                <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <div class="char-preview-box" style="margin: 0 auto 10px auto; width: 80px; height: 80px;">
                        <img id="ui-preview-img" src="${p.sprite_path}" style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)); image-rendering: pixelated;">
                    </div>
                    <h2 style="color: #00e5ff; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">${p.username}</h2>
                    <div style="color: #ffca28; font-size: 10px; font-weight: bold; margin-top:2px;">Lv. ${p.race_level || 1} ${p.race}</div>
                    <div style="color: #aaa; font-size: 9px; margin-top:4px;">XP: ${parseInt(p.race_xp)} / ${window.playerNextLevelXp || 0}</div>
                    <button class="menu-btn" style="margin-top: 10px; padding: 6px; font-size: 10px; background: rgba(0, 229, 255, 0.1); border-color: rgba(0, 229, 255, 0.4); color: #00e5ff; font-weight:bold;" onclick="window.openRaceModal()">Transmute Soul</button>
                </div>

                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
                    <h3 style="color: #8fa0b5; font-size: 10px; margin-top: 0; margin-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px; text-transform:uppercase; letter-spacing:1px;">Combat Stats</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 11px;">
                        <div style="display:flex; justify-content:space-between;"><span>Health</span> <span style="color: #00e676; font-weight: bold;">${hp}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Mana</span> <span style="color: #00bfff; font-weight: bold;">${mp}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Energy</span> <span style="color: #ffca28; font-weight: bold;">${sp}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Damage</span> <span style="color: #ff4444; font-weight: bold;">${dmg}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Kills</span> <span style="color: #fff; font-weight: bold;">${p.kills || 0}</span></div>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
                    <h3 style="color: #8fa0b5; font-size: 10px; margin-top: 0; margin-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px; text-transform:uppercase; letter-spacing:1px;">Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 10px;">
                        <div style="display:flex; justify-content:space-between;"><span>Crit</span> <span style="color:#ffca28; font-weight:bold;">${cChance.toFixed(1)}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>C.Dmg</span> <span style="color:#ffca28; font-weight:bold;">${cDmg}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Area</span> <span style="color:#00bfff; font-weight:bold;">+${aDmg}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Target</span> <span style="color:#b388ff; font-weight:bold;">+${sDmg}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Melee</span> <span style="color:#ff4444; font-weight:bold;">+${melee}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Range</span> <span style="color:#00e676; font-weight:bold;">+${range}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Resist</span> <span style="color:#ff9800; font-weight:bold;">${resist.toFixed(1)}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Dodge</span> <span style="color:#00e676; font-weight:bold;">${tDodge.toFixed(1)}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>Loot</span> <span style="color:#ffca28; font-weight:bold;">+${loot}%</span></div>
                        <div style="display:flex; justify-content:space-between;"><span>XP</span> <span style="color:#b388ff; font-weight:bold;">+${xp}%</span></div>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                        <h3 style="color: #ffae00; font-size: 10px; margin: 0; text-transform:uppercase; letter-spacing:1px;">Attributes</h3>
                        <span style="font-size:10px; color:#fff; background:rgba(255,174,0,0.2); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,174,0,0.5); font-weight:bold;">Pts: ${statPoints}</span>
                    </div>
                    ${renderStatRow('Strength', 'STR', statSTR, statPoints > 0, '#ff4444')}
                    ${renderStatRow('Dexterity', 'DEX', statDEX, statPoints > 0, '#00e676')}
                    ${renderStatRow('Constitution', 'CON', statCON, statPoints > 0, '#ff9800')}
                    ${renderStatRow('Intelligence', 'INT', statINT, statPoints > 0, '#00bfff')}
                    ${renderStatRow('Wisdom', 'WIS', statWIS, statPoints > 0, '#b388ff')}
                    ${renderStatRow('Charisma', 'CHA', statCHA, statPoints > 0, '#ffca28')}
                    ${renderStatRow('Aura', 'AUR', statAUR, false, '#fff', true, true)}
                </div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; min-width: 260px; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; overflow: hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <h3 style="color: #8fa0b5; font-size: 10px; margin: 0; text-transform:uppercase; letter-spacing:1px;">Skills & Magic</h3>
                    <span style="font-size:9px; color:#aaa;">SP: <span style="color:#00e676; font-weight:bold; font-size:11px;">${window.availableSkillPoints}</span></span>
                </div>
                ${equippedHtml}
                <div style="overflow-y: auto; flex-grow: 1; padding-right: 5px; display: flex; flex-direction: column; gap: 6px;">
                    ${skillsHtml}
                </div>
            </div>

        </div>
    `;

    container.innerHTML = html;
};

function renderStatRow(name, code, val, canUpgrade, color, disabled = false, isRainbow = false) {
    // AUR — atributo especial bloqueado com visual diferenciado
    if (disabled && isRainbow) {
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px;background:rgba(255,255,255,0.025);border-radius:6px;padding:5px 6px;position:relative;overflow:hidden;" title="Aura — Atributo especial. Disponível em breve.">
            <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,68,68,0.04),rgba(224,64,251,0.05),rgba(0,229,255,0.04));border-radius:6px;pointer-events:none;"></div>
            <span class="rainbow-text" style="width:40px;font-weight:bold;">AUR</span>
            <span style="flex:1;color:#555;font-size:9px;letter-spacing:1.5px;text-align:center;font-style:italic;">EM BREVE</span>
            <span style="font-size:13px;opacity:0.45;" title="Bloqueado">🔒</span>
        </div>`;
    }

    let btn = canUpgrade
        ? `<button onclick="window.allocateStat('${code.toLowerCase()}')" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);color:#fff;width:20px;height:20px;border-radius:4px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">+</button>`
        : `<div style="width:20px;"></div>`;
    if (disabled) btn = `<div style="width:20px;"></div>`;

    const valStr    = disabled ? '??' : val;
    const opacity   = disabled ? '0.5' : '1';
    const codeClass = isRainbow ? 'rainbow-text' : '';
    const valClass  = isRainbow ? 'rainbow-text' : '';
    const codeStyle = isRainbow ? `width:40px;` : `color:${color};width:40px;font-weight:bold;opacity:0.8;`;
    const valStyle  = isRainbow ? `font-family:'Courier New',monospace;font-size:13px;` : `color:${color};font-weight:bold;font-family:'Courier New',monospace;font-size:13px;`;

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:4px;opacity:${opacity};">
            <span class="${codeClass}" style="${codeStyle}" title="${name}">${code}</span>
            <span class="${valClass}" style="${valStyle}">${valStr}</span>
            ${btn}
        </div>
    `;
}

window.allocateStat = async function(statCode) {
    if (!window.playerData || parseInt(window.playerData.stat_points) <= 0) return;
    try {
        // Atualização otimista na interface para resposta imediata
        window.playerData.stat_points = parseInt(window.playerData.stat_points) - 1;
        window.playerData['stat_' + statCode] = (parseInt(window.playerData['stat_' + statCode]) || 0) + 1;
        window.renderCharacterSheet();
        
        let res = await fetch('backend/api_save_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'allocate_stat_point', stat: statCode })
        });
        let data = await res.json();
        
        if (data.success) {
            // Sincroniza com os dados reais do backend para evitar dessincronização
            if (data.new_stat !== undefined) {
                window.playerData['stat_' + statCode] = data.new_stat;
                window.playerData.stat_points = data.stat_points;
            }
            window.renderCharacterSheet();
            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            
            // Força a atualização dos dados do jogador na engine se a função existir
            if (typeof window.fetchPlayerData === 'function') window.fetchPlayerData();
        } else {
            // Reverte em caso de erro
            console.error("Erro ao alocar ponto:", data.error);
            window.playerData.stat_points = parseInt(window.playerData.stat_points) + 1;
            window.playerData['stat_' + statCode] = (parseInt(window.playerData['stat_' + statCode]) || 0) - 1;
            window.renderCharacterSheet();
        }
    } catch(e) {
        console.error("Falha de comunicação com o servidor:", e);
    }
};

window.upgradeSkill = async function(skillName) {
    if (!window.playerData || parseInt(window.playerData.skill_points) <= 0) return;
    try {
        let res = await fetch('backend/api_save_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'upgrade_skill', skill_name: skillName })
        });
        let data = await res.json();
        
        if (data.success) {
            window.playerData.skill_points = data.skill_points !== undefined ? data.skill_points : parseInt(window.playerData.skill_points) - 1;
            if (data.skill_levels_json) {
                window.playerData.skill_levels_json = data.skill_levels_json;
            }
            
            window.renderCharacterSheet();
            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.fetchPlayerData === 'function') window.fetchPlayerData();
        } else {
            console.error("Erro ao melhorar habilidade:", data.error);
        }
    } catch(e) {
        console.error("Falha de comunicação com o servidor:", e);
    }
};

// Render inicial on-demand — sem setInterval custoso
(function() {
    let attempts = 0;
    const wait = setInterval(() => {
        attempts++;
        if (window.playerData) { clearInterval(wait); window.renderCharacterSheet(); }
        if (attempts > 60) clearInterval(wait);
    }, 100);
})();