window.draggedSlot = null;
window.equipmentStats = {};

window.buildBagSlots = function() {
    const bagContainer = document.getElementById('bag-container');
    if (bagContainer) {
        bagContainer.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            let slot = document.createElement('div');
            slot.className = 'slot bag-slot empty-slot';
            slot.innerHTML = '<span style="opacity: 0.1; font-size: 10px;">⚫</span>';
            slot.draggable = true;
            
            slot.addEventListener('dragstart', function(e) {
                if (this.classList.contains('empty-slot')) { e.preventDefault(); return; }
                window.draggedSlot = this;
                e.dataTransfer.effectAllowed = 'move';
                // Passa o item_id para drops em outros elementos (char sheet)
                if (this.dataset.itemId) e.dataTransfer.setData('text/plain', this.dataset.itemId);
                setTimeout(() => this.style.opacity = '0.4', 0);
            });
            
            slot.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                return false;
            });
            
            slot.addEventListener('dragenter', function(e) {
                if (window.draggedSlot !== this) this.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', function(e) {
                this.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.remove('drag-over');
                
                if (window.draggedSlot !== this && window.draggedSlot) {
                    let sourceId = window.draggedSlot.dataset.itemId;
                    let targetCat = this.dataset.equipCategory; 
                    let sourceCat = window.draggedSlot.dataset.equipCategory;

                    if (sourceId) {
                        try {
                            if (targetCat) {
                                await fetch('backend/api_inventory.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'equip', item_id: sourceId, slot: targetCat })
                                });
                            } else if (sourceCat && !targetCat) {
                                await fetch('backend/api_inventory.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'unequip', item_id: sourceId })
                                });
                            }
                            window.loadInventoryData();
                        } catch(err) {}
                    }
                }
                return false;
            });
            
            slot.addEventListener('dragend', function(e) {
                this.style.opacity = '1';
                document.querySelectorAll('.bag-slot, .equip-grid-layout .slot').forEach(s => s.classList.remove('drag-over'));
                window.draggedSlot = null;
            });

            bagContainer.appendChild(slot);
        }

        document.querySelectorAll('.equip-grid-layout .slot').forEach(eqSlot => {
            eqSlot.draggable = true;
            eqSlot.dataset.equipCategory = eqSlot.id.replace('eq-', '');
            
            eqSlot.addEventListener('dragstart', function(e) {
                if (this.classList.contains('empty-slot')) { e.preventDefault(); return; }
                window.draggedSlot = this;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => this.style.opacity = '0.4', 0);
            });
            
            eqSlot.addEventListener('dragover', function(e) { e.preventDefault(); return false; });
            
            eqSlot.addEventListener('dragenter', function(e) {
                if (window.draggedSlot !== this) this.classList.add('drag-over');
            });
            
            eqSlot.addEventListener('dragleave', function(e) {
                this.classList.remove('drag-over');
            });
            
            eqSlot.addEventListener('drop', async function(e) {
                e.preventDefault(); 
                e.stopPropagation(); 
                this.classList.remove('drag-over');
                
                if (window.draggedSlot !== this && window.draggedSlot) {
                    let sourceId = window.draggedSlot.dataset.itemId;
                    let targetCat = this.dataset.equipCategory;
                    
                    if (sourceId && targetCat) {
                        try {
                            await fetch('backend/api_inventory.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'equip', item_id: sourceId, slot: targetCat })
                            });
                            window.loadInventoryData();
                        } catch(err) {}
                    }
                }
                return false;
            });
            
            eqSlot.addEventListener('dragend', function(e) {
                this.style.opacity = '1';
                document.querySelectorAll('.bag-slot, .equip-grid-layout .slot').forEach(s => s.classList.remove('drag-over'));
                window.draggedSlot = null;
            });
        });
    }
};

window.loadInventoryData = async function() {
    try {
        const res = await fetch('backend/api_inventory.php');
        const data = await res.json();
        
        if (data.success) {
            const items = data.inventory;
            // Salva globalmente para uso na character sheet
            window._lastInventory = items;
            window._bagUsed = items.filter(i => i.is_equipped == 0).length;

            const bagSlots = document.querySelectorAll('.bag-slot');

            bagSlots.forEach(slot => {
                slot.className = 'slot bag-slot empty-slot';
                slot.title = '';
                slot.innerHTML = '<span style="opacity: 0.1; font-size: 10px;">⚫</span>';
                slot.style.cssText = '';
                slot.removeAttribute('data-item-id');
            });

            window.equipmentStats = {
                attr_vitality: 0, attr_power: 0, attr_single_target: 0, attr_area_damage: 0,
                attr_melee: 0, attr_range: 0, attr_critical: 0, attr_critical_damage: 0,
                attr_resist: 0, attr_dodge: 0, attr_loot: 0, attr_xp_bonus: 0,
                max_hp: 0, max_mana: 0, max_energy: 0, base_damage: 0
            };

            let equippedItems   = items.filter(i => i.is_equipped == 1);
            let unequippedItems = items.filter(i => i.is_equipped == 0);

            // Agrupa bag por nome (stack)
            let groupedBag = {};
            unequippedItems.forEach(item => {
                let key = item.item_name;
                if (!groupedBag[key]) groupedBag[key] = { ...item, count: 1 };
                else groupedBag[key].count++;
            });

            // Soma stats dos equipados
            equippedItems.forEach(item => {
                const statsRaw = item.tpl_stats || item.stats_json || null;
                if (statsRaw) {
                    try {
                        let stats = JSON.parse(statsRaw);
                        for (let key in stats) {
                            if (window.equipmentStats[key] !== undefined) window.equipmentStats[key] += parseFloat(stats[key]);
                            else window.equipmentStats[key] = parseFloat(stats[key]);
                        }
                    } catch(e) {}
                }
            });

            // Preenche bag slots
            let bagIndex = 0;
            Object.values(groupedBag).forEach(item => {
                if (bagIndex >= 20) return;
                let bSlot = bagSlots[bagIndex];
                if (!bSlot) return;
                bSlot.dataset.itemId = item.id;
                bSlot.classList.remove('empty-slot');
                bSlot.classList.add(item.rarity.toLowerCase());
                bSlot.title = `${item.item_name} (${item.rarity})`;

                let imgStyle  = "width:80%;height:80%;object-fit:contain;pointer-events:none;";
                let fallback  = 'img/items/default.png';
                let iconPath  = item.icon_path || fallback;

                if ((item.category||'').toLowerCase() === 'fragment' || item.item_name.toLowerCase().includes('fragment')) {
                    bSlot.style.borderColor     = 'rgba(255,64,176,0.5)';
                    bSlot.style.backgroundColor = 'rgba(255,64,176,0.04)';
                    imgStyle += " filter:brightness(0.5) drop-shadow(0 0 6px rgba(255,64,176,0.8));";
                    const rn = item.item_name.toLowerCase();
                    if (rn.includes('human') || rn.includes('humano')) iconPath = 'img/races/humano.png';
                    else if (rn.includes('elf') || rn.includes('elfo')) iconPath = 'img/races/elfo.png';
                    else if (rn.includes('orc')) iconPath = 'img/races/orc.png';
                    else if (rn.includes('dwarf') || rn.includes('anao') || rn.includes('anão')) iconPath = 'img/races/anao.png';
                }

                const countBadge = item.count > 1
                    ? `<div style="position:absolute;bottom:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:rgba(20,20,20,0.95);border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:9px;font-weight:bold;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none;">${item.count}</div>`
                    : '';

                bSlot.innerHTML = `<img src="${iconPath}" style="${imgStyle}" onerror="this.src='${fallback}'">${countBadge}`;
                bagIndex++;
            });

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            // Re-render char sheet se estiver aberta
            const charWin = document.getElementById('window-character');
            if (charWin && !charWin.classList.contains('hidden') && typeof window.renderCharacterSheet === 'function') {
                window.renderCharacterSheet();
            }
        }
    } catch(e) {}
};

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        window.buildBagSlots();
        window.loadInventoryData();
    });
} else {
    window.buildBagSlots();
    window.loadInventoryData();
}