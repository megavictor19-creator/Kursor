window.humanWhirlwindActive = false;
window.humanWhirlwindInterval = null;

window.executeHumanSkill = function(skill, pX, pY, totalDmg) {
    const humanSkills = ['Shield Strike', 'Orbital Blades', 'Aegis Shield', 'Heroic Taunt'];
    if (!humanSkills.includes(skill.skill_name)) return false;

    let ws = window.gameWs || window.combatWs;

    if (skill.skill_name === 'Shield Strike') {
        let targetMobId = null; let minDist = 450; 
        for(let id in window.mobState) {
            let mX = window.mobState[id].currentX + 30; let mY = window.mobState[id].currentY + 30;
            let dist = Math.hypot(mX - pX, mY - pY);
            if(dist < minDist) { minDist = dist; targetMobId = id; }
        }
        
        if(targetMobId && ws && ws.readyState === WebSocket.OPEN) {
            let tMob = window.mobState[targetMobId];
            
            let angle = Math.atan2((tMob.currentY + 30) - pY, (tMob.currentX + 30) - pX);
            let pushForce = 120; 
            let pushX = Math.cos(angle) * pushForce;
            let pushY = Math.sin(angle) * pushForce;
            
            ws.send(JSON.stringify({ type: 'attack_mob', id: targetMobId, damage: totalDmg * 1.5, pushX: pushX, pushY: pushY, isCrit: true, myTagId: window.myCombatTagId, pX: pX, pY: pY, stunMs: 1500 }));
            window.showFloatingText(tMob.currentX + 30, tMob.currentY, "DEF -15%", "#ffca28");
            
            if(typeof window.triggerSkillEffect === 'function') {
                window.triggerSkillEffect(pX, pY, 'Shield Strike_Throw', tMob.currentX + 30, tMob.currentY + 30);
            }
        } else {
            window.showFloatingText(pX, pY - 30, "No visible target!", "#fff");
            return "ABORT"; 
        }
    }
    else if (skill.skill_name === 'Orbital Blades') {
        if (window.humanWhirlwindActive) {
            window.humanWhirlwindActive = false;
            clearInterval(window.humanWhirlwindInterval);
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "Blades Retracted", "#aaa");
            if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(pX, pY, 'Blades_Off');
            return true;
        }

        window.humanWhirlwindActive = true;
        window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "Orbital Blades!", "#e0e0e0");
        if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(pX, pY, 'Blades_On');

        window.humanWhirlwindInterval = setInterval(() => {
            if (window.isDead || !window.humanWhirlwindActive || window.playerMana < 8) {
                window.humanWhirlwindActive = false;
                clearInterval(window.humanWhirlwindInterval);
                if(window.playerMana < 8) window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "No Mana!", "#00d4ff");
                if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(window.globalPlayerX, window.globalPlayerY, 'Blades_Off');
                return;
            }

            window.playerMana -= 8;
            window.updateMpUI();

            let radius = 160;
            let pGX = window.globalPlayerX; let pGY = window.globalPlayerY;
            
            for (let mobId in window.mobState) {
                let mX = window.mobState[mobId].currentX + 30; let mY = window.mobState[mobId].currentY + 30;
                let dist = Math.hypot(pGX - mX, pGY - mY);
                if (dist <= radius && ws && window.mobState[mobId].hp > 0) {
                    ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: Math.floor(totalDmg * 0.3), pushX: 0, pushY: 0, isCrit: false, myTagId: window.myCombatTagId, pX: pGX, pY: pGY }));
                    if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(mX, mY, 'Bleed_Tick');
                }
            }
        }, 500); 
    }
    else if (skill.skill_name === 'Aegis Shield') {
        let shieldAmount = Math.floor(50 + (window.playerMaxHp * 0.15));
        window.playerShield = shieldAmount;
        window.showFloatingText(pX, pY - 20, `🛡️ +${shieldAmount} SHIELD`, "#00bfff");
        window.updateHealthBars();
    }
    else if (skill.skill_name === 'Heroic Taunt') {
        let radius = 350; 
        for (let mobId in window.mobState) {
            let mX = window.mobState[mobId].currentX + 30; let mY = window.mobState[mobId].currentY + 30;
            let dist = Math.hypot(pX - mX, pY - mY);
            if (dist <= radius && ws) {
                let angle = Math.atan2(pY - mY, pX - mX);
                let pullX = Math.cos(angle) * 180; let pullY = Math.sin(angle) * 180; 
                ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: 1, pushX: pullX, pushY: pullY, isCrit: false, myTagId: window.myCombatTagId, pX: pX, pY: pY }));
            }
        }
    }

    return true; 
};