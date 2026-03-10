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
        const uiStatMp = document.getElementById('ui-stat-mp'); if(uiStatMp) uiStatMp.innerText = `${Math.floor(window.playerMana)}/${Math.floor(window.playerMaxMana)}`;
        const bottomMpText = document.getElementById('ui-mp-text'); if(bottomMpText) bottomMpText.innerText = `${Math.floor(window.playerMana)} / ${Math.floor(window.playerMaxMana)}`;
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

    // ── showFloatingText com suporte a tamanho e peso ─────────
    window.showFloatingText = function(x, y, text, color, options = {}) {
        const txt = document.createElement("div");
        txt.innerText = text;
        const fontSize = options.fontSize || "14px";
        const fontWeight = options.fontWeight || "bold";
        const shadow = options.shadow || "1px 1px 0px #000";
        const riseY = options.riseY || 40;
        const duration = options.duration || 1000;
        Object.assign(txt.style, {
            position: "absolute", left: "0", top: "0",
            transform: `translate3d(${x}px, ${y}px, 0)`,
            color: color, fontWeight: fontWeight,
            fontSize: fontSize,
            fontFamily: "'Courier New', monospace",
            pointerEvents: "none", zIndex: "9999",
            textShadow: shadow,
            transition: `transform ${duration}ms ease-out, opacity ${duration}ms`,
            whiteSpace: "nowrap"
        });
        worldMap.appendChild(txt); 
        requestAnimationFrame(() => {
            txt.style.transform = `translate3d(${x + (options.driftX || 0)}px, ${y - riseY}px, 0)`;
            txt.style.opacity = "0";
        });
        setTimeout(() => txt.remove(), duration);
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
                        const hpFill = window.mobCacheDOM[mobData.id] && window.mobCacheDOM[mobData.id].querySelector('.mob-hp-fill');
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
                    window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ +${sVal} SHIELD`, "#00bfff");
                    window.updateHealthBars();
                }
            }
        }

        // ── Dano saindo do monstro (hit no mob) ───────────────
        if (data.type === 'mob_hit') {
            if (window.mobCacheDOM[data.id] && window.mobState[data.id]) {
                const sprite = window.mobCacheDOM[data.id].querySelector('.mob-sprite');
                if (sprite) {
                    sprite.style.filter = "brightness(2.0) drop-shadow(0 0 10px rgba(255,68,68,0.8))";
                    setTimeout(() => { if (sprite) sprite.style.filter = "none"; }, 150);
                }
                let startX = window.mobState[data.id].currentX + 40;
                let startY = window.mobState[data.id].currentY - 10;

                if (data.isCrit) {
                    // CRIT — grande, dourado, animado
                    window.showFloatingText(startX - 10, startY - 10, `${data.damage}`, "#ffca28", {
                        fontSize: "22px", shadow: "2px 2px 0px #000, 0 0 8px rgba(255,200,0,0.6)",
                        riseY: 50, duration: 700, driftX: -10, fontWeight: "900"
                    });
                    // Label CRIT acima do número
                    window.showFloatingText(startX - 10, startY - 28, "CRIT!", "#ffca28", {
                        fontSize: "10px", shadow: "1px 1px 0 #000",
                        riseY: 50, duration: 700, driftX: -8
                    });
                } else {
                    window.showFloatingText(startX, startY, `${data.damage}`, "rgba(255,80,80,0.9)", {
                        fontSize: "14px", shadow: "1px 1px 0px #000",
                        riseY: 35, duration: 550, driftX: 8
                    });
                }
            }
        }

        // ── FIX #1: dano no jogador — usa playerData.username ─
        if (data.type === 'mob_attack_player') {
            const myUsername = window.playerData ? window.playerData.username : null;
            if (myUsername && data.targetUsername === myUsername) {
                window.hurtPlayer(data.damage);
            }
        }

        if (data.type === 'mob_died') {
            if (window.mobCacheDOM[data.id] && window.mobState[data.id]) {
                window.mobCacheDOM[data.id].style.transform = `translate3d(${window.mobState[data.id].currentX}px, ${window.mobState[data.id].currentY}px, 0) scale(0)`;
                setTimeout(() => {
                    if (window.mobCacheDOM[data.id]) {
                        window.mobCacheDOM[data.id].remove();
                        delete window.mobCacheDOM[data.id];
                        delete window.mobState[data.id];
                    }
                }, 200);

                if (data.tags.includes(window.myCombatTagId)) {
                    window.playerKills++; 
                    const uiKills = document.getElementById('ui-kills');
                    if (uiKills) uiKills.innerText = window.playerKills;
                    
                    let xpMultiplier = 1 + ((window.playerXpBonus || 0) / 100);
                    let gainedXp = Math.floor((data.expYield || 15) * xpMultiplier);
                    window.playerXp += gainedXp;

                    // ── XP flutuante no cursor ─────────────────
                    window.showFloatingText(
                        window.globalPlayerX, window.globalPlayerY - 50,
                        `+${gainedXp} XP`, "#b388ff",
                        { fontSize: "12px", riseY: 45, duration: 1200 }
                    );
                    
                    const uiCharXp = document.getElementById('ui-char-xp'); 
                    if (uiCharXp) uiCharXp.innerText = `${window.playerXp} / ${window.playerNextLevelXp}`;

                    if (typeof window.checkLevelUp === 'function') window.checkLevelUp();
                    if (typeof window.updateXpUI === 'function') window.updateXpUI();

                    sendRealTimeEvent({ event: 'update_stats', xp: window.playerXp, level: window.playerLevel, kills: window.playerKills, max_hp: window.playerMaxHp, current_hp: window.playerCurrentHp });
                }
            }
        }

        // ── FIX #2: personal_loot — gold direto, itens na bag ─
        if (data.type === 'personal_loot') {
            const goldItems = data.loot.filter(l => l.type === 'gold');
            const itemsOnly = data.loot.filter(l => l.type !== 'gold');

            // Moedas: usa sistema ouro/prata/bronze (valor em cobre/bronze)
            goldItems.forEach(g => {
                const copper = Math.floor(g.copper || g.amount || 0);
                if (copper <= 0) return;
                window.playerGold = (window.playerGold || 0) + copper;
                // atualiza HUD imediatamente via updateMiniHud
                if (typeof window.updateMiniHud === 'function') window.updateMiniHud();
                // floating text com label decomposto
                const label = g.label || ('+' + copper + 'B');
                window.showFloatingText(data.x, data.y - 20, '+' + label, '#ffca28', {
                    fontSize: '13px', riseY: 38, duration: 1100
                });
                fetch('backend/api_inventory.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_gold', amount: copper })
                }).catch(() => {});
            });

            // Itens: bag clicável no chão
            if (itemsOnly.length > 0 && typeof window.spawnLootBag === 'function') {
                window.spawnLootBag(data.x, data.y, itemsOnly);
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
                    // ── CRIT visual no cursor ─────────────────
                    window.showFloatingText(pGlobalX, pGlobalY - 20, "CRIT!", "#ffca28", {
                        fontSize: "11px", riseY: 30, duration: 600
                    });
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

                // ── CRIT visual no cursor ─────────────────────
                window.showFloatingText(pGlobalX, pGlobalY - 20, "CRIT!", "#ffca28", {
                    fontSize: "11px", riseY: 30, duration: 600
                });
                
                if(window.playerMaxMana) {
                    let manaHeal = window.playerMaxMana * 0.15;
                    window.playerMana = Math.min(window.playerMaxMana, window.playerMana + manaHeal);
                    window.updateMpUI();
                    window.showFloatingText(pGlobalX, pGlobalY - 30, `+${Math.floor(manaHeal)} MP`, "#00d4ff", {
                        fontSize: "12px", riseY: 35, duration: 900
                    });
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
        if (window.playerMana < skill.mana_cost) {
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, "No Mana!", "#00d4ff", {
                fontSize: "13px", riseY: 35, duration: 900
            });
            return;
        }

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

        // ── Custo de mana flutuante ────────────────────────────
        if (skill.mana_cost > 0) {
            window.playerMana -= skill.mana_cost;
            window.updateMpUI();
            window.showFloatingText(pX, pY - 30, `-${skill.mana_cost} MP`, "#4488ff", {
                fontSize: "11px", riseY: 32, duration: 800, driftX: 12
            });
        }

        // ── Nome da skill flutuante ────────────────────────────
        window.showFloatingText(pX, pY - 46, skill.skill_name, "rgba(200,220,255,0.75)", {
            fontSize: "10px", riseY: 28, duration: 900, fontWeight: "normal"
        });

        window.skillCooldowns[key] = true;
        const slot = document.getElementById(`skill-${key}`);
        if (slot) {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'absolute', bottom: '0', left: '0',
                width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.75)',
                transition: `height ${skill.cooldown_ms}ms linear`,
                zIndex: '10', borderRadius: '6px'
            });
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
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `MISS`, "#aaa", {
                fontSize: "13px", riseY: 30, duration: 700
            });
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
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ Absorbed`, "#00bfff", { fontSize: "13px" });
                window.updateHealthBars();
                return; 
            } else {
                finalDamage -= window.playerShield;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `🛡️ Broken!`, "#00bfff", { fontSize: "13px" });
                window.playerShield = 0; 
            }
        }

        window.playerCurrentHp -= finalDamage;

        // ── Dano no jogador — número vermelho flutuante ────────
        window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 30, `-${finalDamage}`, "#ff2a2a", {
            fontSize: "16px", shadow: "2px 2px 0px #000",
            riseY: 42, duration: 1000, driftX: (Math.random() - 0.5) * 20
        });
        
        // Flash de dano na tela
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed', top: '0', left: '0',
            width: '100vw', height: '100vh',
            boxShadow: 'inset 0 0 80px rgba(255,0,0,0.45)',
            pointerEvents: 'none', zIndex: '9998', transition: 'opacity 0.25s'
        });
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 250); }, 60);
        
        if (window.playerCurrentHp <= 0) {
            if (window.playerPassives && window.playerPassives.some(p => p.skill_name === 'Last Hope' || p.skill_name === 'Última Esperança') && !window.lastHopeUsed) {
                window.playerCurrentHp = 1; window.lastHopeUsed = true; window.isInvulnerable = true;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 50, "LAST HOPE!", "#ffca28", {
                    fontSize: "18px", shadow: "2px 2px 0 #000, 0 0 10px rgba(255,200,0,0.7)",
                    riseY: 50, duration: 1200
                });
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

    function sendRealTimeEvent(payload) {
        fetch('backend/api_save_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    function renderLoop() {
        const SAFEPAD = { minX: 2100, maxX: 2900, minY: 2200, maxY: 2800 };
        const pGlobalX = window.globalPlayerX; const pGlobalY = window.globalPlayerY; 
        const playerInSafezone = (pGlobalX >= SAFEPAD.minX && pGlobalX <= SAFEPAD.maxX && pGlobalY >= SAFEPAD.minY && pGlobalY <= SAFEPAD.maxY);

        if (!window.isDead) {
            if (playerInSafezone) {
                if (window.playerEnergy < window.playerMaxEnergy) {
                    window.playerEnergy = Math.min(window.playerMaxEnergy, window.playerEnergy + 0.02);
                    window.updateEnergyUI();
                }
                if (window.playerCurrentHp < window.playerMaxHp) {
                    window.playerCurrentHp = Math.min(window.playerMaxHp, window.playerCurrentHp + (window.playerMaxHp * 0.05 / 60));
                    window.updateHealthBars();
                }
            }
            // FIX regen de mana — floor para evitar decimais longos
            if (window.playerMana < window.playerMaxMana && window.playerManaRegen) {
                let newMana = Math.min(window.playerMaxMana, window.playerMana + (window.playerManaRegen / 60));
                // Só chama updateMpUI quando muda o valor inteiro (evita spam de renders)
                if (Math.floor(newMana) !== Math.floor(window.playerMana)) {
                    window.playerMana = newMana;
                    window.updateMpUI();
                } else {
                    window.playerMana = newMana;
                }
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
        if (typeof window._checkGoldProximity === 'function') window._checkGoldProximity();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", bootCombatEngine);
} else {
    bootCombatEngine();
}

// ============================================================
// SISTEMA DE LOOT NO CHÃO — BAG DE ITENS CLICÁVEL
// ============================================================
(function() {
    const MAX_BAGS = 10;
    const BAG_TTL  = 30000; // 30s

    let groundBags  = [];
    let activeBagPopup = null;

    // CSS injetado uma vez
    if (!document.getElementById('ks-loot-css')) {
        const s = document.createElement('style');
        s.id = 'ks-loot-css';
        s.textContent = `
            @keyframes ks-bag-idle { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-4px)} }
            @keyframes ks-bag-expire { to{opacity:0;transform:translate(-50%,-50%) scale(0.4)} }
            @keyframes ks-popup-in  { from{opacity:0;transform:translateY(6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
            .ks-ground-bag {
                position:absolute; width:36px; height:36px;
                transform:translate(-50%,-50%);
                display:flex; flex-direction:column; align-items:center;
                cursor:pointer; z-index:900;
                animation: ks-bag-idle 2s ease-in-out infinite;
                pointer-events:all;
            }
            .ks-ground-bag img {
                width:30px; height:30px; object-fit:contain;
                filter:drop-shadow(0 2px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 4px rgba(255,200,80,0.4));
            }
            .ks-bag-timer {
                width:28px; height:2px; background:rgba(0,0,0,0.5);
                border-radius:2px; overflow:hidden; margin-top:3px;
            }
            .ks-bag-timer-fill { height:100%; background:rgba(0,229,255,0.6); transition:width 0.5s linear; }
            .ks-bag-popup {
                position:fixed; z-index:8000;
                background:rgba(0,0,0,0.88);
                border-radius:8px; padding:10px 12px;
                min-width:210px; max-width:270px;
                animation: ks-popup-in 0.15s ease-out;
                pointer-events:all;
            }
            .ks-popup-header {
                font-size:9px; color:rgba(255,255,255,0.3);
                letter-spacing:1.5px; text-transform:uppercase;
                margin-bottom:8px; padding-bottom:5px;
                border-bottom:1px solid rgba(255,255,255,0.05);
            }
            .ks-popup-item {
                display:flex; align-items:center; gap:8px;
                padding:5px 4px; border-radius:5px; cursor:pointer;
                transition:background 0.1s; position:relative;
            }
            .ks-popup-item:hover { background:rgba(255,255,255,0.06); }
            .ks-popup-item img { width:26px; height:26px; object-fit:contain; flex-shrink:0; border-radius:4px; }
            .ks-popup-item .ks-item-tooltip {
                display:none; position:absolute; left:calc(100% + 8px); top:0;
                background:rgba(0,0,0,0.95); border-radius:6px; padding:8px 10px;
                min-width:160px; font-size:10px; line-height:1.5; z-index:9100;
                white-space:nowrap;
            }
            .ks-popup-item:hover .ks-item-tooltip { display:block; }
            .ks-popup-take-all {
                width:100%; padding:5px 0; margin-top:8px;
                background:rgba(0,229,255,0.08); border:none; border-radius:5px;
                color:rgba(0,229,255,0.8); font-size:10px; font-weight:700;
                letter-spacing:1px; cursor:pointer; transition:background 0.15s;
            }
            .ks-popup-take-all:hover { background:rgba(0,229,255,0.18); }
            .rarity-Common    { color:#bbb; }
            .rarity-Uncommon  { color:#4caf50; }
            .rarity-Rare      { color:#2196f3; }
            .rarity-Epic      { color:#9c27b0; }
            .rarity-Legendary { color:#ffca28; }
        `;
        document.head.appendChild(s);
    }

    // ── Helpers para montar tooltip de stats ──────────────────
    function buildTooltipHtml(item) {
        let lines = [`<div class="rarity-${item.rarity||'Common'}" style="font-weight:bold;margin-bottom:4px;">${item.name}</div>`];
        lines.push(`<div style="color:rgba(255,255,255,0.35);font-size:9px;margin-bottom:4px;">${item.rarity||'Common'} · ${item.category||''}</div>`);
        const stats = item.stats_json || item.tpl_stats || null;
        if (stats) {
            try {
                const parsed = typeof stats === 'string' ? JSON.parse(stats) : stats;
                for (const [k, v] of Object.entries(parsed)) {
                    if (v && v !== 0) {
                        const label = k.replace('attr_','').replace(/_/g,' ');
                        lines.push(`<div style="color:rgba(200,220,255,0.7);">+${v} <span style="color:rgba(255,255,255,0.4);">${label}</span></div>`);
                    }
                }
            } catch {}
        }
        return lines.join('');
    }

    // ── Spawn bag de itens no mapa ────────────────────────────
    window.spawnLootBag = function(wx, wy, items) {
        const worldMap = document.getElementById('worldMap');
        if (!worldMap || !items || items.length === 0) return;

        if (groundBags.length >= MAX_BAGS) {
            const oldest = groundBags.shift();
            removeBag(oldest, true);
        }

        const el = document.createElement('div');
        el.className = 'ks-ground-bag';
        el.style.left = wx + 'px';
        el.style.top  = wy + 'px';
        el.innerHTML = `
            <img src="img/items/loot_bag.png" onerror="this.src='img/items/default.png'">
            <div class="ks-bag-timer"><div class="ks-bag-timer-fill" style="width:100%"></div></div>
        `;
        worldMap.appendChild(el);

        const bagRef = { el, items: [...items], expireAt: Date.now() + BAG_TTL };
        groundBags.push(bagRef);

        requestAnimationFrame(() => {
            const fill = el.querySelector('.ks-bag-timer-fill');
            if (fill) { fill.style.transition = `width ${BAG_TTL}ms linear`; fill.style.width = '0%'; }
        });

        el.addEventListener('click', (e) => { e.stopPropagation(); openBagPopup(bagRef, e); });
        bagRef._timer = setTimeout(() => removeBag(bagRef, true), BAG_TTL);
    };

    function removeBag(bagRef, animated) {
        if (!bagRef || !bagRef.el) return;
        clearTimeout(bagRef._timer);
        if (activeBagPopup && activeBagPopup.bagRef === bagRef) closeBagPopup();
        if (animated) {
            bagRef.el.style.animation = 'ks-bag-expire 0.35s ease-out forwards';
            setTimeout(() => bagRef.el.remove(), 350);
        } else {
            bagRef.el.remove();
        }
        groundBags = groundBags.filter(b => b !== bagRef);
    }

    // ── Popup da bag ─────────────────────────────────────────
    function openBagPopup(bagRef, clickEvent) {
        if (activeBagPopup) closeBagPopup();
        if (bagRef.items.length === 0) { removeBag(bagRef, true); return; }

        const popup = document.createElement('div');
        popup.className = 'ks-bag-popup';
        document.body.appendChild(popup);

        const renderPopup = () => {
            if (bagRef.items.length === 0) { closeBagPopup(); removeBag(bagRef, true); return; }
            popup.innerHTML = `
                <div class="ks-popup-header">Loot (${bagRef.items.length})</div>
                ${bagRef.items.map((item, idx) => `
                    <div class="ks-popup-item" onclick="window._lootItemClick(event,${idx})">
                        <img src="${item.icon_path || 'img/items/default.png'}" onerror="this.src='img/items/default.png'">
                        <span class="rarity-${item.rarity||'Common'}" style="font-size:12px;font-weight:600;flex:1;">${item.name}</span>
                        <div class="ks-item-tooltip">${buildTooltipHtml(item)}</div>
                    </div>
                `).join('')}
                <button class="ks-popup-take-all" onclick="window._lootTakeAll()">⬆ TAKE ALL</button>
            `;
        };
        renderPopup();

        const px = Math.min(clickEvent.clientX + 12, window.innerWidth - 290);
        const py = Math.min(clickEvent.clientY - 10, window.innerHeight - 280);
        popup.style.left = px + 'px';
        popup.style.top  = py + 'px';

        activeBagPopup = { bagRef, el: popup, renderPopup };
    }

    function closeBagPopup() {
        if (!activeBagPopup) return;
        activeBagPopup.el.remove();
        activeBagPopup = null;
    }

    document.addEventListener('click', (e) => {
        if (activeBagPopup && !activeBagPopup.el.contains(e.target) && !e.target.closest('.ks-ground-bag')) {
            closeBagPopup();
        }
    });

    window._lootItemClick = async function(e, idx) {
        e.stopPropagation();
        if (!activeBagPopup) return;
        const bagRef = activeBagPopup.bagRef;
        const item = bagRef.items[idx];
        if (!item) return;
        const ok = await collectItem(item);
        if (ok) {
            bagRef.items.splice(idx, 1);
            if (bagRef.items.length === 0) { closeBagPopup(); removeBag(bagRef, true); }
            else activeBagPopup.renderPopup();
        }
    };

    window._lootTakeAll = async function() {
        if (!activeBagPopup) return;
        const bagRef = activeBagPopup.bagRef;
        let skipped = 0;
        const toCollect = [...bagRef.items];
        for (const item of toCollect) {
            const ok = await collectItem(item);
            if (ok) bagRef.items.splice(bagRef.items.indexOf(item), 1);
            else skipped++;
        }
        if (skipped > 0) {
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 50,
                `Bag full! ${skipped} item(s) left`, '#ff5555', { fontSize: "11px" });
        }
        if (bagRef.items.length === 0) { closeBagPopup(); removeBag(bagRef, true); }
        else activeBagPopup.renderPopup();
    };

    async function collectItem(item) {
        const used = window._bagUsed || 0;
        if (used >= 20) {
            window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 40, 'Bag full!', '#ff5555');
            return false;
        }
        try {
            const res = await fetch('backend/api_inventory.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_item', item_name: item.name, rarity: item.rarity || 'Common', category: item.category || 'Core' })
            });
            const data = await res.json();
            if (data.success) {
                window._bagUsed = (window._bagUsed || 0) + 1;
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 40,
                    `+${item.name}`, item.color || '#fff', { fontSize: "12px", riseY: 38 });
                if (typeof window.loadInventoryData === 'function') window.loadInventoryData();
                return true;
            }
            if (data.error === 'Inventory full') {
                window.showFloatingText(window.globalPlayerX, window.globalPlayerY - 40, 'Bag full!', '#ff5555');
            }
            return false;
        } catch { return false; }
    }

    // _checkGoldProximity fica vazio aqui pois gold vai direto agora
    window._checkGoldProximity = function() {};

})();
