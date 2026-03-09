if (!document.getElementById('ks-dwarf-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-dwarf-animations';
    style.innerHTML = `
        @keyframes ks-anvil-smash { 0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; border-width: 20px; } 100% { transform: translate(-50%, -50%) scale(3); opacity: 0; border-width: 1px; } }
        @keyframes ks-pull-shockwave { 0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; } }
        @keyframes ks-magma-aura { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; } 50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; } }
    `;
    document.head.appendChild(style);
}

window.dwarfChainLines = {}; 

setInterval(() => {
    const map = document.getElementById('worldMap');
    if (!map || !window.dwarfChains) return;

    let pX = window.globalPlayerX; let pY = window.globalPlayerY;

    for (let mobId in window.dwarfChainLines) {
        if (!window.dwarfChains.includes(mobId)) {
            window.dwarfChainLines[mobId].remove();
            delete window.dwarfChainLines[mobId];
        }
    }

    window.dwarfChains.forEach(mobId => {
        let mob = window.mobState[mobId];
        if (!mob || mob.hp <= 0) return;

        let mX = mob.currentX + 30; let mY = mob.currentY + 30;
        let dist = Math.hypot(pY - mY, pX - mX);
        let angle = Math.atan2(mY - pY, mX - pX) * (180 / Math.PI);

        let line = window.dwarfChainLines[mobId];
        if (!line) {
            line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.background = 'linear-gradient(90deg, #ff4081, #ffae00)';
            line.style.height = '4px';
            line.style.transformOrigin = '0 50%';
            line.style.borderRadius = '2px';
            line.style.boxShadow = '0 0 8px #ff4081';
            line.style.pointerEvents = 'none';
            line.style.zIndex = '8990'; 
            map.appendChild(line);
            window.dwarfChainLines[mobId] = line;
        }

        line.style.left = pX + 'px';
        line.style.top = pY + 'px';
        line.style.width = dist + 'px';
        line.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
        
        if (dist > 180) {
            line.style.height = '2px';
            line.style.filter = 'brightness(2)';
        } else {
            line.style.height = '4px';
            line.style.filter = 'brightness(1)';
        }
    });
}, 33); 

window.playDwarfFX = function(x, y, skillName, targetX, targetY) {
    const dwarfSkills = ['Relentless Pull', 'Seismic Anvil', 'Magma Armor'];
    if (!dwarfSkills.includes(skillName)) return false;

    const map = document.getElementById('worldMap'); if(!map) return false;
    
    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.pointerEvents = 'none';
    fx.style.zIndex = '9000'; 
    fx.style.left = x + 'px'; fx.style.top = y + 'px';

    if (skillName === 'Relentless Pull') {
        fx.style.width = '300px'; fx.style.height = '300px';
        fx.style.border = '4px dashed #ff4081';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-pull-shockwave 0.3s ease-in forwards';
        map.appendChild(fx);
        setTimeout(() => fx.remove(), 300);
    }
    else if (skillName === 'Seismic Anvil') {
        fx.style.width = '440px'; fx.style.height = '440px'; 
        fx.style.border = '10px solid #ffae00';
        fx.style.background = 'radial-gradient(circle, rgba(255, 174, 0, 0.4) 0%, transparent 60%)';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-anvil-smash 0.5s ease-out forwards';
        
        document.body.style.animation = 'none';
        void document.body.offsetWidth;
        document.body.style.animation = 'ks-crit-shake 0.4s ease-out'; 

        map.appendChild(fx);
        setTimeout(() => fx.remove(), 500);
    }
    else if (skillName === 'Magma Armor') {
        const cursorNode = document.getElementById('cursor-container');
        if(!cursorNode) return false;

        fx.style.left = '22.5px'; 
        fx.style.top = '22.5px';
        fx.style.width = '180px'; 
        fx.style.height = '180px';
        fx.style.background = 'radial-gradient(circle, rgba(255, 69, 0, 0.3) 0%, rgba(200, 20, 0, 0.15) 60%, transparent 80%)';
        fx.style.border = '2px dashed rgba(255, 87, 34, 0.5)';
        fx.style.borderRadius = '50%';
        fx.style.boxShadow = '0 0 20px rgba(255, 69, 0, 0.8), inset 0 0 15px rgba(255, 0, 0, 0.4)';
        fx.style.animation = 'ks-magma-aura 1s infinite';
        
        cursorNode.appendChild(fx);

        let partInterval = setInterval(() => {
            if(!cursorNode.contains(fx)) { clearInterval(partInterval); return; }
            let spark = document.createElement('div');
            spark.style.position = 'absolute';
            spark.style.width = '4px'; spark.style.height = '4px';
            spark.style.background = '#ffeb3b';
            spark.style.borderRadius = '50%';
            spark.style.boxShadow = '0 0 5px #ff5722';
            
            let r = Math.random() * 80; let t = Math.random() * 2 * Math.PI;
            spark.style.left = `calc(50% + ${Math.cos(t)*r}px)`;
            spark.style.top = `calc(50% + ${Math.sin(t)*r}px)`;
            
            spark.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${(Math.random()-0.5)*20}px, -40px) scale(0)`, opacity: 0 }
            ], { duration: 600 + Math.random()*400 });
            
            fx.appendChild(spark);
            setTimeout(() => { if(spark.parentNode) spark.remove(); }, 1000);
        }, 100);

        setTimeout(() => fx.remove(), 6000); 
        return true; 
    }

    return true; 
};