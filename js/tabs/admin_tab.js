// ================================================================
// KURSOR SOULS — Admin Panel v1.0
// js/tabs/admin_tab.js
// Carregado apenas quando is_admin = true (verificado no game.php)
// ================================================================

(function() {
    'use strict';

    // ─────────────────────────────────────────────────────────────
    // ESTADO LOCAL
    // ─────────────────────────────────────────────────────────────
    let adminData = {
        monsters: [],
        races: [],
        skills: [],
        players: [],
        settings: []
    };
    let activeTab = 'monsters';
    let selectedMonsterId = null;
    let selectedRaceId    = null;
    let selectedSkillId   = null;
    let selectedPlayerId  = null;
    let skillRaceFilter   = 'All';

    // ─────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO — aguarda DOM estar pronto
    // ─────────────────────────────────────────────────────────────
    function init() {
        buildAdminWindowHTML();
        setupDraggable();
        adminSwitchTab('monsters');
    }

    // ─────────────────────────────────────────────────────────────
    // CRIA O HTML DA JANELA ADMIN (inserido no body pelo game.php)
    // admin_tab.js só inicializa o conteúdo dinâmico dentro dos painéis
    // ─────────────────────────────────────────────────────────────
    function buildAdminWindowHTML() {
        // Os painéis já existem no game.php, basta inicializar
        renderMonsterPanel();
        renderRacePanel();
        renderSkillPanel();
        renderPlayerPanel();
        renderSettingsPanel();
    }

    // ─────────────────────────────────────────────────────────────
    // TROCA DE ABA — exposto globalmente para o onclick do HTML
    // ─────────────────────────────────────────────────────────────
    window.adminSwitchTab = function(tab) {
        activeTab = tab;
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');

        document.querySelectorAll('.admin-tab-panel').forEach(p => p.style.display = 'none');
        const panel = document.getElementById(`admin-tab-${tab}`);
        if (panel) panel.style.display = 'flex';

        // Carrega dados frescos ao trocar de aba
        if      (tab === 'monsters') loadMonsters();
        else if (tab === 'races')    loadRaces();
        else if (tab === 'skills')   loadSkills();
        else if (tab === 'players')  loadPlayers();
        else if (tab === 'settings') loadSettings();
    };

    // ─────────────────────────────────────────────────────────────
    // HELPERS UI
    // ─────────────────────────────────────────────────────────────
    function adminFetch(url, options = {}) {
        return fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    }

    function adminToast(msg, color = '#00e676') {
        let t = document.createElement('div');
        t.innerText = msg;
        Object.assign(t.style, {
            position: 'fixed', top: '80px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: `1px solid ${color}`,
            color: color, padding: '8px 20px', borderRadius: '6px',
            fontSize: '12px', fontWeight: '700', zIndex: '99999',
            pointerEvents: 'none', letterSpacing: '1px',
            transition: 'opacity 0.4s'
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2000);
    }

    function labelStyle(color = 'rgba(200,210,220,0.5)') {
        return `display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:${color};margin-bottom:3px;`;
    }
    function inputStyle(extra = '') {
        return `width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);
                color:#fff;padding:5px 8px;border-radius:4px;font-size:12px;box-sizing:border-box;${extra}`;
    }
    function btnStyle(color = '#00e5ff', extra = '') {
        return `background:transparent;border:1px solid ${color};color:${color};padding:5px 12px;
                border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;
                text-transform:uppercase;transition:0.15s;${extra}`;
    }
    function sectionTitle(text) {
        return `<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;
                            color:rgba(0,229,255,0.6);margin:14px 0 8px;border-bottom:
                            1px solid rgba(255,255,255,0.05);padding-bottom:5px;">${text}</div>`;
    }

    // Cria um campo de form com label + input
    function formField(id, label, value = '', type = 'text', options = {}) {
        let inputTag = type === 'textarea'
            ? `<textarea id="${id}" style="${inputStyle('height:55px;resize:vertical;')}">${value ?? ''}</textarea>`
            : type === 'select'
            ? `<select id="${id}" style="${inputStyle()}">${options.choices.map(c =>
                `<option value="${c}" ${c == value ? 'selected' : ''}>${c}</option>`).join('')}</select>`
            : `<input id="${id}" type="${type}" value="${value ?? ''}" style="${inputStyle()}" ${options.step ? `step="${options.step}"` : ''}>`;
        return `<div style="margin-bottom:8px;">
                    <label style="${labelStyle()}">${label}</label>
                    ${inputTag}
                </div>`;
    }

    function getFormValue(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        if (el.type === 'checkbox') return el.checked ? 1 : 0;
        return el.value;
    }

    // ─────────────────────────────────────────────────────────────
    // ██████████████ TAB: MONSTERS ████████████████████████████████
    // ─────────────────────────────────────────────────────────────
    function renderMonsterPanel() {
        const panel = document.getElementById('admin-tab-monsters');
        if (!panel) return;
        panel.style.cssText = 'display:flex;width:100%;height:100%;overflow:hidden;';
        panel.innerHTML = `
            <!-- LISTA ESQUERDA -->
            <div id="adm-mob-list-col" style="width:220px;min-width:220px;border-right:1px solid rgba(255,255,255,0.06);
                 display:flex;flex-direction:column;height:100%;overflow:hidden;">
                <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:6px;">
                    <input id="adm-mob-search" placeholder="Search..." style="${inputStyle('flex:1;')}">
                    <button onclick="adminNewMonster()" style="${btnStyle('#00e5ff','padding:5px 8px;')}" title="New Monster">+</button>
                </div>
                <div id="adm-mob-list" style="overflow-y:auto;flex:1;padding:6px 4px;"></div>
            </div>
            <!-- FORM CENTRAL -->
            <div id="adm-mob-form-col" style="flex:1;overflow-y:auto;padding:14px 16px;height:100%;box-sizing:border-box;">
                <div id="adm-mob-form-inner" style="color:rgba(255,255,255,0.3);text-align:center;margin-top:60px;font-size:12px;">
                    Select a monster from the list, or click + to create a new one.
                </div>
            </div>
            <!-- PREVIEW DIREITA -->
            <div id="adm-mob-preview-col" style="width:170px;min-width:170px;border-left:1px solid rgba(255,255,255,0.06);
                 padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;overflow:hidden;">
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(200,200,200,0.4);">Preview</div>
                <div id="adm-mob-sprite-preview" style="width:90px;height:90px;background:rgba(255,255,255,0.03);
                     border:1px solid rgba(255,255,255,0.08);border-radius:8px;display:flex;
                     align-items:center;justify-content:center;overflow:hidden;">
                    <span style="color:rgba(255,255,255,0.2);font-size:30px;">?</span>
                </div>
                <div id="adm-mob-preview-name" style="font-size:11px;color:#fff;text-align:center;font-weight:600;"></div>
                <div id="adm-mob-preview-stats" style="font-size:10px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.7;"></div>
                <button id="adm-mob-spawn-btn" onclick="adminSpawnMonster()" style="${btnStyle('#ffae00','width:100%;display:none;')}" title="Spawn Now">⚡ Spawn</button>
            </div>`;

        document.getElementById('adm-mob-search').addEventListener('input', filterMonsterList);
    }

    async function loadMonsters() {
        const res = await adminFetch('backend/admin/get_monsters.php');
        const d = await res.json();
        if (!d.success) return;
        adminData.monsters = d.monsters;
        renderMonsterList();
    }

    function renderMonsterList() {
        const list = document.getElementById('adm-mob-list');
        if (!list) return;
        const search = (document.getElementById('adm-mob-search')?.value || '').toLowerCase();
        const filtered = adminData.monsters.filter(m =>
            m.name.toLowerCase().includes(search) || m.zone.toLowerCase().includes(search));

        list.innerHTML = filtered.map(m => `
            <div onclick="adminSelectMonster(${m.id})"
                 style="padding:7px 10px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:8px;
                        margin-bottom:2px;background:${selectedMonsterId == m.id ? 'rgba(0,229,255,0.08)' : 'transparent'};
                        border-left:2px solid ${selectedMonsterId == m.id ? '#00e5ff' : 'transparent'};transition:0.1s;">
                <img src="${m.sprite_path}" style="width:28px;height:28px;object-fit:contain;flex-shrink:0;"
                     onerror="this.style.opacity='0.2'">
                <div style="overflow:hidden;">
                    <div style="font-size:11px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.3);">${m.zone}</div>
                </div>
            </div>`).join('');
    }

    function filterMonsterList() { renderMonsterList(); }

    window.adminSelectMonster = function(id) {
        selectedMonsterId = id;
        renderMonsterList();
        const m = adminData.monsters.find(x => x.id == id);
        if (!m) return;
        renderMonsterForm(m);
        updateMonsterPreview(m);
    };

    window.adminNewMonster = function() {
        selectedMonsterId = null;
        renderMonsterList();
        renderMonsterForm({
            id: 0, name: 'New Monster', sprite_path: 'img/monsters/default.png',
            base_hp: 100, hp_regen: 0, damage: 15, defense: 0, resistance: 0,
            crit_chance: 0, max_energy: 100, energy_regen_pct: 1, heal_skill_pct: 0,
            attack_rate_ms: 1000, speed: 1.2, aggro_radius: 350, move_set: 1,
            zone: 'Dark Forest', exp_yield: 20, droplist: '', gold_drop_min: 5, gold_drop_max: 20
        });
        updateMonsterPreview(null);
    };

    function renderMonsterForm(m) {
        const el = document.getElementById('adm-mob-form-inner');
        if (!el) return;

        const zones = ['Dark Forest','Cursed Graveyard','Abyssal Depths','Desert Ruins',
                       'Shadow Realm','Toxic Swamps','Cyber Void','Frozen Peaks','Alien Mothership'];

        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">${m.id ? `Edit: ${m.name}` : 'New Monster'}</div>
                <div style="display:flex;gap:6px;">
                    <button onclick="adminSaveMonster()" style="${btnStyle('#00e676')}">💾 Save</button>
                    ${m.id ? `<button onclick="adminDuplicateMonster(${m.id})" style="${btnStyle('#ffae00')}">📋 Duplicate</button>` : ''}
                    ${m.id ? `<button onclick="adminDeleteMonster(${m.id})" style="${btnStyle('#ff4444')}">🗑 Delete</button>` : ''}
                </div>
            </div>
            <input type="hidden" id="mob-id" value="${m.id}">

            ${sectionTitle('Identity')}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${formField('mob-name', 'Name', m.name)}
                ${formField('mob-zone', 'Zone', m.zone, 'select', { choices: zones })}
            </div>
            <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
                ${formField('mob-sprite', 'Sprite Path', m.sprite_path)}
                <div style="margin-bottom:8px;">
                    <button onclick="adminPreviewSprite()" style="${btnStyle('#888','padding:5px 10px;')}">👁 Preview</button>
                </div>
            </div>

            ${sectionTitle('Combat Stats')}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${formField('mob-hp',       'Base HP',    m.base_hp,       'number')}
                ${formField('mob-hpregen',  'HP Regen',   m.hp_regen,      'number')}
                ${formField('mob-damage',   'Damage',     m.damage,        'number')}
                ${formField('mob-defense',  'Defense',    m.defense,       'number')}
                ${formField('mob-resist',   'Resistance', m.resistance,    'number')}
                ${formField('mob-crit',     'Crit%',      m.crit_chance,   'number', {step:'0.1'})}
            </div>

            ${sectionTitle('Movement & AI')}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${formField('mob-speed',      'Speed',        m.speed,          'number', {step:'0.1'})}
                ${formField('mob-atkrate',    'Attack ms',    m.attack_rate_ms, 'number')}
                ${formField('mob-aggro',      'Aggro Radius', m.aggro_radius,   'number')}
                ${formField('mob-moveset',    'Move Set',     m.move_set,       'number')}
                ${formField('mob-maxenergy',  'Max Energy',   m.max_energy,     'number')}
                ${formField('mob-enregen',    'Energy Regen%',m.energy_regen_pct,'number',{step:'0.1'})}
            </div>

            ${sectionTitle('Rewards')}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${formField('mob-exp',      'EXP Yield',  m.exp_yield,     'number')}
                ${formField('mob-goldmin',  'Gold Min',   m.gold_drop_min, 'number')}
                ${formField('mob-goldmax',  'Gold Max',   m.gold_drop_max, 'number')}
            </div>
            ${formField('mob-droplist', 'Drop List (itemId:chance%, ...)', m.droplist, 'textarea')}`;
    }

    function getMonsterFromForm() {
        return {
            id:               parseInt(getFormValue('mob-id')) || 0,
            name:             getFormValue('mob-name'),
            sprite_path:      getFormValue('mob-sprite'),
            zone:             getFormValue('mob-zone'),
            base_hp:          parseFloat(getFormValue('mob-hp'))       || 0,
            hp_regen:         parseFloat(getFormValue('mob-hpregen'))  || 0,
            damage:           parseFloat(getFormValue('mob-damage'))   || 0,
            defense:          parseFloat(getFormValue('mob-defense'))  || 0,
            resistance:       parseFloat(getFormValue('mob-resist'))   || 0,
            crit_chance:      parseFloat(getFormValue('mob-crit'))     || 0,
            speed:            parseFloat(getFormValue('mob-speed'))    || 1.2,
            attack_rate_ms:   parseInt(getFormValue('mob-atkrate'))    || 1000,
            aggro_radius:     parseInt(getFormValue('mob-aggro'))      || 350,
            move_set:         parseInt(getFormValue('mob-moveset'))    || 1,
            max_energy:       parseInt(getFormValue('mob-maxenergy'))  || 100,
            energy_regen_pct: parseFloat(getFormValue('mob-enregen'))  || 1,
            heal_skill_pct:   0,
            exp_yield:        parseInt(getFormValue('mob-exp'))        || 10,
            gold_drop_min:    parseInt(getFormValue('mob-goldmin'))    || 1,
            gold_drop_max:    parseInt(getFormValue('mob-goldmax'))    || 15,
            droplist:         getFormValue('mob-droplist') || ''
        };
    }

    window.adminSaveMonster = async function() {
        const mob = getMonsterFromForm();
        const res = await adminFetch('backend/admin/save_monster.php', {
            method: 'POST', body: JSON.stringify(mob)
        });
        const d = await res.json();
        if (d.success) {
            adminToast(mob.id ? '✔ Monster updated!' : '✔ Monster created!');
            selectedMonsterId = d.id;
            await loadMonsters();
            updateMonsterPreview(mob);
            // Recarrega dados do servidor se possível
            adminReloadServerData();
        } else {
            adminToast('✘ Error saving', '#ff4444');
        }
    };

    window.adminDeleteMonster = async function(id) {
        if (!confirm('Delete this monster permanently?')) return;
        const res = await adminFetch('backend/admin/delete_monster.php', {
            method: 'POST', body: JSON.stringify({ id })
        });
        const d = await res.json();
        if (d.success) {
            adminToast('🗑 Monster deleted', '#ffae00');
            selectedMonsterId = null;
            document.getElementById('adm-mob-form-inner').innerHTML =
                '<div style="color:rgba(255,255,255,0.3);text-align:center;margin-top:60px;font-size:12px;">Select a monster or create a new one.</div>';
            updateMonsterPreview(null);
            await loadMonsters();
            adminReloadServerData();
        }
    };

    window.adminDuplicateMonster = async function(id) {
        const m = adminData.monsters.find(x => x.id == id);
        if (!m) return;
        const copy = { ...m, id: 0, name: m.name + ' (Copy)' };
        selectedMonsterId = null;
        renderMonsterForm(copy);
        adminToast('📋 Duplicate ready — click Save to create', '#ffae00');
    };

    window.adminPreviewSprite = function() {
        const path = getFormValue('mob-sprite');
        updateMonsterPreview({ sprite_path: path, name: getFormValue('mob-name') || '?' });
    };

    window.adminSpawnMonster = function() {
        const m = adminData.monsters.find(x => x.id == selectedMonsterId);
        if (!m) return;
        const ws = window.gameWs || window.combatWs;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'admin_spawn', monsterId: m.id }));
            adminToast(`⚡ Spawn requested: ${m.name}`);
        } else {
            adminToast('WebSocket not connected', '#ff4444');
        }
    };

    function updateMonsterPreview(m) {
        const preview = document.getElementById('adm-mob-sprite-preview');
        const name    = document.getElementById('adm-mob-preview-name');
        const stats   = document.getElementById('adm-mob-preview-stats');
        const spawnBtn= document.getElementById('adm-mob-spawn-btn');

        if (!m || !m.sprite_path) {
            if (preview) preview.innerHTML = '<span style="color:rgba(255,255,255,0.2);font-size:30px;">?</span>';
            if (name) name.innerText = '';
            if (stats) stats.innerText = '';
            if (spawnBtn) spawnBtn.style.display = 'none';
            return;
        }
        if (preview) preview.innerHTML = `<img src="${m.sprite_path}" style="width:80px;height:80px;object-fit:contain;" onerror="this.src='';this.parentNode.innerHTML='<span style=color:rgba(255,255,255,0.2)>No img</span>'">`;
        if (name) name.innerText = m.name || '';
        if (stats) stats.innerHTML = m.base_hp ? `HP: ${m.base_hp}<br>DMG: ${m.damage}<br>EXP: ${m.exp_yield}<br>Zone: ${m.zone}` : '';
        if (spawnBtn) spawnBtn.style.display = selectedMonsterId ? 'block' : 'none';
    }

    // ─────────────────────────────────────────────────────────────
    // ██████████████ TAB: RACES ███████████████████████████████████
    // ─────────────────────────────────────────────────────────────
    function renderRacePanel() {
        const panel = document.getElementById('admin-tab-races');
        if (!panel) return;
        panel.style.cssText = 'display:none;width:100%;height:100%;overflow:hidden;';
        panel.innerHTML = `
            <div id="adm-race-list-col" style="width:200px;min-width:200px;border-right:1px solid rgba(255,255,255,0.06);
                 display:flex;flex-direction:column;height:100%;overflow:hidden;">
                <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:6px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);
                                 flex:1;display:flex;align-items:center;">RACES</span>
                    <button onclick="adminNewRace()" style="${btnStyle('#00e5ff','padding:5px 8px;')}" title="New Race">+</button>
                </div>
                <div id="adm-race-list" style="overflow-y:auto;flex:1;padding:6px 4px;"></div>
            </div>
            <div id="adm-race-form-col" style="flex:1;overflow-y:auto;padding:14px 16px;">
                <div id="adm-race-form-inner" style="color:rgba(255,255,255,0.3);text-align:center;margin-top:60px;font-size:12px;">
                    Select a race from the list.
                </div>
            </div>
            <div style="width:160px;min-width:160px;border-left:1px solid rgba(255,255,255,0.06);
                 padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;">
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(200,200,200,0.4);">Preview</div>
                <div id="adm-race-sprite-preview" style="width:80px;height:80px;background:rgba(255,255,255,0.03);
                     border:1px solid rgba(255,255,255,0.08);border-radius:50%;display:flex;
                     align-items:center;justify-content:center;overflow:hidden;">
                    <span style="color:rgba(255,255,255,0.2);font-size:28px;">?</span>
                </div>
                <div id="adm-race-preview-name" style="font-size:11px;color:#fff;text-align:center;font-weight:600;"></div>
            </div>`;
    }

    async function loadRaces() {
        const res = await adminFetch('backend/admin/get_races.php');
        const d = await res.json();
        if (!d.success) return;
        adminData.races = d.races;
        renderRaceList();
    }

    function renderRaceList() {
        const list = document.getElementById('adm-race-list');
        if (!list) return;
        list.innerHTML = adminData.races.map(r => `
            <div onclick="adminSelectRace(${r.id})"
                 style="padding:8px 10px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:8px;
                        margin-bottom:2px;background:${selectedRaceId == r.id ? 'rgba(0,229,255,0.08)' : 'transparent'};
                        border-left:2px solid ${selectedRaceId == r.id ? '#00e5ff' : 'transparent'};transition:0.1s;">
                <img src="${r.sprite_path}" style="width:32px;height:32px;object-fit:contain;flex-shrink:0;"
                     onerror="this.style.opacity='0.2'">
                <div style="font-size:11px;color:#ccc;">${r.name}</div>
            </div>`).join('');
    }

    window.adminSelectRace = function(id) {
        selectedRaceId = id;
        renderRaceList();
        const r = adminData.races.find(x => x.id == id);
        if (!r) return;
        renderRaceForm(r);
        updateRacePreview(r);
    };

    window.adminNewRace = function() {
        selectedRaceId = null;
        renderRaceList();
        renderRaceForm({ id: 0, name: 'New Race', description: '', sprite_path: 'img/races/human.png',
                         base_hp_modifier: 1, base_damage_modifier: 1, base_speed_modifier: 1 });
    };

    function renderRaceForm(r) {
        const el = document.getElementById('adm-race-form-inner');
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">${r.id ? `Edit: ${r.name}` : 'New Race'}</div>
                <div style="display:flex;gap:6px;">
                    <button onclick="adminSaveRace()" style="${btnStyle('#00e676')}">💾 Save</button>
                    ${r.id ? `<button onclick="adminDeleteRace(${r.id})" style="${btnStyle('#ff4444')}">🗑 Delete</button>` : ''}
                </div>
            </div>
            <input type="hidden" id="race-id" value="${r.id}">
            ${sectionTitle('Identity')}
            ${formField('race-name', 'Name', r.name)}
            <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
                ${formField('race-sprite', 'Sprite Path', r.sprite_path)}
                <div style="margin-bottom:8px;">
                    <button onclick="adminPreviewRaceSprite()" style="${btnStyle('#888','padding:5px 10px;')}">👁</button>
                </div>
            </div>
            ${formField('race-desc', 'Description', r.description, 'textarea')}
            ${sectionTitle('Base Modifiers (multipliers)')}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${formField('race-hp-mod',  'HP Modifier',     r.base_hp_modifier,     'number', {step:'0.05'})}
                ${formField('race-dmg-mod', 'Damage Modifier', r.base_damage_modifier, 'number', {step:'0.05'})}
                ${formField('race-spd-mod', 'Speed Modifier',  r.base_speed_modifier,  'number', {step:'0.05'})}
            </div>`;
    }

    window.adminSaveRace = async function() {
        const data = {
            id:                    parseInt(getFormValue('race-id')) || 0,
            name:                  getFormValue('race-name'),
            description:           getFormValue('race-desc'),
            sprite_path:           getFormValue('race-sprite'),
            base_hp_modifier:      parseFloat(getFormValue('race-hp-mod'))  || 1,
            base_damage_modifier:  parseFloat(getFormValue('race-dmg-mod')) || 1,
            base_speed_modifier:   parseFloat(getFormValue('race-spd-mod')) || 1,
        };
        const res = await adminFetch('backend/admin/save_race.php', {
            method: 'POST', body: JSON.stringify(data)
        });
        const d = await res.json();
        if (d.success) {
            adminToast('✔ Race saved!');
            selectedRaceId = d.id;
            await loadRaces();
        } else {
            adminToast('✘ Error', '#ff4444');
        }
    };

    window.adminDeleteRace = async function(id) {
        if (!confirm('Delete this race?')) return;
        // Races não têm endpoint delete separado — usa save_race com flag delete
        // Por segurança apenas avisamos
        adminToast('⚠ To delete a race, remove from DB directly.', '#ffae00');
    };

    window.adminPreviewRaceSprite = function() {
        const r = { sprite_path: getFormValue('race-sprite'), name: getFormValue('race-name') };
        updateRacePreview(r);
    };

    function updateRacePreview(r) {
        const preview = document.getElementById('adm-race-sprite-preview');
        const name    = document.getElementById('adm-race-preview-name');
        if (preview) preview.innerHTML = `<img src="${r.sprite_path}" style="width:72px;height:72px;object-fit:contain;"
            onerror="this.src='';this.parentNode.innerHTML='<span style=color:rgba(255,255,255,0.2)>?</span>'">`;
        if (name) name.innerText = r.name || '';
    }

    // ─────────────────────────────────────────────────────────────
    // ██████████████ TAB: SKILLS ██████████████████████████████████
    // ─────────────────────────────────────────────────────────────
    function renderSkillPanel() {
        const panel = document.getElementById('admin-tab-skills');
        if (!panel) return;
        panel.style.cssText = 'display:none;width:100%;height:100%;overflow:hidden;';
        panel.innerHTML = `
            <div id="adm-skill-list-col" style="width:210px;min-width:210px;border-right:1px solid rgba(255,255,255,0.06);
                 display:flex;flex-direction:column;height:100%;overflow:hidden;">
                <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <select id="adm-skill-race-filter" onchange="adminFilterSkills(this.value)"
                            style="${inputStyle('margin-bottom:6px;')}">
                        <option value="All">All Races</option>
                        <option>Orc</option><option>Elf</option><option>Human</option><option>Dwarf</option>
                    </select>
                    <div style="display:flex;gap:6px;">
                        <input id="adm-skill-search" placeholder="Search..." style="${inputStyle('flex:1;')}" oninput="renderSkillList()">
                        <button onclick="adminNewSkill()" style="${btnStyle('#00e5ff','padding:5px 8px;')}" title="New Skill">+</button>
                    </div>
                </div>
                <div id="adm-skill-list" style="overflow-y:auto;flex:1;padding:6px 4px;"></div>
            </div>
            <div id="adm-skill-form-col" style="flex:1;overflow-y:auto;padding:14px 16px;">
                <div id="adm-skill-form-inner" style="color:rgba(255,255,255,0.3);text-align:center;margin-top:60px;font-size:12px;">
                    Select a skill from the list.
                </div>
            </div>
            <div style="width:150px;min-width:150px;border-left:1px solid rgba(255,255,255,0.06);
                 padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;">
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(200,200,200,0.4);">Icon</div>
                <div id="adm-skill-icon-preview" style="width:64px;height:64px;background:rgba(255,255,255,0.03);
                     border:1px solid rgba(255,255,255,0.1);border-radius:8px;display:flex;
                     align-items:center;justify-content:center;overflow:hidden;">
                    <span style="font-size:28px;">⚡</span>
                </div>
                <div id="adm-skill-preview-name" style="font-size:10px;color:#ccc;text-align:center;"></div>
            </div>`;
    }

    async function loadSkills() {
        const res = await adminFetch('backend/admin/get_skills.php');
        const d = await res.json();
        if (!d.success) return;
        adminData.skills = d.skills;
        renderSkillList();
    }

    window.adminFilterSkills = function(race) {
        skillRaceFilter = race;
        renderSkillList();
    };

    window.renderSkillList = function() {
        const list = document.getElementById('adm-skill-list');
        if (!list) return;
        const search = (document.getElementById('adm-skill-search')?.value || '').toLowerCase();
        const filtered = adminData.skills.filter(s =>
            (skillRaceFilter === 'All' || s.race_owner === skillRaceFilter) &&
            s.skill_name.toLowerCase().includes(search));

        list.innerHTML = filtered.map(s => `
            <div onclick="adminSelectSkill(${s.id})"
                 style="padding:6px 8px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:8px;
                        margin-bottom:2px;background:${selectedSkillId == s.id ? 'rgba(0,229,255,0.08)' : 'transparent'};
                        border-left:2px solid ${selectedSkillId == s.id ? '#00e5ff' : 'transparent'};transition:0.1s;">
                <img src="${s.icon_path}" style="width:26px;height:26px;object-fit:contain;flex-shrink:0;"
                     onerror="this.style.opacity='0.2'">
                <div>
                    <div style="font-size:11px;color:#ccc;">${s.skill_name}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.3);">${s.race_owner} · ${s.skill_type}</div>
                </div>
            </div>`).join('');
    };

    window.adminSelectSkill = function(id) {
        selectedSkillId = id;
        renderSkillList();
        const s = adminData.skills.find(x => x.id == id);
        if (!s) return;
        renderSkillForm(s);
        updateSkillPreview(s);
    };

    window.adminNewSkill = function() {
        selectedSkillId = null;
        renderSkillList();
        renderSkillForm({ id: 0, race_owner: 'Human', skill_name: 'New Skill', skill_type: 'Active',
                          keyboard_key: '', mana_cost: 20, cooldown_ms: 5000, base_damage: 0,
                          icon_path: 'img/skills/default.png', description: '' });
    };

    function renderSkillForm(s) {
        const el = document.getElementById('adm-skill-form-inner');
        if (!el) return;
        const races = ['Human','Orc','Elf','Dwarf','Demon','Undead','All'];
        const types = ['Active','Passive'];
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">${s.id ? `Edit: ${s.skill_name}` : 'New Skill'}</div>
                <div style="display:flex;gap:6px;">
                    <button onclick="adminSaveSkill()" style="${btnStyle('#00e676')}">💾 Save</button>
                    ${s.id ? `<button onclick="adminDeleteSkill(${s.id})" style="${btnStyle('#ff4444')}">🗑 Delete</button>` : ''}
                </div>
            </div>
            <input type="hidden" id="skill-id" value="${s.id}">
            ${sectionTitle('Identity')}
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                ${formField('skill-name',  'Skill Name',   s.skill_name,  'text')}
                ${formField('skill-race',  'Race Owner',   s.race_owner,  'select', { choices: races })}
                ${formField('skill-type',  'Type',         s.skill_type,  'select', { choices: types })}
            </div>
            <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
                ${formField('skill-icon', 'Icon Path', s.icon_path)}
                <div style="margin-bottom:8px;">
                    <button onclick="adminPreviewSkillIcon()" style="${btnStyle('#888','padding:5px 10px;')}">👁</button>
                </div>
            </div>
            ${sectionTitle('Numbers')}
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                ${formField('skill-key',      'Key',         s.keyboard_key, 'text')}
                ${formField('skill-mana',     'Mana Cost',   s.mana_cost,    'number')}
                ${formField('skill-cd',       'Cooldown ms', s.cooldown_ms,  'number')}
                ${formField('skill-basedmg',  'Base Damage', s.base_damage,  'number')}
            </div>
            ${formField('skill-desc', 'Description', s.description, 'textarea')}`;
    }

    window.adminSaveSkill = async function() {
        const data = {
            id:           parseInt(getFormValue('skill-id')) || 0,
            skill_name:   getFormValue('skill-name'),
            race_owner:   getFormValue('skill-race'),
            skill_type:   getFormValue('skill-type'),
            keyboard_key: getFormValue('skill-key'),
            mana_cost:    parseInt(getFormValue('skill-mana'))    || 0,
            cooldown_ms:  parseInt(getFormValue('skill-cd'))      || 1000,
            base_damage:  parseInt(getFormValue('skill-basedmg')) || 0,
            icon_path:    getFormValue('skill-icon'),
            description:  getFormValue('skill-desc')
        };
        const res = await adminFetch('backend/admin/save_skill.php', {
            method: 'POST', body: JSON.stringify(data)
        });
        const d = await res.json();
        if (d.success) {
            adminToast('✔ Skill saved!');
            selectedSkillId = d.id;
            await loadSkills();
        } else {
            adminToast('✘ Error', '#ff4444');
        }
    };

    window.adminDeleteSkill = async function(id) {
        if (!confirm('Delete this skill?')) return;
        // Reusa save com delete request - ou chamamos diretamente
        adminToast('⚠ Delete skill via phpMyAdmin for safety.', '#ffae00');
    };

    window.adminPreviewSkillIcon = function() {
        updateSkillPreview({ icon_path: getFormValue('skill-icon'), skill_name: getFormValue('skill-name') });
    };

    function updateSkillPreview(s) {
        const preview = document.getElementById('adm-skill-icon-preview');
        const name    = document.getElementById('adm-skill-preview-name');
        if (preview) preview.innerHTML = `<img src="${s.icon_path}" style="width:56px;height:56px;object-fit:contain;"
            onerror="this.innerHTML='<span style=font-size:24px>⚡</span>'">`;
        if (name) name.innerText = s.skill_name || '';
    }

    // ─────────────────────────────────────────────────────────────
    // ██████████████ TAB: PLAYERS █████████████████████████████████
    // ─────────────────────────────────────────────────────────────
    function renderPlayerPanel() {
        const panel = document.getElementById('admin-tab-players');
        if (!panel) return;
        panel.style.cssText = 'display:none;width:100%;height:100%;overflow:hidden;';
        panel.innerHTML = `
            <div id="adm-player-list-col" style="width:220px;min-width:220px;border-right:1px solid rgba(255,255,255,0.06);
                 display:flex;flex-direction:column;height:100%;overflow:hidden;">
                <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);">PLAYERS</span>
                </div>
                <div id="adm-player-list" style="overflow-y:auto;flex:1;padding:6px 4px;"></div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:14px 16px;">
                <div id="adm-player-form-inner" style="color:rgba(255,255,255,0.3);text-align:center;margin-top:60px;font-size:12px;">
                    Select a player to edit their data.
                </div>
            </div>`;
    }

    async function loadPlayers() {
        const res = await adminFetch('backend/admin/get_players.php');
        const d = await res.json();
        if (!d.success) return;
        adminData.players = d.players;
        renderPlayerList();
    }

    function renderPlayerList() {
        const list = document.getElementById('adm-player-list');
        if (!list) return;
        list.innerHTML = adminData.players.map(p => `
            <div onclick="adminSelectPlayer(${p.id})"
                 style="padding:8px 10px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:8px;
                        margin-bottom:2px;background:${selectedPlayerId == p.id ? 'rgba(0,229,255,0.08)' : 'transparent'};
                        border-left:2px solid ${selectedPlayerId == p.id ? '#00e5ff' : 'transparent'};transition:0.1s;">
                <img src="${p.sprite_path}" style="width:28px;height:28px;object-fit:contain;border-radius:50%;flex-shrink:0;"
                     onerror="this.style.opacity='0.2'">
                <div>
                    <div style="font-size:11px;color:${p.is_admin ? '#ffae00' : '#ccc'};">
                        ${p.is_admin ? '🛡️ ' : ''}${p.username}
                    </div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.3);">Lv${p.level} ${p.race}</div>
                </div>
            </div>`).join('');
    }

    window.adminSelectPlayer = function(id) {
        selectedPlayerId = id;
        renderPlayerList();
        const p = adminData.players.find(x => x.id == id);
        if (!p) return;
        renderPlayerForm(p);
    };

    function renderPlayerForm(p) {
        const el = document.getElementById('adm-player-form-inner');
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">
                    <img src="${p.sprite_path}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;border-radius:50%;margin-right:8px;"
                         onerror="this.style.display='none'">
                    ${p.username}
                    <span style="font-size:10px;color:rgba(255,255,255,0.4);margin-left:8px;">(id: ${p.id})</span>
                </div>
                <button onclick="adminSavePlayer(${p.id})" style="${btnStyle('#00e676')}">💾 Save</button>
            </div>
            <input type="hidden" id="pl-id" value="${p.id}">

            ${sectionTitle('Progression')}
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                ${formField('pl-level', 'Level', p.level, 'number')}
                ${formField('pl-xp',    'XP',    p.xp,    'number')}
                ${formField('pl-gold',  'Gold',  p.gold,  'number')}
                ${formField('pl-kills', 'Kills', p.kills, 'number')}
            </div>

            ${sectionTitle('Vitals')}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${formField('pl-maxhp',     'Max HP',     p.max_hp,          'number')}
                ${formField('pl-hp',        'Current HP', p.current_hp,      'number')}
                ${formField('pl-maxmana',   'Max Mana',   p.max_mana,        'number')}
                ${formField('pl-mana',      'Current MP', p.current_mana,    'number')}
                ${formField('pl-maxen',     'Max Energy', p.max_energy,      'number')}
                ${formField('pl-energy',    'Current EP', p.current_energy,  'number')}
            </div>

            ${sectionTitle('Stats')}
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                ${formField('pl-statpts', 'Stat Points', p.stat_points, 'number')}
                ${formField('pl-str',     'STR',         p.stat_str,    'number')}
                ${formField('pl-dex',     'DEX',         p.stat_dex,    'number')}
                ${formField('pl-con',     'CON',         p.stat_con,    'number')}
                ${formField('pl-int',     'INT',         p.stat_int,    'number')}
                ${formField('pl-wis',     'WIS',         p.stat_wis,    'number')}
                ${formField('pl-cha',     'CHA',         p.stat_cha,    'number')}
                ${formField('pl-aur',     'AUR',         p.stat_aur,    'number')}
            </div>

            ${sectionTitle('World')}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${formField('pl-zone',   'Current Zone', p.current_zone, 'text')}
                ${formField('pl-alive',  'Is Alive (1/0)',p.is_alive,    'number')}
            </div>`;
    }

    window.adminSavePlayer = async function(id) {
        const data = {
            id,
            level:          parseInt(getFormValue('pl-level'))  || 1,
            xp:             parseInt(getFormValue('pl-xp'))     || 0,
            gold:           parseInt(getFormValue('pl-gold'))   || 0,
            kills:          parseInt(getFormValue('pl-kills'))  || 0,
            max_hp:         parseInt(getFormValue('pl-maxhp'))  || 100,
            current_hp:     parseInt(getFormValue('pl-hp'))     || 100,
            max_mana:       parseInt(getFormValue('pl-maxmana'))|| 100,
            current_mana:   parseInt(getFormValue('pl-mana'))   || 100,
            max_energy:     parseInt(getFormValue('pl-maxen'))  || 100,
            current_energy: parseInt(getFormValue('pl-energy')) || 100,
            stat_points:    parseInt(getFormValue('pl-statpts'))|| 0,
            stat_str:       parseInt(getFormValue('pl-str'))    || 0,
            stat_dex:       parseInt(getFormValue('pl-dex'))    || 0,
            stat_con:       parseInt(getFormValue('pl-con'))    || 0,
            stat_int:       parseInt(getFormValue('pl-int'))    || 0,
            stat_wis:       parseInt(getFormValue('pl-wis'))    || 0,
            stat_cha:       parseInt(getFormValue('pl-cha'))    || 0,
            stat_aur:       parseInt(getFormValue('pl-aur'))    || 0,
            current_zone:   getFormValue('pl-zone'),
            is_alive:       parseInt(getFormValue('pl-alive'))  || 1,
        };
        const res = await adminFetch('backend/admin/edit_player.php', {
            method: 'POST', body: JSON.stringify(data)
        });
        const d = await res.json();
        d.success ? adminToast('✔ Player saved!') : adminToast('✘ Error', '#ff4444');
    };

    // ─────────────────────────────────────────────────────────────
    // ██████████████ TAB: SETTINGS ████████████████████████████████
    // ─────────────────────────────────────────────────────────────
    function renderSettingsPanel() {
        const panel = document.getElementById('admin-tab-settings');
        if (!panel) return;
        panel.style.cssText = 'display:none;width:100%;height:100%;overflow-y:auto;padding:14px 20px;box-sizing:border-box;flex-direction:column;';
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">⚙️ Global Settings</div>
                <button onclick="adminReloadServerData()" style="${btnStyle('#ffae00')}">🔄 Reload Server Data</button>
            </div>
            <div id="adm-settings-table"></div>`;
    }

    async function loadSettings() {
        const res = await adminFetch('backend/admin/get_settings.php');
        const d = await res.json();
        if (!d.success) return;
        adminData.settings = d.settings;
        renderSettingsTable();
    }

    function renderSettingsTable() {
        const el = document.getElementById('adm-settings-table');
        if (!el) return;
        el.innerHTML = adminData.settings.map(s => `
            <div style="display:grid;grid-template-columns:200px 1fr 200px auto;gap:10px;align-items:center;
                        padding:8px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px;">
                <div>
                    <div style="font-size:11px;color:#fff;font-weight:600;">${s.config_key}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.3);">${s.description || ''}</div>
                </div>
                <input id="cfg-${s.config_key}" value="${s.config_value}"
                       style="${inputStyle()}" onkeydown="if(event.key==='Enter') adminSaveSetting('${s.config_key}')">
                <div style="font-size:9px;color:rgba(255,255,255,0.2);">Current: ${s.config_value}</div>
                <button onclick="adminSaveSetting('${s.config_key}')" style="${btnStyle('#00e676','padding:4px 10px;')}">Save</button>
            </div>`).join('');
    }

    window.adminSaveSetting = async function(key) {
        const value = document.getElementById(`cfg-${key}`)?.value;
        if (value === undefined) return;
        const res = await adminFetch('backend/admin/get_settings.php', {
            method: 'POST', body: JSON.stringify({ key, value })
        });
        const d = await res.json();
        d.success ? adminToast(`✔ ${key} updated!`) : adminToast('✘ Error', '#ff4444');
        if (d.success) await loadSettings();
    };

    // ─────────────────────────────────────────────────────────────
    // RELOAD SERVER DATA (via WebSocket)
    // ─────────────────────────────────────────────────────────────
    window.adminReloadServerData = function() {
        const ws = window.gameWs || window.combatWs;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'admin_reload' }));
            adminToast('🔄 Reload signal sent to server');
        } else {
            adminToast('WebSocket offline — restart server manually.', '#ffae00');
        }
    };

    // ─────────────────────────────────────────────────────────────
    // DRAGGABLE (reutiliza a lógica existente do game.php)
    // A janela já tem classe .draggable-window — o setup é automático
    // ─────────────────────────────────────────────────────────────
    function setupDraggable() {
        // O game.php já tem lógica de drag para .draggable-window — nada a fazer
    }

    // ─────────────────────────────────────────────────────────────
    // BOOT
    // ─────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
