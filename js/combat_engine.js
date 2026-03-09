// js/combat_engine.js
window.mobState = {};
window.mobCacheDOM = {};
window.combatWs = null; 
window.myCombatTagId = Math.random().toString(36).substring(2, 10);

window.playerEnergy = 100; window.playerMaxEnergy = 100;
window.isDead = false; window.skillCooldowns = {}; 
window.attackSpeedBuff = false; 

window.lastHopeUsed = false;
window.isInvulnerable = false;
window.playerShield = 0;
window.playerBaseDamage = 35; 

window.updatePlayerHpRing = function(currentHp, maxHp, shield = 0) {
    const hpRing = document.getElementById('player-hp-ring');
    if (hpRing) {
        if (shield > 0) {
            hpRing.style.strokeDashoffset = 0; 
            hpRing.style.stroke = "rgba(0, 191, 255, 0.8)"; 
        } else {
            const percent = Math.max(0, currentHp / maxHp);
            hpRing.style.strokeDashoffset = 104.72 - (percent * 104.72);
            hpRing.style.stroke = percent < 0.3 ? "rgba(255, 68, 68, 0.7)" : "rgba(0, 230, 118, 0.45)"; 
        }
    }
};

function bootCombatEngine() {
    const worldMap = document.getElementById("worldMap");
    const gameArea = document.getElementById("gameArea"); 
    
    let lastAttackTime = 0; 
    let attackCooldownMs = 300; 

    window.updateEnergyUI = function() {
        const eText = document.getElementById('ui-energy-text'); if(eText) eText.innerText = Math.floor(window.playerEnergy);
        const lootEnergy = document.getElementById('loot-energy-display'); if(lootEnergy) lootEnergy.innerText = `EP ${Math.floor(window.playerEnergy)}`;
    };

    window.updateMpUI = function() {
        if(!window.playerMaxMana) return;
        const uiStatMp = document.getElementById('ui-stat-mp'); if(uiStatMp) uiStatMp.innerText = `${Math.floor(window.playerMana)}/${window.playerMaxMana}`;
        const bottomMpText = document.getElementById('ui-mp-text'); if(bottomMpText) bottomMpText.innerText = `${Math.floor(window.playerMana)} / ${window.playerMaxMana}`;
        const bottomMpFill = document.getElementById('bottom-mp-fill'); if(bottomMpFill) bottomMpFill.style.width = `${Math.max(0, (window.playerMana / window.playerMaxMana) * 100)}%`;
    };

    window.updateHealthBars = function() {
        if(!window.playerMaxHp) return;
        const bottomHpFill = document.getElementById('bottom-hp-fill'); 
        
        if(bottomHpFill) {
            bottomHpFill.style.width = `${(window.playerCurrentHp / window.playerMaxHp) * 100}%`;
            
            let container = bottomHpFill.parentElement;
            let shieldFill = document.getElementById('bottom-shield-fill');
            if(!shieldFill && container) {
                shieldFill = document.createElement('div');
                shieldFill.id = 'bottom-shield-fill';
                Object.assign(shieldFill.style, { position: 'absolute', top: '0', left: '0', height: '100%', background: 'rgba(0, 191, 255, 0.75)', transition: 'width 0.2s', zIndex: '2', pointerEvents: 'none' });
                container.appendChild(shieldFill);
            }
            
            if (shieldFill) {
                if (window.playerShield > 0) {
                    let pct = (window.playerShield / window.playerMaxHp) * 100;
                    shieldFill.style.width = `${Math.min(100, pct)}%`;
                    shieldFill.style.display = 'block';
                } else {
                    shieldFill.style.width = '0%';
                    shieldFill.style.display = 'none';
                }
            }
        }
        if(typeof window.updatePlayerHpRing === 'function') window.updatePlayerHpRing(window.playerCurrentHp, window.playerMaxHp, window.playerShield);
    };

    window.showFloatingText = function(x, y, text, color) {
        const txt = document.createElement("div"); txt.innerText = text;
        Object.assign(txt.style, { position: "absolute", left: "0", top: "0", transform: `translate3d(${x}px, ${y}px, 0)`, color: color, fontWeight: "bold", fontSize: "14px", fontFamily: "'Courier New', monospace", pointerEvents: "none", zIndex: "9999", textShadow: "1px 1px 0px #000", transition: "transform 1s ease-out, opacity 1s" });
        worldMap.appendChild(txt); 
        requestAnimationFrame(() => { txt.style.transform = `translate3d(${x}px, ${y-40}px, 0)`; txt.style.opacity = "0"; });
        setTimeout(() => txt.remove(), 1000);
    };

    window.combatWs = new WebSocket('ws://127.0.0.1:8080');
    window.combatWs.onopen = () => { window.combatWs.send(JSON.stringify({ type: 'request_mobs' })); };

    window.combatWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'init_mobs') { data.mobs.forEach(mob => createMonsterDOM(mob)); window.updateEnergyUI(); requestAnimationFrame(renderLoop); }
        if (data.type === 'mob_spawned') { createMonsterDOM(data.mob); }
        if (data.type === 'sync_mobs') {
            data.mobs.forEach(mobData => {
                if (window.mobState[mobData.id]) {
                    window.mobState[mobData.id].targetX = mobData.x; window.mobState[mobData.id].targetY = mobData.y;
                    if (window.mobState[mobData.id].hp !== mobData.hp) {
                        window.mobState[mobData.id].hp = mobData.hp;
                        const hpFill = window.mobCacheDOM[mobData.id].querySelector('.mob-hp-fill');
                        if(hpFill) hpFill.style.width = `${Math.max(0, (mobData.hp / mobData.maxHp) * 100)}%`;
                    }
                }
            });
        }
        if (data.type === 'play_effect') { 
            if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(data.x, data.y, data.effect, data.tX, data.tY); 
            
            if (data.effect === 'Aegis Shield') {
                let dist = Math.hypot(window.globalPlayerX - data.x, window.globalPlayerY - data.y);
                if (dist <= 250 && dist > 0) { 
                    let sVal = Math.floor(50 + (window.playerMaxHp * 0.15));
                    window.playerShield = sVal;
                    window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ +${sVal} ALLY SHIELD`, "#00bfff");
                    window.updateHealthBars();
                }
            }
        }

        if (data.type === 'mob_hit') {
            if (window.mobCacheDOM[data.id]) {
                const sprite = window.mobCacheDOM[data.id].querySelector('.mob-sprite');
                if (sprite) { sprite.style.filter = "brightness(2.0) drop-shadow(0 0 10px rgba(255,68,68,0.8))"; setTimeout(() => { if (sprite) sprite.style.filter = "none"; }, 150); }
                const txt = document.createElement("div"); txt.innerText = data.damage;
                let startX = window.mobState[data.id].currentX + 40; let startY = window.mobState[data.id].currentY - 10;
                
                if (data.isCrit) {
                    startX -= 10; startY -= 10;
                    Object.assign(txt.style, { position: "absolute", left: "0", top: "0", transform: `translate3d(${startX}px, ${startY}px, 0)`, color: "#ffca28", fontWeight: "bold", fontStyle: "italic", fontSize: "18px", fontFamily: "'Courier New', monospace", pointerEvents: "none", zIndex: "9999", textShadow: "2px 2px 0px #000", transition: "transform 0.6s ease-out, opacity 0.6s" });
                } else {
                    Object.assign(txt.style, { position: "absolute", left: "0", top: "0", transform: `translate3d(${startX}px, ${startY}px, 0)`, color: "rgba(255, 68, 68, 0.9)", fontWeight: "bold", fontSize: "14px", fontFamily: "'Courier New', monospace", pointerEvents: "none", zIndex: "9999", textShadow: "1px 1px 0px #000", transition: "transform 0.5s linear, opacity 0.5s" });
                }
                worldMap.appendChild(txt); 
                requestAnimationFrame(() => { txt.style.transform = `translate3d(${data.isCrit ? startX-10 : startX+10}px, ${startY-30}px, 0) scale(${data.isCrit ? 1.2 : 1})`; txt.style.opacity = "0"; });
                setTimeout(() => txt.remove(), 600);
            }
        }

        if (data.type === 'mob_attack_player') {
            const uiUserElement = document.getElementById('ui-username');
            if (uiUserElement) {
                const myUsername = uiUserElement.innerText.trim();
                if (data.targetUsername === myUsername) window.hurtPlayer(data.damage);
            }
        }

        if (data.type === 'mob_died') {
            if (window.mobCacheDOM[data.id]) {
                window.mobCacheDOM[data.id].style.transform = `translate3d(${window.mobState[data.id].currentX}px, ${window.mobState[data.id].currentY}px, 0) scale(0)`;
                setTimeout(() => { if (window.mobCacheDOM[data.id]) { window.mobCacheDOM[data.id].remove(); delete window.mobCacheDOM[data.id]; delete window.mobState[data.id]; } }, 200);

                if (data.tags.includes(window.myCombatTagId)) {
                    window.playerKills++; 
                    const uiKills = document.getElementById('ui-kills');
                    if (uiKills) uiKills.innerText = window.playerKills;
                    
                    let xpMultiplier = 1 + ((window.playerXpBonus || 0) / 100);
                    let gainedXp = Math.floor((data.expYield || 15) * xpMultiplier);
                    window.playerXp += gainedXp; 
                    
                    const uiCharXp = document.getElementById('ui-char-xp'); 
                    if (uiCharXp) uiCharXp.innerText = `${window.playerXp} / ${window.playerNextLevelXp}`;

                    if (typeof window.checkLevelUp === 'function') window.checkLevelUp();
                    if (typeof window.updateXpUI === 'function') window.updateXpUI();

                    sendRealTimeEvent({ event: 'update_stats', xp: window.playerXp, level: window.playerLevel, kills: window.playerKills, max_hp: window.playerMaxHp, current_hp: window.playerCurrentHp });
                    if (data.loot && data.loot.length > 0 && typeof spawnLootBag === 'function') spawnLootBag(data.x, data.y, data.loot);
                }
            }
        }
    };

    function createMonsterDOM(mobData) {
        if(window.mobCacheDOM[mobData.id]) return;
        const monster = document.createElement("div"); 
        monster.id = `mob_${mobData.id}`; monster.className = "monster";
        monster.style.position = "absolute"; monster.style.left = "0px"; monster.style.top = "0px";  
        
        let eliteTitleStyle = mobData.isElite ? "color: #ffca28; font-weight: 600; text-shadow: 1px 1px 0 #000;" : "color: #eee; text-shadow: 1px 1px 0 #000;";
        let spriteScale = mobData.isElite ? "scale(1.4)" : "scale(1)";
        let titlePrefix = mobData.isElite ? "★ " : "";

        monster.innerHTML = `
            <div style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-family: 'Courier New', monospace; pointer-events: none; z-index: 10; ${eliteTitleStyle}"><span style="color: #00e5ff; font-weight: bold;">[Lv.${mobData.level}]</span> ${titlePrefix}${mobData.name}</div>
            <div class="mob-hp-bar" style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 40px; height: 6px; background: #000; border: 1px solid #333; overflow: hidden; z-index: 5;"><div class="mob-hp-fill" style="width: 100%; height: 100%; background: #ff2a2a; transition: width 0.2s;"></div></div>
            <img src="${mobData.sprite_path}" class="mob-sprite" alt="${mobData.name}" style="transform: ${spriteScale}; transition: filter 0.2s; position: relative; z-index: 2; image-rendering: pixelated;">
        `;
        monster.style.transform = `translate3d(${mobData.x}px, ${mobData.y}px, 0)`;
        worldMap.appendChild(monster); 
        window.mobCacheDOM[mobData.id] = monster;
        window.mobState[mobData.id] = { currentX: mobData.x, currentY: mobData.y, targetX: mobData.x, targetY: mobData.y, hp: mobData.hp };
    }

    window.damageAoE = function(x, y, radius, dmg) {
        let ws = window.gameWs || window.combatWs; 
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        let areaMultiplier = 1 + ((window.playerAreaDamageBonus || 0) / 100);
        let finalDmg = Math.floor(dmg * areaMultiplier);

        for (let mobId in window.mobState) {
            let state = window.mobState[mobId]; 
            if(!state) continue;
            let mCenterX = state.currentX + 30; 
            let mCenterY = state.currentY + 30;
            let distance = Math.hypot(x - mCenterX, y - mCenterY);
            if (distance <= radius && state.hp > 0) {
                let angle = Math.atan2(mCenterY - y, mCenterX - x);
                let pushX = Math.cos(angle) * 40; 
                let pushY = Math.sin(angle) * 40; 
                ws.send(JSON.stringify({ type: 'attack_mob', id: mobId, damage: finalDmg, pushX: pushX, pushY: pushY, isCrit: false, myTagId: window.myCombatTagId, pX: x, pY: y }));
            }
        }
    };

    function isChatOpen() { return document.activeElement && document.activeElement.id === 'chat-input'; }

    window.doAutoAttack = function() {
        if (window.isTacticalMode || window.isDead || isChatOpen()) return; 
        
        const now = Date.now(); 
        let currentCooldown = window.attackSpeedBuff ? (attackCooldownMs / 2) : attackCooldownMs;
        if (now - lastAttackTime < currentCooldown) return; 
        lastAttackTime = now;
        
        const pGlobalX = window.globalPlayerX; 
        const pGlobalY = window.globalPlayerY;
        let ws = window.gameWs || window.combatWs;
        if (!ws) return;

        if(typeof window.triggerGroundHit === 'function') window.triggerGroundHit(pGlobalX, pGlobalY);
        
        let baseDmg = window.playerBaseDamage || 35;

        if (window.playerData && (window.playerData.race === 'Elf' || window.playerData.race === 'Elfo')) {
            let rangedRange = 400; 
            let targetMobId = null;
            let lowestHp = 999999999;
            let minDist = rangedRange + 10;

            for(let id in window.mobState) {
                let mob = window.mobState[id]; 
                if(!mob || mob.hp <= 0) continue;
                let mX = mob.currentX + 30; let mY = mob.currentY + 30;
                let dist = Math.hypot(mX - pGlobalX, mY - pGlobalY);
                
                if(dist <= rangedRange) {
                    if (mob.hp < lowestHp) { lowestHp = mob.hp; targetMobId = id; minDist = dist; } 
                    else if (mob.hp === lowestHp && dist < minDist) { targetMobId = id; minDist = dist; }
                }
            }

            if(targetMobId && ws.readyState === WebSocket.OPEN) {
                let tMob = window.mobState[targetMobId];
                let mCenterX = tMob.currentX + 30; let mCenterY = tMob.currentY + 30;
                let angle = Math.atan2(pGlobalY - mCenterY, pGlobalX - mCenterX);
                
                let pullForce = 70; 
                let pullX = Math.cos(angle) * pullForce; let pullY = Math.sin(angle) * pullForce;

                let singleTargetMultiplier = 1 + ((window.playerSingleTargetBonus || 0) / 100);
                let rangeMultiplier = 1 + ((window.playerRangeBonus || 0) / 100);
                let isCrit = Math.random() * 100 < (window.playerCritChance || 5);
                let elfFinalDmg = Math.floor(baseDmg * singleTargetMultiplier * rangeMultiplier);
                
                if (isCrit) {
                    elfFinalDmg = Math.floor(elfFinalDmg * ((window.playerCritDamage || 150) / 100));
                    if(typeof window.triggerCritSpark === 'function') window.triggerCritSpark(mCenterX, mCenterY);
                }

                ws.send(JSON.stringify({ type: 'attack_mob', id: targetMobId, damage: elfFinalDmg, pushX: pullX, pushY: pullY, isCrit: isCrit, myTagId: window.myCombatTagId, pX: pGlobalX, pY: pGlobalY }));
                if(typeof window.triggerElfRangedAttackFX === 'function') { window.triggerElfRangedAttackFX(pGlobalX, pGlobalY, mCenterX, mCenterY); }
            }
        } else {
            let meleeMultiplier = 1 + ((window.playerMeleeBonus || 0) / 100);
            let finalBaseDmg = Math.floor(baseDmg * meleeMultiplier);

            if (window.critGauge >= 100) {
                window.critGauge = 0; 
                if(typeof window.triggerCritSpark === 'function') window.triggerCritSpark(pGlobalX, pGlobalY);
                
                let critMultiplier = (window.playerCritDamage || 150) / 100;
                window.damageAoE(pGlobalX, pGlobalY, 140, Math.floor(finalBaseDmg * critMultiplier)); 
                
                if(window.playerMaxMana) {
                    let manaHeal = window.playerMaxMana * 0.15;
                    window.playerMana = Math.min(window.playerMaxMana, window.playerMana + manaHeal);
                    window.updateMpUI();
                    window.showFloatingText(pGlobalX, pGlobalY - 30, `+${Math.floor(manaHeal)} MP`, "#00d4ff");
                }
            } else {
                let critGain = 8;
                if (window.playerPassives && window.playerPassives.some(p => p.skill_name === 'Eagle Eyes' || p.skill_name === 'Olhos de Águia')) { critGain = 16; }
                if (window.critGauge < 100) window.critGauge = Math.min(100, window.critGauge + critGain); 
                
                window.damageAoE(pGlobalX, pGlobalY, 110, finalBaseDmg);
            }
        }
    };

    gameArea.addEventListener("mousedown", (e) => { if (e.button === 0) window.doAutoAttack(); });
    window.addEventListener('keydown', (e) => {
        if (isChatOpen() || window.isTacticalMode || window.isDead) return;
        const key = e.key;
        if (key === '1') window.doAutoAttack();
        else if (['2', '3', '4', '5'].includes(key)) castSkill(key);
    });

    function castSkill(key) {
        if (!window.playerSkills || !window.playerSkills[key]) return;
        const skill = window.playerSkills[key];

        if (window.skillCooldowns[key]) return;
        if (window.playerMana < skill.mana_cost) { window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "No Mana!", "#00d4ff"); return; }

        let pX = window.globalPlayerX; let pY = window.globalPlayerY;
        let totalDmg = (window.playerBaseDamage || 35) + parseInt(skill.base_damage || 0);
        let skillHandled = false;
        let ws = window.gameWs || window.combatWs;

        if (typeof window.executeOrcSkill === 'function') {
            let result = window.executeOrcSkill(skill, pX, pY, totalDmg);
            if (result === "ABORT") return; if (result === true) skillHandled = true;
        }
        if (!skillHandled && typeof window.executeElfSkill === 'function') {
            let result = window.executeElfSkill(skill, pX, pY, totalDmg);
            if (result === "ABORT") return; if (result === true) skillHandled = true;
        }
        if (!skillHandled && typeof window.executeHumanSkill === 'function') {
            let result = window.executeHumanSkill(skill, pX, pY, totalDmg);
            if (result === "ABORT") return; if (result === true) skillHandled = true;
        }
        if (!skillHandled && typeof window.executeDwarfSkill === 'function') {
            let result = window.executeDwarfSkill(skill, pX, pY, totalDmg);
            if (result === "ABORT") return; if (result === true) skillHandled = true;
        }

        if (!skillHandled && parseInt(skill.base_damage) > 0) {
            window.damageAoE(pX, pY, 130, totalDmg);
        }

        window.playerMana -= skill.mana_cost;
        window.updateMpUI();

        window.skillCooldowns[key] = true;
        const slot = document.getElementById(`skill-${key}`);
        if (slot) {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', transition: `height ${skill.cooldown_ms}ms linear`, zIndex: '10', borderRadius: '6px' });
            slot.appendChild(overlay);
            setTimeout(() => overlay.style.height = '0%', 50); 
            setTimeout(() => { window.skillCooldowns[key] = false; if(overlay.isConnected) overlay.remove(); }, skill.cooldown_ms);
        }

        if(typeof window.triggerSkillEffect === 'function') window.triggerSkillEffect(pX, pY, skill.skill_name);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'play_effect', effect: skill.skill_name, x: pX, y: pY }));
        }
    }

    window.hurtPlayer = function(damage) {
        if (window.isDead || window.isInvulnerable) return;
        
        let dodgeChance = parseInt(window.playerData?.attr_dodge) || 0;
        if (dodgeChance > 0 && Math.random() * 100 < dodgeChance) {
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `MISS`, "#aaa");
            return;
        }
        
        let resistMultiplier = 1 - (Math.min(75, (window.playerResist || 0)) / 100);
        let finalDamage = Math.floor(damage * resistMultiplier);
        
        if (window.playerData && (window.playerData.race === 'Elf' || window.playerData.race === 'Elfo')) { finalDamage = Math.floor(finalDamage * 1.20); }
        if (window.playerPassives && window.playerPassives.some(p => p.skill_name === 'Iron Skin' || p.skill_name === 'Pele de Ferro')) { finalDamage = Math.floor(finalDamage * 0.85); }
        if (window.playerPassives && window.playerPassives.some(p => p.skill_name === 'Mountain Resistance' || p.skill_name === 'Resistência da Montanha')) { finalDamage = Math.floor(finalDamage * 0.70); }

        if (window.playerShield > 0) {
            if (window.playerShield >= finalDamage) {
                window.playerShield -= finalDamage;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ Absorbed`, "#00bfff");
                window.updateHealthBars();
                return; 
            } else {
                finalDamage -= window.playerShield;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ Broken!`, "#00bfff");
                window.playerShield = 0; 
            }
        }

        window.playerCurrentHp -= finalDamage;
        window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `-${finalDamage}`, "#ff2a2a");
        
        const flash = document.createElement('div');
        Object.assign(flash.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', boxShadow: 'inset 0 0 100px rgba(255,0,0,0.5)', pointerEvents: 'none', zIndex: '9998', transition: 'opacity 0.2s' });
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 50);
        
        if (window.playerCurrentHp <= 0) {
            if (window.playerPassives && window.playerPassives.some(p => p.skill_name === 'Last Hope' || p.skill_name === 'Última Esperança') && !window.lastHopeUsed) {
                window.playerCurrentHp = 1; window.lastHopeUsed = true; window.isInvulnerable = true;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 50, "LAST HOPE!", "#ffca28");
                let ws = window.gameWs || window.combatWs;
                if(ws) { ws.send(JSON.stringify({ type: 'play_effect', effect: 'Last Hope', x: window.globalPlayerX, y: window.globalPlayerY })); }
                setTimeout(() => window.isInvulnerable = false, 5000);
                window.updateHealthBars();
                return; 
            }

            window.playerCurrentHp = 0;
            window.isDead = true;
            window.playerShield = 0; 
            document.getElementById('death-screen').style.opacity = "1";
            document.getElementById('death-screen').style.pointerEvents = "auto";
            
            setTimeout(() => {
                window.dispatchEvent(new Event('playerRespawn'));
                window.playerCurrentHp = window.playerMaxHp;
                window.isDead = false; window.lastHopeUsed = false;
                document.getElementById('death-screen').style.opacity = "0";
                document.getElementById('death-screen').style.pointerEvents = "none";
                window.updateHealthBars();
            }, 3000);
        }
        window.updateHealthBars();
    };

    function sendRealTimeEvent(payload) { fetch('backend/api_save_event.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(err => {}); }

    function renderLoop() {
        const SAFEPAD = { minX: 2100, maxX: 2900, minY: 2200, maxY: 2800 };
        const pGlobalX = window.globalPlayerX; const pGlobalY = window.globalPlayerY; 
        const playerInSafezone = (pGlobalX >= SAFEPAD.minX && pGlobalX <= SAFEPAD.maxX && pGlobalY >= SAFEPAD.minY && pGlobalY <= SAFEPAD.maxY);

        if (!window.isDead) {
            if (playerInSafezone) {
                if (window.playerEnergy < window.playerMaxEnergy) {
                    window.playerEnergy = Math.min(window.playerMaxEnergy, window.playerEnergy + 0.02); window.updateEnergyUI();
                }
                if (window.playerCurrentHp < window.playerMaxHp) {
                    window.playerCurrentHp = Math.min(window.playerMaxHp, window.playerCurrentHp + (window.playerMaxHp * 0.05 / 60));
                    window.updateHealthBars();
                }
            }
            if (window.playerMana < window.playerMaxMana && window.playerManaRegen) {
                window.playerMana = Math.min(window.playerMaxMana, window.playerMana + (window.playerManaRegen / 60)); window.updateMpUI();
            }
        }
        
        for (let id in window.mobState) {
            let state = window.mobState[id]; let node = window.mobCacheDOM[id];
            if (node) {
                state.currentX += (state.targetX - state.currentX) * 0.2;
                state.currentY += (state.targetY - state.currentY) * 0.2;
                node.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;
                node.style.zIndex = Math.floor(state.currentY + 30);
            }
        }
        requestAnimationFrame(renderLoop);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", bootCombatEngine);
} else {
    bootCombatEngine();
}