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
            const bagSlots = document.querySelectorAll('.bag-slot');
            let bagIndex = 0;

            const equipDefaults = {
                'pet': '🐲',
                'wing': '🪽',
                'aura': '✨',
                'trail': '☄️',
                'halo': '💫'
            };

            const equipCategories = ['pet', 'wing', 'aura', 'trail', 'halo'];
            equipCategories.forEach(cat => {
                let eqSlot = document.getElementById(`eq-${cat}`);
                if (eqSlot) {
                    eqSlot.className = 'slot empty-slot';
                    eqSlot.title = cat.charAt(0).toUpperCase() + cat.slice(1);
                    eqSlot.innerHTML = equipDefaults[cat] || ''; 
                    eqSlot.style.borderColor = '';
                    eqSlot.style.backgroundColor = '';
                    eqSlot.style.boxShadow = '';
                    eqSlot.removeAttribute('data-item-id');
                }
            });

            document.querySelectorAll('.equip-overlay').forEach(el => el.remove());
            const charPreviewBox = document.querySelector('.char-preview-box');
            const mainCharImg = document.getElementById('ui-preview-img');
            if (mainCharImg) {
                mainCharImg.style.position = 'relative';
                mainCharImg.style.zIndex = '5'; 
            }

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

            let equippedItems = items.filter(i => i.is_equipped == 1);
            let unequippedItems = items.filter(i => i.is_equipped == 0);

            let groupedBag = {};
            unequippedItems.forEach(item => {
                let key = item.item_name;
                if (!groupedBag[key]) {
                    groupedBag[key] = { ...item, count: 1 };
                } else {
                    groupedBag[key].count++;
                }
            });

            equippedItems.forEach(item => {
                let catId = item.category.toLowerCase();
                
                if (catId === 'wings') catId = 'wing';
                if (catId === 'auras') catId = 'aura';
                if (catId === 'pets') catId = 'pet';
                if (catId === 'trails') catId = 'trail';
                if (catId === 'halos') catId = 'halo';

                if (item.stats_json) {
                    try {
                        let stats = JSON.parse(item.stats_json);
                        for (let key in stats) {
                            if (window.equipmentStats[key] !== undefined) {
                                window.equipmentStats[key] += parseFloat(stats[key]);
                            } else {
                                window.equipmentStats[key] = parseFloat(stats[key]);
                            }
                        }
                    } catch(e) {}
                }

                let iconPath = item.icon_path || 'img/items/default.png';
                let equipPath = item.equip_path || 'img/equip/default.png';
                let imgTag = `<img src="${iconPath}" style="width: 80%; height: 80%; object-fit: contain; pointer-events: none;" onerror="this.onerror=null; this.src='img/items/default.png';">`;

                let eqSlot = document.getElementById(`eq-${catId}`);
                if (eqSlot && equipCategories.includes(catId)) {
                    eqSlot.dataset.itemId = item.id;
                    eqSlot.classList.remove('empty-slot');
                    eqSlot.classList.add(item.rarity.toLowerCase());
                    eqSlot.title = `${item.item_name} (${item.rarity})`;
                    eqSlot.innerHTML = imgTag;

                    if (equipPath && equipPath !== 'img/equip/default.png') {
                        let overlay = document.createElement('img');
                        overlay.src = equipPath;
                        overlay.className = 'equip-overlay';
                        Object.assign(overlay.style, { position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' });
                        if (catId === 'wing' || catId === 'aura' || catId === 'trail') {
                            overlay.style.zIndex = '0';
                        } else {
                            overlay.style.zIndex = '10';
                        }
                        charPreviewBox.appendChild(overlay);
                    }
                }
            });

            Object.values(groupedBag).forEach(item => {
                if (bagIndex < 20) {
                    let bSlot = bagSlots[bagIndex];
                    bSlot.dataset.itemId = item.id;
                    bSlot.classList.remove('empty-slot');
                    bSlot.classList.add(item.rarity.toLowerCase());
                    bSlot.title = `${item.item_name} (${item.rarity})`;

                    let imgStyle = "width: 80%; height: 80%; object-fit: contain; pointer-events: none;";
                    let fallbackImg = 'img/items/default.png';
                    let finalIconPath = item.icon_path || fallbackImg;

                    if (item.category.toLowerCase() === 'fragment' || item.item_name.toLowerCase().includes('fragment')) {
                        bSlot.classList.remove(item.rarity.toLowerCase()); 
                        bSlot.style.borderColor = 'rgba(255, 64, 176, 0.6)'; 
                        bSlot.style.backgroundColor = 'rgba(255, 64, 176, 0.05)';
                        bSlot.style.boxShadow = 'inset 0 0 10px rgba(255, 64, 176, 0.2)';

                        imgStyle += " filter: brightness(0.45) contrast(1.2) opacity(0.95) drop-shadow(0 0 8px rgba(255, 64, 176, 0.8)); transform: scale(0.85);";
                        
                        let itemNameLower = item.item_name.toLowerCase();
                        let rName = '';
                        if (itemNameLower.includes('humano') || itemNameLower.includes('human')) rName = 'humano';
                        else if (itemNameLower.includes('elfo') || itemNameLower.includes('elf')) rName = 'elfo';
                        else if (itemNameLower.includes('orc')) rName = 'orc';
                        else if (itemNameLower.includes('anão') || itemNameLower.includes('anao') || itemNameLower.includes('dwarf')) rName = 'anao';
                        
                        if (rName !== '') finalIconPath = `img/races/${rName}.png`;
                    }

                    let imgTag = `<img src="${finalIconPath}" style="${imgStyle}" onerror="this.onerror=null; this.src='${fallbackImg}';">`;
                    let countBadge = item.count > 1 ? `<div class="item-stack-count" style="position: absolute; bottom: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: rgba(20,20,20,0.95); border: 1px solid rgba(255,255,255,0.4); color: #fff; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.9); z-index: 10; pointer-events: none; padding: 0;">${item.count}</div>` : '';

                    bSlot.innerHTML = imgTag + countBadge;
                    bagIndex++;
                }
            });

            if (typeof window.recalculatePlayerStats === 'function') {
                window.recalculatePlayerStats();
            }
        }
    } catch (e) {}
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