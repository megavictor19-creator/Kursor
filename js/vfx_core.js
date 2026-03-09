if (!document.getElementById('ks-core-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-core-animations';
    style.innerHTML = `
        @keyframes ks-whirlwind { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.5); opacity: 1; } 50% { transform: translate(-50%, -50%) rotate(360deg) scale(1.2); opacity: 0.8; } 100% { transform: translate(-50%, -50%) rotate(720deg) scale(1.5); opacity: 0; } }
        @keyframes ks-cursor-click { 0% { transform: scale(1) translateY(0); } 50% { transform: scale(0.9) translateY(4px); } 100% { transform: scale(1) translateY(0); } }
        @keyframes ks-cursor-crit { 0% { transform: scale(1) translateY(0); } 30% { transform: scale(1.2) translateY(-8px); } 60% { transform: scale(0.85) translateY(6px); } 100% { transform: scale(1) translateY(0); } }
        @keyframes ks-crit-shake-light { 0% { transform: translate(0, 0); } 25% { transform: translate(-2px, 2px); } 50% { transform: translate(2px, -1px); } 75% { transform: translate(-1px, 1px); } 100% { transform: translate(0, 0); } }
    `;
    document.head.appendChild(style);
}

window.triggerGroundHit = function(x, y) {
    const map = document.getElementById('worldMap'); if(!map) return;
    const puff = document.createElement('div');
    puff.style.position = 'absolute'; puff.style.left = x + 'px'; puff.style.top = y + 'px';
    puff.style.width = '20px'; puff.style.height = '20px'; 
    puff.style.background = 'rgba(200, 200, 200, 0.4)';
    puff.style.borderRadius = '50%'; puff.style.pointerEvents = 'none'; puff.style.zIndex = '399';
    puff.style.filter = 'blur(2px)';
    puff.style.transition = 'transform 0.2s ease-out, opacity 0.2s linear';
    puff.style.transform = 'translate(-50%, -50%) scale(0.5)';
    map.appendChild(puff);
    
    requestAnimationFrame(() => {
        puff.style.transform = `translate(calc(-50% + ${(Math.random()-0.5)*20}px), calc(-50% + ${(Math.random()-0.5)*20}px)) scale(2)`; 
        puff.style.opacity = '0';
    });
    setTimeout(() => puff.remove(), 200);

    const avatar = document.getElementById('player-avatar');
    if (avatar) {
        avatar.style.animation = 'none';
        void avatar.offsetWidth; 
        avatar.style.animation = 'ks-cursor-click 0.15s ease-out';
    }
};

window.triggerCritSpark = function(x, y) {
    const map = document.getElementById('worldMap'); if(!map) return;
    const puff = document.createElement('div');
    puff.style.position = 'absolute'; puff.style.left = x + 'px'; puff.style.top = y + 'px';
    puff.style.width = '30px'; puff.style.height = '30px'; 
    puff.style.background = 'rgba(220, 200, 150, 0.6)';
    puff.style.borderRadius = '50%'; puff.style.pointerEvents = 'none'; puff.style.zIndex = '399';
    puff.style.filter = 'blur(2px)';
    puff.style.transition = 'transform 0.25s ease-out, opacity 0.25s linear';
    puff.style.transform = 'translate(-50%, -50%) scale(0.5)';
    map.appendChild(puff);
    
    requestAnimationFrame(() => {
        puff.style.transform = `translate(calc(-50% + ${(Math.random()-0.5)*40}px), calc(-50% + ${(Math.random()-0.5)*40}px)) scale(3)`; 
        puff.style.opacity = '0';
    });
    setTimeout(() => puff.remove(), 250);

    const avatar = document.getElementById('player-avatar');
    if (avatar) {
        avatar.style.animation = 'none';
        void avatar.offsetWidth;
        avatar.style.animation = 'ks-cursor-crit 0.25s ease-out';
    }

    document.body.style.animation = 'none';
    void document.body.offsetWidth;
    document.body.style.animation = 'ks-crit-shake-light 0.2s ease-out';
};

window.triggerSkillEffect = function(x, y, skillName, targetX, targetY) {
    if (typeof window.playOrcFX === 'function' && window.playOrcFX(x, y, skillName, targetX, targetY)) return;
    if (typeof window.playElfFX === 'function' && window.playElfFX(x, y, skillName, targetX, targetY)) return;
    if (typeof window.playHumanFX === 'function' && window.playHumanFX(x, y, skillName, targetX, targetY)) return;
    if (typeof window.playDwarfFX === 'function' && window.playDwarfFX(x, y, skillName, targetX, targetY)) return;
    
    const map = document.getElementById('worldMap'); if(!map) return;
    const fx = document.createElement('div');
    fx.style.position = 'absolute'; fx.style.left = x + 'px'; fx.style.top = y + 'px';
    fx.style.pointerEvents = 'none'; fx.style.zIndex = '9000'; 
    fx.style.width = '80px'; fx.style.height = '80px'; fx.style.border = `2px solid rgba(255, 255, 255, 0.5)`; 
    fx.style.borderRadius = '50%'; fx.style.transition = 'transform 0.3s ease-out, opacity 0.3s'; 
    fx.style.transform = 'translate(-50%, -50%) scale(0.2)';
    map.appendChild(fx);
    void fx.offsetWidth; 
    fx.style.transform = 'translate(-50%, -50%) scale(1.5)'; fx.style.opacity = '0';
    setTimeout(() => fx.remove(), 600);
};