window.executeElfSkill = function(skill, pX, pY, totalDmg) {
    const elfSkills = ['True Shot', 'Guardian Fairy', 'Arrow Rain', 'Nature Sanctuary'];
    if (!elfSkills.includes(skill.skill_name)) return false;

    window.lastSkillTarget = null; 

    if (skill.skill_name === 'True Shot') {
        let targetMobId = null; let lowestHp = 9999999; let maxRange = 500; 

        for(let id in window.mobState) {
            let mob = window.mobState[id];
            let mX = mob.currentX + 30; let mY = mob.currentY + 30;
            let dist = Math.hypot(mX - pX, mY - pY);
            if(dist < maxRange && mob.hp < lowestHp) {
                lowestHp = mob.hp; targetMobId = id;
                window.lastSkillTarget = { x: mX, y: mY }; 
            }
        }

        if(targetMobId && window.combatWs && window.combatWs.readyState === WebSocket.OPEN) {
            window.combatWs.send(JSON.stringify({ type: 'attack_mob', id: targetMobId, damage: totalDmg * 1.8, pushX: 0, pushY: 0, isCrit: true, myTagId: window.myCombatTagId, pX: pX, pY: pY }));
        } else {
            window.showFloatingText(pX, pY - 30, "No visible target!", "#4caf50");
            return "ABORT"; 
        }
    }
    else if (skill.skill_name === 'Guardian Fairy') {
        if (window.elfFairyActive) {
            window.showFloatingText(pX, pY - 30, "Fairy already active!", "#fff"); return "ABORT";
        }

        window.elfFairyActive = true;
        let durationMs = 25000; 
        const map = document.getElementById('worldMap');
        
        const fada = document.createElement('div');
        fada.style.position = 'absolute';
        fada.style.width = '14px'; fada.style.height = '14px';
        fada.style.background = '#ffffff';
        fada.style.borderRadius = '50%';
        fada.style.boxShadow = '0 0 15px #fff, 0 0 30px #aeea00';
        fada.style.pointerEvents = 'none';
        fada.style.zIndex = '9005';
        fada.style.transform = 'translate(-50%, -50%)';

        const wingL = document.createElement('div');
        wingL.style.position = 'absolute';
        wingL.style.left = '-8px'; wingL.style.top = '0px';
        wingL.style.width = '10px'; wingL.style.height = '16px';
        wingL.style.background = 'rgba(174, 234, 0, 0.6)';
        wingL.style.borderRadius = '50% 0 50% 50%';
        wingL.style.transformOrigin = 'right center';
        wingL.animate([{transform: 'rotateY(0deg)'}, {transform: 'rotateY(60deg)'}], {duration: 100, iterations: Infinity, direction: 'alternate'});
        
        const wingR = document.createElement('div');
        wingR.style.position = 'absolute';
        wingR.style.right = '-8px'; wingR.style.top = '0px';
        wingR.style.width = '10px'; wingR.style.height = '16px';
        wingR.style.background = 'rgba(174, 234, 0, 0.6)';
        wingR.style.borderRadius = '0 50% 50% 50%';
        wingR.style.transformOrigin = 'left center';
        wingR.animate([{transform: 'rotateY(0deg)'}, {transform: 'rotateY(60deg)'}], {duration: 100, iterations: Infinity, direction: 'alternate'});

        fada.appendChild(wingL);
        fada.appendChild(wingR);
        map.appendChild(fada);

        let fX = pX; let fY = pY - 50; 
        let lastAtkTime = performance.now();
        let lastStunTime = performance.now();
        window.showFloatingText(pX, pY - 50, "✨ Guardian Fairy!", "#aeea00");

        let fairyAI = setInterval(() => {
            if (window.isDead || !document.getElementById('worldMap').contains(fada)) {
                clearInterval(fairyAI); fada.remove(); window.elfFairyActive = false; return;
            }

            let targetId = null; let lowestHp = 999999;
            for(let id in window.mobState) {
                let mob = window.mobState[id]; if(mob.hp <= 0) continue;
                let distToPlayer = Math.hypot((mob.currentX+30) - window.globalPlayerX, (mob.currentY+30) - window.globalPlayerY);
                if(distToPlayer < 400 && mob.hp < lowestHp) { lowestHp = mob.hp; targetId = id; }
            }

            let destX = window.globalPlayerX + 40; 
            let destY = window.globalPlayerY - 40;
            
            if(targetId && window.mobState[targetId]) {
                let mob = window.mobState[targetId];
                destX = mob.currentX + 30; 
                destY = mob.currentY + 30;
                
                let distToMob = Math.hypot(destX - fX, destY - fY);
                let now = performance.now();
                let ws = window.gameWs || window.combatWs;
                
                if (distToMob < 70 && ws && ws.readyState === WebSocket.OPEN) {
                    if (now - lastAtkTime > 800) {
                        lastAtkTime = now;
                        ws.send(JSON.stringify({ type: 'attack_mob', id: targetId, damage: Math.max(1, Math.floor(totalDmg * 0.15)), pushX: 0, pushY: 0, isCrit: false, myTagId: window.myCombatTagId, pX: fX, pY: fY }));
                        
                        fada.animate([{transform: 'translate(-50%, -50%) scale(1.5)'}, {transform: 'translate(-50%, -50%) scale(1)'}], {duration: 150});

                        let cut = document.createElement('div');
                        cut.style.position = 'absolute'; cut.style.left = destX + 'px'; cut.style.top = destY + 'px';
                        cut.style.width = '30px'; cut.style.height = '2px';
                        cut.style.background = '#fff';
                        cut.style.boxShadow = '0 0 8px #aeea00'; cut.style.pointerEvents = 'none'; cut.style.zIndex = '9006';
                        let angle = Math.random() * 360;
                        cut.animate([
                            {transform: `translate(-50%, -50%) rotate(${angle}deg) scaleX(0.2)`, opacity: 1},
                            {transform: `translate(-50%, -50%) rotate(${angle}deg) scaleX(1.5)`, opacity: 0}
                        ], {duration: 200});
                        map.appendChild(cut);
                        setTimeout(() => cut.remove(), 200);
                    }
                    if (now - lastStunTime > 5000) {
                        lastStunTime = now;
                        ws.send(JSON.stringify({ type: 'attack_mob', id: targetId, damage: Math.floor(totalDmg * 0.5), pushX: 0, pushY: 0, isCrit: true, myTagId: window.myCombatTagId, pX: fX, pY: fY, stunMs: 2000 }));
                        window.showFloatingText(destX, destY - 30, "✨ STUN!", "#fff");
                    }
                }
            }

            fX += (destX - fX) * 0.08; 
            fY += (destY - fY) * 0.08;
            fada.style.left = fX + 'px';
            fada.style.top = fY + 'px';

            if (Math.random() > 0.4) { 
                let dust = document.createElement('div');
                dust.style.position = 'absolute'; dust.style.left = (fX + (Math.random()-0.5)*20) + 'px'; dust.style.top = fY + 'px';
                dust.style.width = '3px'; dust.style.height = '3px';
                dust.style.background = '#eaffb0';
                dust.style.borderRadius = '50%';
                dust.style.pointerEvents = 'none';
                dust.style.zIndex = '8999';
                let driftX = (Math.random()-0.5) * 20;
                dust.animate([
                    {transform: 'translate(0, 0)', opacity: 1}, 
                    {transform: `translate(${driftX}px, 30px)`, opacity: 0}
                ], {duration: 800 + Math.random()*400});
                map.appendChild(dust);
                setTimeout(() => dust.remove(), 1200);
            }

        }, 33); 

        setTimeout(() => {
            clearInterval(fairyAI);
            fada.animate([{opacity: 1}, {opacity: 0}], {duration: 500, fill: 'forwards'});
            setTimeout(() => { fada.remove(); window.elfFairyActive = false; }, 500);
        }, durationMs);
    }
    else if (skill.skill_name === 'Arrow Rain') {
        let duration = 4000; let tickRate = 500; 
        let ticks = duration / tickRate; let currentTick = 0;
        let castX = pX; let castY = pY; 
        let dotInterval = setInterval(() => {
            currentTick++; window.damageAoE(castX, castY, 220, Math.floor(totalDmg * 0.4)); 
            if (currentTick >= ticks) clearInterval(dotInterval);
        }, tickRate);
    }
    else if (skill.skill_name === 'Nature Sanctuary') {
        let duration = 5000; let tickRate = 1000; 
        let ticks = duration / tickRate; let currentTick = 0;
        let healAmount = 15 + (window.playerMaxHp * 0.05);
        let healInterval = setInterval(() => {
            currentTick++;
            window.playerCurrentHp = Math.min(window.playerMaxHp, window.playerCurrentHp + healAmount);
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 20, `+${Math.floor(healAmount)}`, "#00e676");
            window.updateHealthBars();
            if (currentTick >= ticks) clearInterval(healInterval);
        }, tickRate);
    }
    return true; 
};