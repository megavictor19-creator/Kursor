if(!document.getElementById('ks-rainbow-css')) {
    let style = document.createElement('style');
    style.id = 'ks-rainbow-css';
    style.innerHTML = `@keyframes ks-rainbow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .rainbow-text { background: linear-gradient(90deg, #ff4444, #ffca28, #00e676, #00bfff, #b388ff, #ff4444); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: ks-rainbow 3s linear infinite; font-weight: bold; }`;
    document.head.appendChild(style);
}

window.renderCharacterSheet = function() {
    if (!window.playerData) return;

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

    // Equipment slots
    const eqCats   = ['pet','wing','aura','trail','halo'];
    const eqIcons  = { pet:'🐲', wing:'🪽', aura:'✨', trail:'☄️', halo:'💫' };
    const eqLabels = { pet:'Pet', wing:'Wing', aura:'Aura', trail:'Trail', halo:'Halo' };
    const equippedItems = (window._lastInventory || []).filter(i => parseInt(i.is_equipped) === 1);

    const equipSlotsHtml = eqCats.map(cat => {
        const found    = equippedItems.find(i => (i.category||'').toLowerCase().replace(/s$/,'') === cat);
        const iconPath = found ? (found.icon_path || '') : '';
        const label    = found ? found.item_name + ' (' + found.rarity + ')' : eqLabels[cat];
        const itemId   = found ? found.id : '';
        const hasBorder = found ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)';
        const inner    = iconPath
            ? '<img src="' + iconPath + '" style="width:78%;height:78%;object-fit:contain;pointer-events:none;" onerror="this.src=\'img/items/default.png\'">'
            : '<span style="opacity:0.15;font-size:20px;pointer-events:none;">' + eqIcons[cat] + '</span>';
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">'
             + '<div class="char-eq-slot" data-eq-cat="' + cat + '" data-item-id="' + itemId + '" title="' + label + '" style="width:48px;height:48px;border-radius:7px;background:rgba(0,0,0,0.3);display:flex;justify-content:center;align-items:center;position:relative;border:1px dashed ' + hasBorder + ';cursor:default;" ondragover="event.preventDefault()" ondragenter="this.style.borderColor=\'rgba(0,229,255,0.6)\'" ondragleave="this.style.borderColor=\'' + hasBorder + '\'" ondrop="window._charSheetEquipDrop(event,this)">'
             + inner + '</div>'
             + '<span style="font-size:8px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.5px;">' + eqLabels[cat] + '</span>'
             + '</div>';
    }).join('');

    // Skills HTML
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

            let upBtn = (window.availableSkillPoints > 0) ? `<button onclick="window.upgradeSkill('${skill.skill_name}')" style="background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.4);color:#00e676;font-weight:bold;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;transition:0.2s;flex-shrink:0;">+</button>` : '';
            let typeColor = skill.skill_type === 'Passive' ? '#4caf50' : '#00e5ff';
            let statsText = skill.skill_type === 'Active'
                ? `<span style="color:#00bfff;">MP: ${actualMana}</span> <span style="color:rgba(255,255,255,0.35);">CD: ${skill.cooldown_ms/1000}s</span> <span style="color:#ff6666;">Dmg: ${actualDmg > 0 ? actualDmg : '-'}</span>`
                : `<span style="color:#4caf50;">Passive</span>`;

            skillsHtml += `
                <div style="display:flex;align-items:flex-start;background:rgba(255,255,255,0.02);padding:8px;border-radius:6px;margin-bottom:5px;gap:9px;">
                    <img src="${skill.icon_path}" style="width:34px;height:34px;border-radius:4px;object-fit:cover;flex-shrink:0;opacity:0.85;">
                    <div style="flex-grow:1;display:flex;flex-direction:column;line-height:1.3;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:12px;color:#ddd;font-weight:bold;">${skill.skill_name} <span style="color:${typeColor};font-size:10px;margin-left:3px;">[Lv.${sLevel}]</span></span>
                            ${upBtn}
                        </div>
                        <div style="font-size:10px;color:rgba(150,165,185,0.7);margin:2px 0 3px 0;">${skill.description}</div>
                        <div style="font-size:9px;display:flex;gap:8px;font-weight:bold;">${statsText}</div>
                    </div>
                </div>
            `;
        });
    }

    const container = document.querySelector('#window-character .window-content');
    if (!container) return;

    // Bloco de seção reutilizável — sem borda, fundo muito leve
    const sec = (content, extraStyle='') =>
        `<div style="background:rgba(0,0,0,0.18);border-radius:8px;padding:10px;${extraStyle}">${content}</div>`;

    const secHead = (label, right='') =>
        `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:rgba(180,190,200,0.6);font-size:10px;text-transform:uppercase;letter-spacing:1px;">${label}</span>
            ${right}
        </div>`;

    let html = `
        <div style="display:flex;gap:14px;width:100%;box-sizing:border-box;align-items:flex-start;">

            <!-- ═══ Coluna ESQUERDA ═══ -->
            <div style="width:210px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;">

                <!-- Preview -->
                ${sec(`
                    <div style="text-align:center;">
                        <div style="margin:0 auto 8px auto;width:76px;height:76px;display:flex;align-items:center;justify-content:center;">
                            <img id="ui-preview-img" src="${p.sprite_path}" style="width:60px;height:60px;object-fit:contain;image-rendering:pixelated;border-radius:4px;">
                        </div>
                        <div style="color:rgba(0,229,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">${p.username}</div>
                        <div style="color:#ffca28;font-size:10px;font-weight:bold;margin-top:2px;">Lv. ${p.race_level || 1} ${p.race}</div>
                        <div style="color:rgba(255,255,255,0.3);font-size:9px;margin-top:3px;">XP: ${parseInt(p.race_xp||0)} / ${window.playerNextLevelXp || 0}</div>
                        <button class="menu-btn" style="margin-top:8px;padding:5px;font-size:10px;background:rgba(0,229,255,0.06);color:rgba(0,229,255,0.7);" onclick="window.openRaceModal()">Transmute Soul</button>
                    </div>
                `)}

                <!-- Combat Stats -->
                ${sec(`
                    ${secHead('Combat Stats')}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;font-size:11px;">
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.45);">Health</span><span style="color:#00e676;font-weight:bold;">${hp}</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.45);">Mana</span><span style="color:#5599ff;font-weight:bold;">${mp}</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.45);">Damage</span><span style="color:#ff5555;font-weight:bold;">${dmg}</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.45);">Kills</span><span style="color:rgba(255,255,255,0.8);font-weight:bold;">${p.kills || 0}</span></div>
                    </div>
                `)}

                <!-- Details -->
                ${sec(`
                    ${secHead('Details')}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;font-size:10px;">
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Crit</span><span style="color:#ffca28;font-weight:bold;">${cChance.toFixed(1)}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">C.Dmg</span><span style="color:#ffca28;font-weight:bold;">${cDmg}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Area</span><span style="color:#5599ff;font-weight:bold;">+${aDmg}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Target</span><span style="color:#b388ff;font-weight:bold;">+${sDmg}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Melee</span><span style="color:#ff5555;font-weight:bold;">+${melee}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Range</span><span style="color:#00e676;font-weight:bold;">+${range}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Resist</span><span style="color:#ff9800;font-weight:bold;">${resist.toFixed(1)}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Dodge</span><span style="color:#00e676;font-weight:bold;">${tDodge.toFixed(1)}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">Loot</span><span style="color:#ffca28;font-weight:bold;">+${loot}%</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.4);">XP</span><span style="color:#b388ff;font-weight:bold;">+${xp}%</span></div>
                    </div>
                `)}

                <!-- Attributes -->
                ${sec(`
                    ${secHead('Attributes', `<span style="font-size:10px;color:#fff;background:rgba(255,174,0,0.12);padding:2px 6px;border-radius:4px;border:1px solid rgba(255,174,0,0.3);font-weight:bold;">Pts: ${statPoints}</span>`)}
                    ${renderStatRow('Strength','STR',statSTR,statPoints>0,'#ff5555')}
                    ${renderStatRow('Dexterity','DEX',statDEX,statPoints>0,'#00e676')}
                    ${renderStatRow('Constitution','CON',statCON,statPoints>0,'#ff9800')}
                    ${renderStatRow('Intelligence','INT',statINT,statPoints>0,'#5599ff')}
                    ${renderStatRow('Wisdom','WIS',statWIS,statPoints>0,'#b388ff')}
                    ${renderStatRow('Charisma','CHA',statCHA,statPoints>0,'#ffca28')}
                `)}
            </div>

            <!-- ═══ Coluna DIREITA ═══ -->
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:250px;">

                <!-- FIX #1 — Equipment ACIMA das skills -->
                ${sec(`
                    ${secHead('Equipment', '<span style="font-size:9px;color:rgba(255,255,255,0.2);font-style:italic;">drag from bag</span>')}
                    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                        ${equipSlotsHtml}
                    </div>
                `)}

                <!-- Skills & Magic -->
                ${sec(`
                    ${secHead('Skills & Magic', `<span style="font-size:9px;color:rgba(255,255,255,0.4);">SP: <span style="color:#00e676;font-weight:bold;font-size:11px;">${window.availableSkillPoints}</span></span>`)}
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${skillsHtml}
                    </div>
                `, 'flex:1;')}

            </div>

        </div>
    `;

    container.innerHTML = html;
};


function renderStatRow(name, code, val, canUpgrade, color, disabled = false, isRainbow = false) {
    if (disabled && isRainbow) {
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:5px;background:rgba(255,255,255,0.015);border-radius:5px;padding:5px 6px;position:relative;overflow:hidden;" title="Aura — Special attribute. Coming soon.">
            <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,68,68,0.03),rgba(224,64,251,0.04),rgba(0,229,255,0.03));border-radius:5px;pointer-events:none;"></div>
            <span class="rainbow-text" style="width:40px;font-weight:bold;">AUR</span>
            <span style="flex:1;color:rgba(255,255,255,0.2);font-size:9px;letter-spacing:1.5px;text-align:center;font-style:italic;">COMING SOON</span>
            <span style="font-size:13px;opacity:0.35;" title="Locked">🔒</span>
        </div>`;
    }

    let btn = canUpgrade
        ? `<button onclick="window.allocateStat('${code.toLowerCase()}')" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#ccc;width:20px;height:20px;border-radius:4px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.18)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">+</button>`
        : `<div style="width:20px;"></div>`;
    if (disabled) btn = `<div style="width:20px;"></div>`;

    const valStr    = disabled ? '??' : val;
    const opacity   = disabled ? '0.4' : '1';
    const codeClass = isRainbow ? 'rainbow-text' : '';
    const valClass  = isRainbow ? 'rainbow-text' : '';
    const codeStyle = isRainbow ? `width:40px;` : `color:${color};width:40px;font-weight:bold;opacity:0.75;`;
    const valStyle  = isRainbow ? `font-family:'Courier New',monospace;font-size:13px;` : `color:${color};font-weight:bold;font-family:'Courier New',monospace;font-size:13px;`;

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:3px;opacity:${opacity};padding:2px 0;">
            <span class="${codeClass}" style="${codeStyle}" title="${name}">${code}</span>
            <span class="${valClass}" style="${valStyle}">${valStr}</span>
            ${btn}
        </div>
    `;
}

window.allocateStat = async function(statCode) {
    if (!window.playerData || parseInt(window.playerData.stat_points) <= 0) return;
    try {
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
            if (data.new_stat !== undefined) {
                window.playerData['stat_' + statCode] = data.new_stat;
                window.playerData.stat_points = data.stat_points;
            }
            window.renderCharacterSheet();
            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.fetchPlayerData === 'function') window.fetchPlayerData();
        } else {
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

(function() {
    let attempts = 0;
    const wait = setInterval(() => {
        attempts++;
        if (window.playerData) { clearInterval(wait); window.renderCharacterSheet(); }
        if (attempts > 60) clearInterval(wait);
    }, 100);
})();

// ============================================================
// DROP handler: item da bag → slot de equipment na char sheet
// ============================================================
window._charSheetEquipDrop = async function(event, slotEl) {
    event.preventDefault();
    slotEl.style.borderColor = 'rgba(255,255,255,0.06)';

    const itemId  = event.dataTransfer.getData('text/plain');
    const eqCat   = slotEl.dataset.eqCat;
    if (!itemId || !eqCat) return;

    const inventory = window._lastInventory || [];
    const item = inventory.find(i => String(i.id) === String(itemId));
    if (!item) return;

    const itemCat = (item.category || '').toLowerCase().replace(/s$/, '');
    if (itemCat !== eqCat) {
        slotEl.style.borderColor = 'rgba(255,60,60,0.6)';
        setTimeout(() => slotEl.style.borderColor = 'rgba(255,255,255,0.06)', 700);
        return;
    }

    try {
        const res = await fetch('backend/api_inventory.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'equip', item_id: itemId, slot: eqCat })
        });
        const data = await res.json();
        if (data.success) {
            if (typeof window.loadInventoryData === 'function') window.loadInventoryData();
            window.renderCharacterSheet();
        }
    } catch(e) {}
};
