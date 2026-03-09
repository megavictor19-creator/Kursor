window.executeOrcSkill = function(skill, pX, pY, totalDmg) {
    const orcSkills = ['Heavy Strike', 'Battle Cry', 'Brutal Charge', 'Earthquake', 'Whirlwind'];
    
    if (!orcSkills.includes(skill.skill_name)) return false;

    if (skill.skill_name === 'Battle Cry') {
        let healAmount = 25 + (window.playerMaxHp * 0.10);
        window.playerCurrentHp = Math.min(window.playerMaxHp, window.playerCurrentHp + healAmount);
        window.showFloatingText(pX, pY, `+${Math.floor(healAmount)}`, "#00e676");
        window.updateHealthBars();
        
        window.attackSpeedBuff = true;
        window.showFloatingText(pX, pY - 20, "FURY!", "#ffca28");
        setTimeout(() => { window.attackSpeedBuff = false; }, 5000); 
    }
    else if (skill.skill_name === 'Brutal Charge') {
        let closestMobId = null; let minDist = 350;
        
        for(let id in window.mobState) {
            let dist = Math.hypot((window.mobState[id].currentX + 30) - pX, (window.mobState[id].currentY + 30) - pY);
            if(dist < minDist) { minDist = dist; closestMobId = id; }
        }
        
        if(closestMobId) {
            let targetX = window.mobState[closestMobId].currentX + 15;
            let targetY = window.mobState[closestMobId].currentY + 15;

            for(let i=1; i<=3; i++) {
                setTimeout(() => {
                    let ghost = document.createElement("img");
                    ghost.src = document.getElementById('player-avatar').src;
                    Object.assign(ghost.style, { position: "absolute", left: (pX + (targetX - pX)*(i/3)) + "px", top: (pY + (targetY - pY)*(i/3)) + "px", width: "45px", height: "45px", objectFit: "contain", opacity: "0.5", filter: "sepia(1) hue-rotate(-50deg) saturate(5) blur(1px)", pointerEvents: "none", zIndex: "9900", transition: "transform 0.3s, opacity 0.3s" });
                    document.getElementById('worldMap').appendChild(ghost);
                    requestAnimationFrame(() => { ghost.style.transform = "scale(1.5)"; ghost.style.opacity = "0"; });
                    setTimeout(() => ghost.remove(), 300);
                }, i * 30);
            }

            let startX = pX; let startY = pY;
            let durationMs = 250; 
            let startTime = performance.now();

            function dashAnim(currentTime) {
                let elapsed = currentTime - startTime;
                let progress = Math.min(elapsed / durationMs, 1);
                
                let easeOut = 1 - Math.pow(1 - progress, 3); 
                
                let curX = startX + (targetX - startX) * easeOut;
                let curY = startY + (targetY - startY) * easeOut;
                
                if(typeof window.teleportPlayer === 'function') {
                    window.teleportPlayer(curX, curY);
                } else {
                    window.globalPlayerX = curX; window.globalPlayerY = curY;
                }

                if (progress < 1) {
                    requestAnimationFrame(dashAnim); 
                } else {
                    if (window.combatWs && window.combatWs.readyState === WebSocket.OPEN) {
                        window.combatWs.send(JSON.stringify({ type: 'attack_mob', id: closestMobId, damage: totalDmg * 1.5, pushX: 0, pushY: 0, isCrit: true, myTagId: window.myCombatTagId, pX: targetX, pY: targetY }));
                    }
                }
            }
            requestAnimationFrame(dashAnim); 

        } else {
            window.showFloatingText(pX, pY - 30, "No target!", "#ff4444");
            return "ABORT"; 
        }
    }
    else if (skill.skill_name === 'Earthquake') {
        let radius = 280; 
        for (let mobId in window.mobState) {
            let mCenterX = window.mobState[mobId].currentX + 30; let mCenterY = window.mobState[mobId].currentY + 30;
            let distance = Math.hypot(pX - mCenterX, pY - mCenterY);
            if (distance <= radius) {
                if (window.combatWs && window.combatWs.readyState === WebSocket.OPEN) {
                    window.combatWs.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: totalDmg, pushX: 0, pushY: 0, isCrit: false, myTagId: window.myCombatTagId, pX: pX, pY: pY, stunMs: 3000 }));
                }
            }
        }
    }
    else if (skill.skill_name === 'Whirlwind') {
        window.damageAoE(pX, pY, 180, totalDmg * 1.5);
    }
    else if (skill.skill_name === 'Heavy Strike') {
        window.damageAoE(pX, pY, 130, totalDmg);
    }

    return true; 
};