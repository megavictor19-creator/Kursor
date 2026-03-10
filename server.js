const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

const API_DATA_URL = 'http://127.0.0.1/backend/api_server_data.php'; 

let SERVER_DATA = {
    settings: { exp_multiplier: 1.0, drop_rate_multiplier: 1.0 },
    items: [],
    status_effects: [],
    monsters: []
};

const players = {};
const monsters = {};
const SAFEPAD = { minX: 2100, maxX: 2900, minY: 2200, maxY: 2800 };

async function loadServerData() {
    try {
        console.log(`[+] Fetching database data via PHP: ${API_DATA_URL}`);
        const response = await fetch(API_DATA_URL);
        const data = await response.json();
        
        if (data.success) {
            SERVER_DATA.settings = Object.assign(SERVER_DATA.settings, data.settings);
            SERVER_DATA.items = data.items || [];
            SERVER_DATA.status_effects = data.status_effects || [];
            SERVER_DATA.monsters = data.monsters || [];
            
            console.log(`[+] SUCCESS! ${SERVER_DATA.monsters.length} monsters and ${SERVER_DATA.items.length} items loaded.`);
            for(let i = 0; i < 45; i++) spawnMonster();
        }
    } catch (err) { 
        console.log("[-] FATAL ERROR: PHP API unreachable."); 
    }
}

function spawnMonster() {
    if (SERVER_DATA.monsters.length === 0) return;
    
    const id = Math.random().toString(36).substring(2, 10);
    const tpl = SERVER_DATA.monsters[Math.floor(Math.random() * SERVER_DATA.monsters.length)];
    let x, y;
    
    do { 
        x = Math.floor(Math.random() * 4900) + 50; 
        y = Math.floor(Math.random() * 4900) + 50; 
    } while(x > SAFEPAD.minX && x < SAFEPAD.maxX && y > SAFEPAD.minY && y < SAFEPAD.maxY);

    let isElite = Math.random() < 0.10;
    let baseExp = parseInt(tpl.exp_yield) || 10;
    let level = Math.max(1, Math.floor(baseExp / 10));
    
    let hp = parseInt(tpl.base_hp) || 100;
    let dmg = parseInt(tpl.damage) || 15;
    let minG = parseInt(tpl.gold_drop_min) || 1;
    let maxG = parseInt(tpl.gold_drop_max) || 15;
    let regen = parseInt(tpl.hp_regen) || 0;

    if (isElite) { 
        hp *= 2; 
        dmg = Math.floor(dmg * 1.5); 
        baseExp *= 3; 
        minG *= 3; 
        maxG *= 3; 
        level += 2; 
        regen *= 2;
    }

    monsters[id] = { 
        id: id, 
        name: tpl.name, 
        sprite_path: tpl.sprite_path, 
        level: level,
        isElite: isElite,
        hp: hp, maxHp: hp, dmg: dmg, defense: parseInt(tpl.defense) || 0,
        hpRegen: regen, lastRegen: Date.now(),
        baseSpeed: parseFloat(tpl.speed) || 1.2, 
        attackRate: parseInt(tpl.attack_rate_ms) || 1000, aggroRadius: parseInt(tpl.aggro_radius) || 350,
        expYield: baseExp, minGold: minG, maxGold: maxG,
        droplist: tpl.droplist || "", 
        lastAttack: 0, x: x, y: y, targetX: x, targetY: y, wanderTimer: 0, taggedBy: [],
        stunnedUntil: 0 
    };

    broadcast({ type: 'mob_spawned', mob: monsters[id] });
}

loadServerData();

setInterval(() => {
    let now = Date.now();
    let mobsUpdateData = [];
    
    for (let id in monsters) {
        let m = monsters[id];
        
        if (m.stunnedUntil && now < m.stunnedUntil) {
            mobsUpdateData.push({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: m.hp, maxHp: m.maxHp });
            continue; 
        }

        if (m.hpRegen > 0 && now - m.lastRegen > 1000) {
            if (m.hp < m.maxHp) {
                m.hp = Math.min(m.maxHp, m.hp + m.hpRegen);
            }
            m.lastRegen = now;
        }

        let nearestPlayer = null;
        let minDist = m.aggroRadius; 

        for (let pid in players) {
            let p = players[pid];
            if (p.x >= SAFEPAD.minX && p.x <= SAFEPAD.maxX && p.y >= SAFEPAD.minY && p.y <= SAFEPAD.maxY) continue;
            let d = Math.hypot(p.x - m.x, p.y - m.y);
            if (d < minDist) { minDist = d; nearestPlayer = p; }
        }

        let isFleeing = (m.hp / m.maxHp) < 0.15;
        let currentSpeed = m.baseSpeed;

        if (isFleeing && nearestPlayer) {
            let escapeDx = m.x - nearestPlayer.x; let escapeDy = m.y - nearestPlayer.y;
            m.targetX = m.x + escapeDx; m.targetY = m.y + escapeDy; currentSpeed = m.baseSpeed * 1.6; 
        } else if (nearestPlayer) {
            m.targetX = nearestPlayer.x; m.targetY = nearestPlayer.y; currentSpeed = m.baseSpeed;
            if (minDist < 65 && (now - m.lastAttack > m.attackRate)) {
                m.lastAttack = now;
                // ALERTA DE MODIFICAÇÃO: Incluímos targetX e targetY para garantir a identificação correta do alvo no cliente
                broadcast({ type: 'mob_attack_player', targetUsername: nearestPlayer.username, targetX: nearestPlayer.x, targetY: nearestPlayer.y, damage: Math.max(1, m.dmg) });
            }
        } else {
            currentSpeed = m.baseSpeed * 0.4;
            if (now > m.wanderTimer) {
                m.targetX = Math.max(50, Math.min(4950, m.x + (Math.random() * 300 - 150)));
                m.targetY = Math.max(50, Math.min(4950, m.y + (Math.random() * 300 - 150)));
                m.wanderTimer = now + 2000 + Math.random() * 2000;
            }
        }

        let dx = m.targetX - m.x; let dy = m.targetY - m.y; let dist = Math.hypot(dx, dy);
        if (dist > 5) {
            let stepX = (dx / dist) * (currentSpeed * 6.0); let stepY = (dy / dist) * (currentSpeed * 6.0);
            if (!((m.x + stepX) > SAFEPAD.minX && (m.x + stepX) < SAFEPAD.maxX && (m.y + stepY) > SAFEPAD.minY && (m.y + stepY) < SAFEPAD.maxY)) {
                m.x += stepX; m.y += stepY;
            }
        }
        mobsUpdateData.push({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: m.hp, maxHp: m.maxHp });
    }
    if (mobsUpdateData.length > 0) broadcast({ type: 'sync_mobs', mobs: mobsUpdateData });
}, 100); 

function generateLootForMob(mob) {
    let loot = [];
    let dropMultiplier = parseFloat(SERVER_DATA.settings.drop_rate_multiplier) || 1.0;
    if (mob.isElite) dropMultiplier *= 2.0;

    if (mob.maxGold > 0 && Math.random() < 0.8) {
        // gold_drop_min/max agora representam cobre (bronze)
        // 100 bronze = 1 prata, 100 prata = 1 ouro (1 ouro = 10000 bronze)
        let baseCopper = Math.floor(Math.random() * (mob.maxGold - mob.minGold + 1)) + mob.minGold;
        let copperAmt  = Math.floor(baseCopper * dropMultiplier);
        let g = Math.floor(copperAmt / 10000);
        let s = Math.floor((copperAmt % 10000) / 100);
        let b = copperAmt % 100;
        // monta label legível para o floating text
        let parts = [];
        if (g > 0) parts.push(g + 'G');
        if (s > 0) parts.push(s + 'S');
        if (b > 0 || parts.length === 0) parts.push(b + 'B');
        loot.push({ type: 'gold', copper: copperAmt, label: parts.join(' '), icon_path: 'img/items/gold_coins.png', cost: 2, color: '#ffca28' });
    }

    if (mob.droplist && mob.droplist.trim() !== "") {
        let dropsArray = mob.droplist.split(',');
        dropsArray.forEach(dropStr => {
            let parts = dropStr.split(':');
            if (parts.length === 2) {
                let itemId = parseInt(parts[0].trim());
                let chance = parseFloat(parts[1].trim()) * dropMultiplier;
                
                if (Math.random() * 100 <= chance) {
                    let itemTemplate = SERVER_DATA.items.find(i => i.id == itemId);
                    if (itemTemplate) {
                        let color = '#fff'; 
                        if (itemTemplate.rarity === 'Uncommon') color = '#4caf50';
                        if (itemTemplate.rarity === 'Rare') color = '#2196F3';
                        if (itemTemplate.rarity === 'Epic') color = '#c040ff';
                        if (itemTemplate.rarity === 'Legendary') color = '#ffca28';

                        loot.push({ type: 'item', amount: 1, name: itemTemplate.name, rarity: itemTemplate.rarity, category: itemTemplate.category, icon_path: itemTemplate.icon_path, equip_path: itemTemplate.equip_path, cost: parseInt(itemTemplate.energy_cost) || 5, color: color });
                    }
                }
            }
        });
    }
    return loot;
}

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substring(2, 15);
    ws.id = id;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'init') {
                players[id] = { id: id, username: data.username, sprite: data.sprite, x: data.x, y: data.y };
                if (data.combatTagId) ws._combatTagId = data.combatTagId;
                ws.send(JSON.stringify({ type: 'current_players', players: players }));
                broadcast({ type: 'new_player', player: players[id] }, id);
                broadcast({ type: 'chat_msg', channel: 'system', sender: 'System', text: `${data.username} joined the realm.` });
            }
            
            if (data.type === 'chat') {
                broadcast({ type: 'chat_msg', channel: data.channel, sender: players[id] ? players[id].username : 'Ghost', text: data.text.substring(0, 120) });
            }

            if (data.type === 'request_mobs') {
                ws.send(JSON.stringify({ type: 'init_mobs', mobs: Object.values(monsters) }));
            }

            if (data.type === 'move' && players[id]) {
                players[id].x = data.x; players[id].y = data.y;
                broadcast({ type: 'player_moved', id: id, x: data.x, y: data.y }, id);
            }
            
            if (data.type === 'play_effect') {
                broadcast({ type: 'play_effect', effect: data.effect, x: data.x, y: data.y }, id); 
            }

            if (data.type === 'attack_mob' && monsters[data.id]) {
                let m = monsters[data.id];
                
                if (data.stunMs) {
                    m.stunnedUntil = Date.now() + data.stunMs;
                }

                let finalDamage = Math.max(1, data.damage - m.defense);
                m.hp -= finalDamage;
                if (!m.taggedBy.includes(data.myTagId)) m.taggedBy.push(data.myTagId);

                for (let otherId in monsters) {
                    let other = monsters[otherId];
                    if (other.id !== m.id && other.name === m.name) {
                        let distToAlly = Math.hypot(other.x - m.x, other.y - m.y);
                        if (distToAlly < 250) { other.targetX = data.pX; other.targetY = data.pY; other.wanderTimer = Date.now() + 3000; }
                    }
                }

                if (m.hp <= 0) {
                    let tags = m.taggedBy;
                    let expMultiplier = parseFloat(SERVER_DATA.settings.exp_multiplier) || 1.0;
                    let finalExp = Math.floor(m.expYield * expMultiplier);
                    let dieX = m.x; let dieY = m.y;
                    
                    delete monsters[data.id];

                    // Envia mob_died para TODOS (animação de morte, remoção do DOM)
                    // mas loot só para quem deu dano — cada um recebe o seu próprio
                    broadcast({ type: 'mob_died', id: data.id, x: dieX, y: dieY, tags: tags, expYield: finalExp });

                    // Loot individual: cada tagger recebe sua própria bag
                    wss.clients.forEach((client) => {
                        if (client.readyState !== WebSocket.OPEN) return;
                        const cPlayer = players[client.id];
                        if (!cPlayer) return;
                        // Verifica se esse cliente participou do kill
                        const tagId = client._combatTagId;
                        if (!tagId || !tags.includes(tagId)) return;
                        // Gera loot exclusivo para esse jogador
                        let personalLoot = generateLootForMob(m);
                        if (personalLoot.length > 0) {
                            client.send(JSON.stringify({ type: 'personal_loot', x: dieX, y: dieY, loot: personalLoot }));
                        }
                    });

                    setTimeout(spawnMonster, 4000);
                } else {
                    m.x += data.pushX; m.y += data.pushY;
                    broadcast({ type: 'mob_hit', id: data.id, damage: finalDamage, isCrit: data.isCrit, hp: m.hp, maxHp: m.maxHp, pushX: data.pushX, pushY: data.pushY });
                }
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        if (players[id]) {
            broadcast({ type: 'chat_msg', channel: 'system', sender: 'System', text: `${players[id].username} disconnected.` });
            delete players[id];
            broadcast({ type: 'player_disconnected', id: id });
        }
    });
});

function broadcast(data, excludeId = null) {
    const msg = JSON.stringify(data);
    wss.clients.forEach((client) => { if (client.readyState === WebSocket.OPEN && client.id !== excludeId) client.send(msg); });
}

console.log("=======================================");
console.log(" KURSOR SOULS - SERVER AUTHORITATIVE MMO");
console.log(" MODE: DATA-DRIVEN + SKILL EFFECTS ENGINE");
console.log(" Listening on port: 8080");
console.log("=======================================");