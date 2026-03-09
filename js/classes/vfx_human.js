if (!document.getElementById('ks-human-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-human-animations';
    style.innerHTML = `
        @keyframes ks-bleed-drop {
            0% { transform: translate(-50%, -10px) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, 25px) scale(1.2); opacity: 0; }
        }
        @keyframes ks-pixel-orbit {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

window.playHumanFX = function(x, y, skillName, targetX, targetY) {
    const humanSkills = ['Shield Strike', 'Shield Strike_Throw', 'Orbital Blades', 'Blades_On', 'Blades_Off', 'Aegis Shield', 'Heroic Taunt', 'Bleed_Tick', 'Last Hope'];
    if (!humanSkills.includes(skillName)) return false;

    const map = document.getElementById('worldMap'); if(!map) return false;
    
    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.pointerEvents = 'none';
    fx.style.zIndex = '9000'; 
    fx.style.left = x + 'px'; fx.style.top = y + 'px';

    if(skillName === 'Bleed_Tick') {
        fx.style.width = '8px'; fx.style.height = '8px';
        fx.style.background = '#ff2a2a';
        fx.style.borderRadius = '2px';
        fx.style.animation = 'ks-bleed-drop 0.6s ease-in forwards';
        map.appendChild(fx);
        setTimeout(() => fx.remove(), 600);
        return true;
    }

    if (skillName === 'Shield Strike_Throw') {
        fx.style.width = '35px'; fx.style.height = '35px';
        fx.style.transform = 'translate(-50%, -50%)';
        fx.innerHTML = `<img src="img/skills/shieldstrike.png" style="width:100%; height:100%; object-fit:contain; filter: drop-shadow(0 0 12px #ffca28) drop-shadow(0 0 4px #ff9800);">`;
        map.appendChild(fx);

        fx.animate([
            { left: x + 'px', top: y + 'px', transform: 'translate(-50%, -50%) rotate(0deg)' },
            { left: targetX + 'px', top: targetY + 'px', transform: 'translate(-50%, -50%) rotate(720deg)' }
        ], { duration: 300, easing: 'linear', fill: 'forwards' });

        setTimeout(() => {
            fx.remove();
            
            const impact = document.createElement('div');
            impact.style.position = 'absolute'; impact.style.left = targetX + 'px'; impact.style.top = targetY + 'px';
            impact.style.width = '150px'; impact.style.height = '150px';
            impact.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 202, 40, 0.7) 30%, transparent 70%)';
            impact.style.borderRadius = '50%'; impact.style.transform = 'translate(-50%, -50%)';
            impact.style.pointerEvents = 'none'; impact.style.zIndex = '9001';
            impact.style.mixBlendMode = 'screen'; 
            
            impact.animate([ 
                { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1 }, 
                { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 } 
            ], { duration: 350, easing: 'ease-out' });
            
            map.appendChild(impact);
            setTimeout(() => impact.remove(), 350);
        }, 300);
    }
    else if (skillName === 'Blades_On') {
        const cursorNode = document.getElementById('cursor-container');
        if(cursorNode && !document.getElementById('human-orbital-blades')) {
            const aura = document.createElement('div');
            aura.id = 'human-orbital-blades';
            aura.style.position = 'absolute';
            aura.style.left = '22.5px'; aura.style.top = '22.5px';
            aura.style.width = '160px'; aura.style.height = '160px';
            aura.style.borderRadius = '50%';
            aura.style.border = '1px dashed rgba(200, 200, 200, 0.2)'; 
            aura.style.transform = 'translate(-50%, -50%)';
            aura.style.pointerEvents = 'none';
            aura.style.zIndex = '8990';
            
            aura.style.animation = 'ks-pixel-orbit 1.5s linear infinite';
            
            const numSwords = 4;
            const radius = 80; 
            
            for(let i = 0; i < numSwords; i++) {
                let swordContainer = document.createElement('div');
                swordContainer.style.position = 'absolute';
                swordContainer.style.left = '50%';
                swordContainer.style.top = '50%';
                swordContainer.style.width = '0px'; 
                swordContainer.style.height = '0px';
                
                let angle = (i * (360 / numSwords));
                swordContainer.style.transform = `rotate(${angle}deg) translateY(-${radius}px) rotate(90deg)`;
                
                swordContainer.innerHTML = `
                    <div style="position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 3px rgba(255,0,0,0.5));">
                        <div style="width: 4px; height: 16px; background: #e0e0e0; box-shadow: inset -1px 0 #999;"></div>
                        <div style="width: 12px; height: 3px; background: #ffca28; border-top: 1px solid #fff;"></div>
                        <div style="width: 4px; height: 6px; background: #795548;"></div>
                    </div>
                `;
                
                aura.appendChild(swordContainer);
            }

            cursorNode.appendChild(aura);
        }
    }
    else if (skillName === 'Blades_Off') {
        const aura = document.getElementById('human-orbital-blades');
        if(aura) {
            aura.animate([{opacity: 1}, {opacity: 0, transform: 'translate(-50%, -50%) scale(1.2)'}], {duration: 200, fill: 'forwards'});
            setTimeout(() => aura.remove(), 200);
        }
    }
    else if (skillName === 'Aegis Shield') {
        const ground = document.createElement('div');
        ground.style.position = 'absolute'; ground.style.left = x + 'px'; ground.style.top = y + 'px';
        ground.style.width = '250px'; ground.style.height = '250px';
        ground.style.border = '2px solid rgba(0, 191, 255, 0.3)';
        ground.style.borderRadius = '50%';
        ground.style.transform = 'translate(-50%, -50%)';
        ground.style.pointerEvents = 'none';
        ground.animate([
            { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out' });
        map.appendChild(ground);
        setTimeout(() => ground.remove(), 500);

        const cursorNode = document.getElementById('cursor-container');
        if(cursorNode) {
            fx.style.left = '22.5px'; fx.style.top = '22.5px';
            fx.style.transform = 'translate(-50%, -50%)';
            fx.style.width = '60px'; fx.style.height = '60px';
            fx.style.background = 'radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, rgba(0, 191, 255, 0.35) 100%)';
            fx.style.border = '2px solid rgba(0, 191, 255, 0.6)';
            fx.style.borderRadius = '50%';
            fx.style.boxShadow = '0 0 15px rgba(0, 191, 255, 0.4)';
            
            fx.animate([
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' },
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.1 },
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.9 },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(1.2)' }
            ], { duration: 6000 });
            
            cursorNode.appendChild(fx);
            setTimeout(() => fx.remove(), 6000);
        }
    }
    else if (skillName === 'Heroic Taunt') {
        fx.style.width = '400px'; fx.style.height = '400px';
        fx.style.border = '4px solid rgba(255, 202, 40, 0.8)';
        fx.style.borderRadius = '50%';
        fx.style.boxShadow = 'inset 0 0 20px rgba(255, 202, 40, 0.5)';
        fx.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 0 }
        ], { duration: 400, easing: 'ease-in' });
        map.appendChild(fx);
        setTimeout(() => fx.remove(), 400);
    }
    else if (skillName === 'Last Hope') {
        const burst = document.createElement('div');
        burst.style.position = 'absolute'; burst.style.left = x + 'px'; burst.style.top = y + 'px';
        burst.style.width = '300px'; burst.style.height = '300px';
        burst.style.border = '8px solid rgba(255, 202, 40, 0.9)';
        burst.style.borderRadius = '50%';
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.pointerEvents = 'none';
        burst.animate([
            { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 }
        ], { duration: 400, easing: 'ease-out' });
        map.appendChild(burst);
        setTimeout(() => burst.remove(), 400);

        const cursorNode = document.getElementById('cursor-container');
        if(cursorNode) {
            fx.style.left = '22.5px'; fx.style.top = '22.5px';
            fx.style.width = '70px'; fx.style.height = '70px';
            fx.style.background = 'radial-gradient(circle, rgba(255, 202, 40, 0.2) 0%, transparent 80%)';
            fx.style.border = '2px dashed rgba(255, 202, 40, 0.8)';
            fx.style.borderRadius = '50%';
            fx.style.boxShadow = '0 0 20px rgba(255, 202, 40, 0.6)';
            
            fx.animate([
                { transform: 'translate(-50%, -50%) rotate(0deg)' },
                { transform: 'translate(-50%, -50%) rotate(360deg)' }
            ], { duration: 2000, iterations: 3 }); 
            
            cursorNode.appendChild(fx);
            setTimeout(() => fx.remove(), 5000);
        }
    }

    return true; 
};