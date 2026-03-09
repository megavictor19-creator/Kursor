if (!document.getElementById('ks-skill-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-skill-animations';
    style.innerHTML = `
        @keyframes ks-whirlwind { 0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.5); opacity: 1; } 50% { transform: translate(-50%, -50%) rotate(360deg) scale(1.2); opacity: 0.8; } 100% { transform: translate(-50%, -50%) rotate(720deg) scale(1.5); opacity: 0; } }
        @keyframes ks-shield-pulse { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; } 50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; box-shadow: 0 0 30px rgba(0, 229, 255, 1); } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
        @keyframes ks-blood-slash { 0% { transform: translate(-50%, -50%) scale(0.2) rotate(-30deg); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.8) rotate(15deg); opacity: 0; } }
        @keyframes ks-roar-wave { 0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; border-width: 15px; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 1px; } }
        @keyframes ks-earthquake { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; filter: brightness(1.5); } 100% { transform: translate(-50%, -50%) scale(3); opacity: 0; filter: brightness(0.5); } }
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
    const map = document.getElementById('worldMap'); if(!map) return;
    
    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.left = x + 'px';
    fx.style.top = y + 'px';
    fx.style.pointerEvents = 'none';
    fx.style.zIndex = '9000'; 

    if (skillName === 'Arrow Rain') {
        fx.innerText = "🌧️🏹"; fx.style.fontSize = '80px';
        fx.style.transition = 'transform 0.5s ease-in, opacity 0.5s'; fx.style.transform = 'translate(-50%, -150%) scale(0.5)';
        void fx.offsetWidth; fx.style.transform = 'translate(-50%, -50%) scale(1.5)'; fx.style.opacity = '0';
    }
    else if (skillName === 'Divine Light') {
        fx.style.width = '120px'; fx.style.height = '120px'; fx.style.background = 'radial-gradient(circle, rgba(0,255,150,0.8) 0%, rgba(0,0,0,0) 70%)';
        fx.style.borderRadius = '50%'; fx.style.transition = 'transform 0.4s ease-out, opacity 0.4s'; fx.style.transform = 'translate(-50%, -50%) scale(0.2)';
        void fx.offsetWidth; fx.style.transform = 'translate(-50%, -50%) scale(1.2)'; fx.style.opacity = '0';
    }
    else if (skillName === 'Heavy Strike') {
        fx.style.width = '120px'; fx.style.height = '120px'; 
        fx.style.background = 'radial-gradient(circle, rgba(255,42,42,0.6) 0%, transparent 60%)';
        fx.style.borderTop = '8px solid #ff2a2a';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-blood-slash 0.3s ease-out forwards';
    }
    else if (skillName === 'Battle Cry') {
        fx.style.width = '120px'; fx.style.height = '120px';
        fx.style.border = '4px solid rgba(255, 202, 40, 0.9)';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-roar-wave 0.5s ease-out forwards';
    }
    else if (skillName === 'Brutal Charge') {
        fx.style.width = '80px'; fx.style.height = '80px';
        fx.style.background = 'rgba(120, 90, 60, 0.6)';
        fx.style.borderRadius = '50%';
        fx.style.filter = 'blur(6px)';
        fx.style.transition = 'transform 0.4s ease-out, opacity 0.4s';
        fx.style.transform = 'translate(-50%, -50%) scale(0.5)';
        void fx.offsetWidth;
        fx.style.transform = 'translate(-50%, -50%) scale(2.5)';
        fx.style.opacity = '0';
    }
    else if (skillName === 'Earthquake') {
        fx.style.width = '250px'; fx.style.height = '250px';
        fx.style.background = 'radial-gradient(circle, rgba(139, 69, 19, 0.9) 0%, transparent 70%)';
        fx.style.border = '3px dashed #ffae00';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-earthquake 0.6s ease-out forwards';
        
        for(let i=0; i<6; i++) {
            const rock = document.createElement('div');
            rock.innerText = "🪨";
            rock.style.position = "absolute";
            rock.style.left = "50%"; rock.style.top = "50%";
            let rx = (Math.random() - 0.5) * 400; let ry = (Math.random() - 0.5) * 400;
            rock.style.transition = "transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s";
            rock.style.transform = "translate(-50%, -50%) scale(0.5)";
            fx.appendChild(rock);
            setTimeout(() => { rock.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) scale(1.8) rotate(${Math.random()*720}deg)`; rock.style.opacity = "0"; }, 50);
        }
        
        document.body.style.animation = 'none';
        void document.body.offsetWidth;
        document.body.style.animation = 'ks-crit-shake-light 0.4s ease-out';
    }
    else if (skillName === 'Whirlwind') {
        fx.style.width = '160px'; fx.style.height = '160px';
        fx.style.border = '4px solid rgba(255, 42, 42, 0.8)';
        fx.style.borderLeftColor = 'transparent';
        fx.style.borderRightColor = 'transparent';
        fx.style.borderRadius = '50%';
        fx.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        fx.style.animation = 'ks-whirlwind 0.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
    }
    else {
        fx.style.width = '80px'; fx.style.height = '80px'; fx.style.border = `2px solid rgba(255, 255, 255, 0.5)`; fx.style.borderRadius = '50%'; fx.style.transition = 'transform 0.3s ease-out, opacity 0.3s'; fx.style.transform = 'translate(-50%, -50%) scale(0.2)';
        void fx.offsetWidth; fx.style.transform = 'translate(-50%, -50%) scale(1.5)'; fx.style.opacity = '0';
    }

    map.appendChild(fx);
    setTimeout(() => fx.remove(), 600);
};