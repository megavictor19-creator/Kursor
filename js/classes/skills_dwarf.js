window.dwarfChains = []; 
window.dwarfChainBuffActive = false;

window.executeDwarfSkill = function(skill, pX, pY, totalDmg) {
    const dwarfSkills = ['Forge Chains', 'Relentless Pull', 'Seismic Anvil', 'Magma Armor'];
    if (!dwarfSkills.includes(skill.skill_name)) return false;

    let ws = window.gameWs || window.combatWs;

    if (skill.skill_name === 'Forge Chains') {
        window.dwarfChainBuffActive = true;
        window.showFloatingText(pX, pY - 30, "TETHER ACTIVATED!", "#ffae00");
        
        setTimeout(() => {
            window.dwarfChainBuffActive = false;
            window.dwarfChains = []; 
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "Tether Broken!", "#888");
        }, 10000);
    }
    else if (skill.skill_name === 'Relentless Pull') {
        if (window.dwarfChains.length === 0) {
            window.showFloatingText(pX, pY - 30, "No one tethered!", "#ff4444");
            return "ABORT";
        }

        window.dwarfChains.forEach(mobId => {
            if (window.mobState[mobId] && ws && ws.readyState === WebSocket.OPEN) {
                let mX = window.mobState[mobId].currentX + 30;
                let mY = window.mobState[mobId].currentY + 30;
                let angle = Math.atan2(pY - mY, pX - mX);
                
                let pullX = Math.cos(angle) * 400; 
                let pullY = Math.sin(angle) * 400;

                ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: totalDmg, pushX: pullX, pushY: pullY, isCrit: true, myTagId: window.myCombatTagId, pX: pX, pY: pY }));
            }
        });

        if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(pX, pY, 'Relentless Pull');
        window.dwarfChains = [];
    }
    else if (skill.skill_name === 'Seismic Anvil') {
        let radius = 220; 
        for (let mobId in window.mobState) {
            let mCenterX = window.mobState[mobId].currentX + 30; let mCenterY = window.mobState[mobId].currentY + 30;
            let distance = Math.hypot(pX - mCenterX, pY - mCenterY);
            if (distance <= radius && ws) {
                ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: totalDmg, pushX: 0, pushY: 0, isCrit: true, myTagId: window.myCombatTagId, pX: pX, pY: pY, stunMs: 3500 }));
            }
        }
    }
    else if (skill.skill_name === 'Magma Armor') {
        let healAmount = window.playerMaxHp * 0.30;
        window.playerCurrentHp = Math.min(window.playerMaxHp, window.playerCurrentHp + healAmount);
        window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `+${Math.floor(healAmount)}`, "#ff5722");
        window.updateHealthBars();

        let ticks = 0;
        let magmaInterval = setInterval(() => {
            ticks++;
            window.damageAoE(window.globalPlayerX, window.globalPlayerY, 150, Math.floor(totalDmg * 0.4)); 
            
            if (ticks >= 12) clearInterval(magmaInterval); 
        }, 500);
    }

    return true; 
};

setInterval(() => {
    if (window.isDead || !window.playerData || window.playerData.race !== 'Dwarf') return;
    let ws = window.gameWs || window.combatWs;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    let pX = window.globalPlayerX; let pY = window.globalPlayerY;

    if (window.dwarfChainBuffActive && window.dwarfChains.length < 6) {
        for (let mobId in window.mobState) {
            if (window.dwarfChains.includes(mobId) || window.mobState[mobId].hp <= 0) continue;
            let mX = window.mobState[mobId].currentX + 30; let mY = window.mobState[mobId].currentY + 30;
            let dist = Math.hypot(pX - mX, pY - mY);
            
            if (dist < 100) {
                window.dwarfChains.push(mobId);
                ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: 1, pushX: 0, pushY: 0, isCrit: false, myTagId: window.myCombatTagId, pX: pX, pY: pY }));
                if(window.dwarfChains.length >= 6) break; 
            }
        }
    }

    window.dwarfChains = window.dwarfChains.filter(id => window.mobState[id] && window.mobState[id].hp > 0);

    window.dwarfChains.forEach(mobId => {
        let mX = window.mobState[mobId].currentX + 30; let mY = window.mobState[mobId].currentY + 30;
        let dist = Math.hypot(pX - mX, pY - mY);

        if (dist > 180) {
            let angle = Math.atan2(pY - mY, pX - mX);
            let force = (dist - 180) * 0.8; 
            ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: 0, pushX: Math.cos(angle) * force, pushY: Math.sin(angle) * force, isCrit: false, myTagId: window.myCombatTagId, pX: pX, pY: pY }));
        }
    });

    let slot3 = document.getElementById('skill-3');
    if (slot3) {
        let badge = document.getElementById('dwarf-chain-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'dwarf-chain-badge';
            Object.assign(badge.style, { position: 'absolute', top: '-5px', right: '-5px', background: '#ffae00', color: '#000', fontWeight: 'bold', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', zIndex: '20' });
            slot3.appendChild(badge);
        }
        badge.innerText = window.dwarfChains.length;
        badge.style.display = window.dwarfChains.length > 0 ? 'block' : 'none';
    }

}, 100);